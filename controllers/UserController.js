import {User} from "../models/User.ts";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import io from "../server.js"
import {
    getFavoriteTrackIdsSet,
    trackAttributes,
    trackCountQuery
} from "./TrackController.js";
import {literal, Op, sql} from "@sequelize/core";
import stringNormalization from "../helpers/stringNormalization.js";
import {redisClient, sequelize} from "../models/index.js";
import {Message} from "../models/Message.ts";
import {artistAttributes, getFavoriteArtistIdsSet} from "./ArtistController.js";
import {playlistAttributes} from "./PlaylistController.js";
import {Friendship} from "../models/Friendship.ts";
import {getFavoriteReleaseIdsSet, releaseAttributes} from "./ReleaseController.js";
import sharp from "sharp";
import fs from "fs";

dotenv.config();

export const userAttributes = [
    'id',
    'nickname',
    'email',
    'avatar'
]

function sendVerificationLink(regData) {
    const {email} = regData;

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.MAIL_PASSWORD
        }
    })

    const tokenEmailVerify = jwt.sign(regData, process.env.SECRET_KEY, {
        expiresIn: '5m', //для тестов
    })

    redisClient
        .set(`verification:${email}`, 1, { EX: 5 * 60})
        .catch(err => console.log(err))

    console.log(`${process.env.IP_APP}/api/users/verify-email?token=${tokenEmailVerify}`)

    transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Spotify Clone",
        html: `Для подтверждения email перейдите по <a href="${process.env.IP_APP}/api/users/verify-email?token=${tokenEmailVerify}">ссылке</a>`
    })
        .then(res => console.log(res))
        .catch(err => console.log(err))
}

const verifyEmail = async (req, res) => {
    try {
        const token = jwt.verify(req.query.token, process.env.SECRET_KEY);

        const verification =
            await redisClient.get(`verification:${token.email}`)

        if (!verification) return res.status(400).send({ error: "Ссылка не действительна"})

        let user;
        await sequelize.transaction(async t => {
            user = await User.create(token, {transaction: t})
        })

        io.to(`user:${token.email}`).emit('success-verification')

        redisClient
            .del(`verification:${token.email}`)
            .catch(err => console.log(err))

        return res.status(200).send({})
    } catch (error) {
        return res.status(400).send({error: "Ссылка не действительна"});
    }
}

const reg = async (req, res) => {
    const regData = req.body;

    const verification =
        await redisClient.get(`verification:${regData.email}`)

    if (verification) return res.status(409).send({ error: "Ссылка на email уже отправлена"})

    const user = await User.findOne({
            where: {
                email: regData.email,
            }
        }
    )

    if (user) return res.status(409).send({error: "User already exists"});

    sendVerificationLink(regData);

    res.status(201).send({})
}

const auth = async (req, res) => {
    const authData = req.body;

    const user = await User.findOne({
        where: {
            email: authData.email,
        }
    })

    if (!user) {
        return res.status(409).json({})
    } else if (user.password_hash !== authData.password_hash) {
        return res.status(400).json({})
    }

    const token = jwt.sign(
        { id: user.id },
        process.env.SECRET_KEY
    )

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7
    })

    res.status(200).send({
        id: user.id,
        email: user.email,
        nickname: user.nickname
    })
}

const edit = async (req, res) => {
    const id = req.user.id;
    const fields = {}

    if (req.body.email) fields.email = req.body.email;
    if (req.body.nickname) fields.nickname = req.body.nickname;

    const updateDB = async () => {
        await sequelize.transaction(async t => {
            await User.update(fields, {
                where: { id },
                transaction: t
            })

            redisClient
                .del(`user:${id}`)
                .catch(err => console.log(err))
        })
    }

    if (req.file) {
        const filename = `${id}.jpg`
        const filepath = `images/users/${filename}`

        try {
            await sharp(req.file.buffer)
                .jpeg({ quality: 85 })
                .toFile(`music/${filepath}`)

            fields.avatar = filepath

            await updateDB()

            return res.status(200).send({
                email: fields.email,
                nickname: fields.nickname,
                avatar: `${filepath}?t=${Date.now()}`
            })
        } catch (error) {
            console.log(error)

            fs.unlink(`music/${filepath}`, () => {})

            return res.status(500).send({error: 'Upload failed'})
        }
    } else {
        try {
            await updateDB()

            return res.status(200).send({
                email: fields.email,
                nickname: fields.nickname
            })
        } catch (error) {
            console.log(error)

            return res.status(500).send({error: 'Upload failed'})
        }
    }
}

export const logout = async (req, res) => {
    res.clearCookie('token');
    res.status(200).send({});
}

export const getUserId = (req) => {
    let id;
    const userId = req.params.userId
    userId === 'me' || userId === undefined ? id = req.user.id : id = userId;

    return id;
}

const getUsersByNickname = async (req, res) => {
    const nickname = req.body.nickname

    const users = await User.findAll({
        where: {
            nickname: { [Op.iLike]: `%${nickname}%` },
            id: { [Op.ne]: req.user.id }
        },
        attributes: {
            exclude: ['password_hash', 'createdAt', 'updatedAt'],
        }
    })

    return res.status(200).send(users)
}

const normalizedSearch = async (req, res) => {
    const search_query = req.query.query;
    const normalizedQuery = stringNormalization.normalizeString(search_query);

    const similarity_threshold = 0.2
    const word_similarity_threshold = 0.2

    const searchArtists = async (column, limit = 0) => {
        const rows = await sequelize.query(`
            SET pg_trgm.similarity_threshold = ${similarity_threshold};
            SET pg_trgm.word_similarity_threshold = ${word_similarity_threshold};

            SELECT 
                id,
                name,
                avatar,
                GREATEST(
                    similarity(:query, ${column}),
                    word_similarity(:query, ${column})
                ) AS score,
                (
                    SELECT COUNT(*)
                    FROM "ArtistTrack" at
                    WHERE at."artistId" = a."id"
                ) as "trackCount"
            FROM artists a
            WHERE :query % ${column} OR :query <% ${column} OR ${column} ILIKE '%' || :query || '%'
            ORDER BY score DESC
            ${limit > 0 ? `LIMIT ${limit}` : ''}
        `, {
            replacements: { query: normalizedQuery }
        })

        return rows[0]
    }

    const searchTracks = async (column, limit = 0) => {
        const rows = await sequelize.query(`
            SET pg_trgm.similarity_threshold = ${similarity_threshold};
            SET pg_trgm.word_similarity_threshold = ${word_similarity_threshold};

            SELECT 
                id,
                title,
                artist,
                duration,
                cover,
                parental_warning as "parentalWarning",
                release_id as "releaseId",
                GREATEST(
                    similarity(:query, ${column}),
                    word_similarity(:query, ${column})
                ) AS score
            FROM tracks
            WHERE :query % ${column} OR :query <% ${column} OR ${column} ILIKE '%' || :query || '%'
            ORDER BY score DESC
            ${limit > 0 ? `LIMIT ${limit}` : ''}
        `, {
            replacements: { query: normalizedQuery }
        })

        return rows[0]
    }

    const searchReleases = async (column, limit = 0) => {
        const rows = await sequelize.query(`
            SET pg_trgm.similarity_threshold = ${similarity_threshold};
            SET pg_trgm.word_similarity_threshold = ${word_similarity_threshold};

            SELECT 
                id,
                type,
                title,
                artist,
                cover,
                parental_warning as "parentalWarning",
                EXTRACT(YEAR FROM date) as date,
                GREATEST(
                    similarity(:query, ${column}),
                    word_similarity(:query, ${column})
                ) AS score
            FROM releases
            WHERE :query % ${column} OR :query <% ${column} OR ${column} ILIKE '%' || :query || '%'
            ORDER BY score DESC
            ${limit > 0 ? `LIMIT ${limit}` : ''}
        `, {
            replacements: { query: normalizedQuery }
        })

        return rows[0]
    }

    const [artists, tracks, releases] = await Promise.all([
        searchArtists('name_normalized', 20),
        searchTracks('title_normalized', 50),
        searchReleases('title_normalized', 20)
    ])

    const favArtists = await getFavoriteArtistIdsSet(req.user.id)
    const favTracks = await getFavoriteTrackIdsSet(req.user.id)
    const favReleases = await getFavoriteReleaseIdsSet(req.user.id)

    const grouped = {
        artists: artists.map(artist => ({
            ...artist,
            score: undefined,
            hasInFavorite: favArtists.has(artist.id)
        })),
        tracks: tracks
            .map(track => ({
                ...track,
                score: undefined,
                hasInFavorite: favTracks.has(track.id)
            })),
        releases: releases.map(release => ({
            ...release,
            score: undefined,
            hasInFavorite: favReleases.has(release.id)
        })),
    }

    return res.status(200).json(grouped);
}

export const getUserFavoriteReleaseList = async (userId) => {
    const cached = await redisClient.get(`favoriteReleases:${userId}`)
    if (cached) return JSON.parse(cached)

    const user = await User.findByPk(userId)

    const result = await user.getFavoriteReleases({
        attributes: releaseAttributes,
        through: { attributes: [] },
        order: [[literal('"userFavoriteRelease.createdAt"'), 'DESC']]
    })

    const releaseList = result.map(r => {
        const {userFavoriteRelease, date, ...rest} = r.dataValues
        return {
            ...rest,
            date: new Date(date).getFullYear()
        }
    })

    redisClient
        .set(`favoriteReleases:${userId}`, JSON.stringify(releaseList), { EX: 3600 })
        .catch(err => console.log(err))

    return releaseList
}

const getReleases = async (req, res) => {
    const targetUserId = getUserId(req)
    const isOwn = targetUserId === req.user.id

    const releaseList = await getUserFavoriteReleaseList(targetUserId)

    if (isOwn) {
        res.status(200).send(releaseList.map(t => ({ ...t, hasInFavorite: true })))
    } else {
        const favoriteReleases = await getUserFavoriteReleaseList(req.user.id)

        const favSet = new Set(favoriteReleases.map(t => t.id))

        res.status(200).send(releaseList.map(t => ({ ...t, hasInFavorite: favSet.has(t.id) })))
    }
}

const addFavoriteRelease = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const releaseId = req.params.releaseId;

    try {
        await sequelize.transaction(async t => {
            await user.addFavoriteRelease(releaseId, { transaction: t });
        });

        redisClient
            .del(`favoriteReleases:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

const removeFavoriteRelease = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const releaseId = req.params.releaseId;

    try {
        await sequelize.transaction(async t => {
            await user.removeFavoriteRelease(releaseId, { transaction: t });
        });

        redisClient
            .del(`favoriteReleases:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

export const getUserFavoriteTrackList = async (userId) => {
    const cached = await redisClient.get(`favoriteTracks:${userId}`)
    if (cached) return JSON.parse(cached)

    const user = await User.findByPk(userId)

    const result = await user.getFavoriteTracks({
        attributes: trackAttributes,
        through: { attributes: [] },
        order: [[literal('"userFavoriteTrack.createdAt"'), 'DESC']]
    })

    const trackList = result.map(t => {
        const {userFavoriteTrack, ...rest} = t.dataValues
        return rest
    })

    redisClient
        .set(`favoriteTracks:${userId}`, JSON.stringify(trackList), { EX: 3600 })
        .catch(err => console.log(err))

    return trackList
}

const getTracks = async (req, res) => {
    const targetUserId = getUserId(req)
    const isOwn = targetUserId === req.user.id

    const trackList = await getUserFavoriteTrackList(targetUserId)

    if (isOwn) {
        res.status(200).send(trackList.map(t => ({ ...t, hasInFavorite: true })))
    } else {
        const favoriteTracks = await getUserFavoriteTrackList(req.user.id)

        const favSet = new Set(favoriteTracks.map(t => t.id))

        res.status(200).send(trackList.map(t => ({ ...t, hasInFavorite: favSet.has(t.id) })))
    }
}

const addFavoriteTrack = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const trackId = req.params.trackId;

    try {
        await sequelize.transaction(async t => {
            await user.addFavoriteTrack(trackId, { transaction: t });
        });

        redisClient
            .del(`favoriteTracks:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

const removeFavoriteTrack = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const trackId = req.params.trackId;

    try {
        await sequelize.transaction(async t => {
            await user.removeFavoriteTrack(trackId, { transaction: t });
        });

        redisClient
            .del(`favoriteTracks:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

export const getUserFavoriteArtistList = async (userId) => {
    const cached =
        await redisClient.get(`favoriteArtists:${userId}`)

    if (cached) return JSON.parse(cached)

    const user = await User.findByPk(userId)

    const result = await user.getFavoriteArtists({
        attributes: [
            ...artistAttributes,
            [trackCountQuery('Artist'), 'trackCount']
        ],
        through: { attributes: [] },
        order: [[literal('"userFavoriteArtist.createdAt"'), 'DESC']]
    })

    const artistList = result.map(a => {
        const {userFavoriteArtist, ...rest} = a.dataValues
        return rest
    })

    redisClient
        .set(`favoriteArtists:${userId}`, JSON.stringify(artistList), { EX: 3600 })
        .catch(err => console.log(err))

    return artistList
}

const getFavoriteArtists = async (req, res) => {
    const targetUserId = getUserId(req)
    const isOwn = targetUserId === req.user.id

    const artistList = await getUserFavoriteArtistList(targetUserId)

    if (isOwn) {
        res.status(200).send(artistList.map(t => ({ ...t, hasInFavorite: true })))
    } else {
        const favoriteArtists = await getUserFavoriteArtistList(req.user.id)

        const favSet = new Set(favoriteArtists.map(t => t.id))

        res.status(200).send(artistList.map(t => ({ ...t, hasInFavorite: favSet.has(t.id) })))
    }
}

const addFavoriteArtist = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const artistId = req.params.artistId;

    try {
        await sequelize.transaction(async t => {
            await user.addFavoriteArtist(artistId, { transaction: t });
        });

        redisClient
            .del(`favoriteArtists:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

const removeFavoriteArtist = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const artistId = req.params.artistId;

    try {
        await sequelize.transaction(async t => {
            await user.removeFavoriteArtist(artistId, { transaction: t });
        });

        redisClient
            .del(`favoriteArtists:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

export const getUserFavoritePlaylists = async (userId) => {
    const cached =
        await redisClient.get(`favoritePlaylists:${userId}`)

    if (cached) return JSON.parse(cached)

    const user = await User.findByPk(userId)

    const result = await user.getFavoritePlaylists({
        attributes: [
            ...playlistAttributes,
            [trackCountQuery('Playlist'), 'trackCount']
        ],
        through: { attributes: [] },
        order: [[literal('"userFavoritePlaylist.createdAt"'), 'DESC']]
    })

    const playlists = result.map(p => {
        const {userFavoritePlaylist, ...rest} = p.dataValues
        return rest
    })

    redisClient
        .set(`favoritePlaylists:${userId}`, JSON.stringify(playlists), { EX: 3600 })
        .catch(err => console.log(err))

    return playlists
}

const getFavoritePlaylists = async (req, res) => {
    const targetUserId = getUserId(req)
    const isOwn = targetUserId === req.user.id

    const playlists = await getUserFavoritePlaylists(targetUserId)

    if (isOwn) {
        res.status(200).send(playlists.map(p => ({ ...p, hasInFavorite: true })))
    } else {
        const favoritePlaylists = await getUserFavoritePlaylists(req.user.id)

        const favSet = new Set(favoritePlaylists.map(p => p.id))

        res.status(200).send(playlists.map(p => ({ ...p, hasInFavorite: favSet.has(p.id) })))
    }
}

const addFavoritePlaylist = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const playlistId = req.params.playlistId;

    try {
        await sequelize.transaction(async t => {
            await user.addFavoritePlaylist(playlistId, { transaction: t });
        });

        redisClient
            .del(`favoritePlaylists:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

const removeFavoritePlaylist = async (req, res) => {
    const user = await User.findByPk(req.user.id)
    const playlistId = req.params.playlistId;

    try {
        await sequelize.transaction(async t => {
            await user.removeFavoritePlaylist(playlistId, { transaction: t });
        });

        redisClient
            .del(`favoritePlaylists:${req.user.id}`)
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

const getChats = async (req, res) => {
    const user = await User.findByPk(req.user.id)

    const result = await user.getChats({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        include: [
            {
                model: Message,
                as: 'messages',
                separate: true,
                include: {
                    model: Message,
                    as: 'quotedMessage',
                    attributes: ['id', 'data', 'senderId', 'createdAt', 'dataType']
                }
            },
            {
                model: User,
                as: 'users',
                attributes: userAttributes,
                through: { attributes: [] }
            }
        ]
    })

    res.status(200).send(
        result.map(chat => {
            const {userChat, ...rest} = chat.toJSON();

            return rest;
        })
    )
}

const acceptFriendRequest = async (req, res) => {
    const senderId = req.params.senderId

    try {
        await sequelize.transaction(async t => {
            await Friendship.update(
                {
                    request_accepted: true
                },
                {
                    where: {
                        senderId,
                        receiverId: req.user.id
                    },
                    transaction: t
                }
            )
        })

        redisClient
            .del([`friendships:${req.user.id}`, `friendships:${senderId}`])
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch (error) {
        return res.status(500).send({});
    }
}

const rejectFriendRequest = async (req, res) => {
    const senderId = req.params.senderId

    try {
        await sequelize.transaction(async t => {
            await Friendship.destroy({
                where: {
                    senderId,
                    receiverId: req.user.id
                },
                transaction: t
            })
        })

        redisClient
            .del([`friendships:${req.user.id}`, `friendships:${senderId}`])
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch (error) {
        return res.status(500).send({});
    }
}

const cancelFriendRequest = async (req, res) => {
    const receiverId = req.params.receiverId

    try {
        await sequelize.transaction(async t => {
            await Friendship.destroy({
                where: {
                    senderId: req.user.id,
                    receiverId
                },
                transaction: t
            })
        })

        redisClient
            .del([`friendships:${req.user.id}`, `friendships:${receiverId}`])
            .catch(err => console.log(err));

        return res.status(200).send({});
    } catch (error) {
        return res.status(500).send({});
    }
}

const sendFriendRequest = async (req, res) => {
    const receiverId = req.params.receiverId

    try {
        await sequelize.transaction(async t => {
            await Friendship.create({
                senderId: req.user.id,
                receiverId,
                request_accepted: false
            }, { transaction: t })
        })

        redisClient
            .del([`friendships:${req.user.id}`, `friendships:${receiverId}`])
            .catch(err => console.log(err))

        return res.status(200).send({})
    } catch (error) {
        return res.status(500).send({})
    }
}

export default {
    reg,
    auth,
    logout,
    edit,
    verifyEmail,
    normalizedSearch,
    getUsersByNickname,
    getReleases, addFavoriteRelease, removeFavoriteRelease,
    getTracks, addFavoriteTrack, removeFavoriteTrack,
    getFavoriteArtists, addFavoriteArtist, removeFavoriteArtist,
    getFavoritePlaylists, addFavoritePlaylist, removeFavoritePlaylist,
    getChats,
    acceptFriendRequest, rejectFriendRequest, cancelFriendRequest, sendFriendRequest,
}
