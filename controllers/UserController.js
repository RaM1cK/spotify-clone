import {User} from "../models/User.ts";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import io from "../server.js"
import {
    getFavoriteTrackIdsSet,
    getTracksBySecret,
    getTracksBySecretFromCache,
    trackAttributes,
    trackCountQuery
} from "./TrackController.js";
import {literal, Op} from "@sequelize/core";
import stringNormalization from "../helpers/stringNormalization.js";
import {redisClient, sequelize} from "../models/index.js";
import {Message} from "../models/Message.ts";
import {artistAttributes} from "./ArtistController.js";
import {playlistAttributes} from "./PlaylistController.js";
import {Friendship} from "../models/Friendship.ts";
import {getFavoriteReleaseIdsSet, releaseAttributes} from "./ReleaseController.js";

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

const users_cache = new Map()

export const logout = async (req, res) => {
    res.clearCookie('token');
    res.status(200).send({});
}

export const updateUser = async (req, res, id) => {
    users_cache.delete(id)

    const user = await User.findByPk(id, {
        attributes: {
            exclude: ['password_hash', 'createdAt', 'updatedAt'],
        }
    })

    if (!user) {
        return res.status(404).json({})
    }

    users_cache.set(id, {user, expiresOn: Date.now() + 5 * 60 * 1000})

    return user
}

export const getUser = async (req, res) => {
    let id;
    const userId = req.params.userId
    userId === 'me' || userId === undefined ? id = req.user.id : id = userId;

    const user_cache = users_cache.get(id)

    if (!user_cache) return updateUser(req, res, id);

    const { user, expiresOn } = user_cache

    if (expiresOn <= Date.now()) return updateUser(req, res, id);

    return user;
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
    const searchResult =
        await redisClient.get(`search:${normalizedQuery}`);

    if (searchResult)
        return res.status(200).send(JSON.parse(searchResult));

    const tables = {
        track: 'tracks',
        artist: 'artists',
        release: 'releases'
    }

    const subQuery = (type, column, limit = 0) =>
        `(
            SELECT 
                id, 
                '${type}' AS type,
                GREATEST(
                    similarity(${column}, :query),
                    word_similarity(${column}, :query)
                ) AS score
            FROM ${tables[type]}
            WHERE 
                ${column} % :query 
                OR ${column} <% :query
            ORDER BY score DESC
            ${limit > 0 ? `LIMIT ${limit}` : ''}
        )`

    const result = await sequelize.query(`
        SET pg_trgm.similarity_threshold = 0.0001;
        SET pg_trgm.word_similarity_threshold = 0.0001;
    
        ${subQuery('artist', 'name_normalized', 20)}
        UNION ALL
        ${subQuery('track', 'title_normalized', 50)}
        UNION ALL
        ${subQuery('release', 'title_normalized', 20)}
    `, {
        replacements: { query: normalizedQuery }
    })

    redisClient
        .set(`search:${normalizedQuery}`, JSON.stringify(result[0]), { EX: 10 * 60})
        .catch(err => console.log(err))

    return res.status(200).json(result[0]);
}

const getReleases = async (req, res) => {
    const targetUser = await getUser(req, res)
    const currentUserId = req.user.id
    const isOwn = targetUser.id === currentUserId

    const cachedValue =
        await redisClient.get(`favoriteReleases:${req.user.id}`)

    let releaseList = null;
    if (cachedValue) releaseList = JSON.parse(cachedValue)

    if (!releaseList) {
        const result = await targetUser.getFavoriteReleases({
            attributes: releaseAttributes,
            order: [[literal('"userFavoriteRelease.createdAt"'), 'DESC']]
        })

        releaseList = result.map(r => {
            const {userFavoriteRelease, date, ...rest} = r.dataValues

            return {
                ...rest,
                date: new Date(date).getFullYear()
            }
        })

        redisClient
            .set(`favoriteReleases:${req.user.id}`, JSON.stringify(releaseList), {EX: 3600})
            .catch(err => console.log(err))
    }

    if (isOwn) {
        res.status(200).send(releaseList.map(t => ({ ...t, hasInFavorite: true })))
    } else {
        const favSet = await getFavoriteReleaseIdsSet(currentUserId, releaseList)
        res.status(200).send(releaseList.map(t => ({ ...t, hasInFavorite: favSet.has(t.id) })))
    }
}

const getTracks = async (req, res) => {
    const targetUser = await getUser(req, res)
    const currentUserId = req.user.id
    const isOwn = targetUser.id === currentUserId

    const cachedValue =
        await redisClient.get(`favoriteTracks:${targetUser.id}`)

    let trackList = null
    if (cachedValue) trackList = JSON.parse(cachedValue)

    if (!trackList) {
        const result = await targetUser.getFavoriteTracks({
            attributes: trackAttributes,
            order: [[literal('"userFavoriteTrack.createdAt"'), 'DESC']]
        })

        trackList = result.map(t => {
            const {userFavoriteTrack, ...rest} = t.dataValues

            return rest
        })

        redisClient
            .set(`favoriteTracks:${targetUser.id}`, JSON.stringify(trackList), { EX: 3600 })
            .catch(err => console.log(err));
    }

    const response = getTracksBySecretFromCache(req, res, trackList)

    if (isOwn) {
        res.status(200).send(response.map(t => ({ ...t, hasInFavorite: true })))
    } else {
        const favSet = await getFavoriteTrackIdsSet(currentUserId)
        res.status(200).send(response.map(t => ({ ...t, hasInFavorite: favSet.has(t.id) })))
    }
}

const addFavoriteTrack = async (req, res) => {
    const user = await getUser(req, res)
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
    const user = await getUser(req, res)
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

const getFavoriteArtists = async (req, res) => {
    const user = await getUser(req, res)

    const result = await user.getFavoriteArtists({
        attributes: [
            ...artistAttributes,
            [trackCountQuery('Artist'), 'trackCount']
        ],
        order: [[literal('"userFavoriteArtist.createdAt"'), 'DESC']]
    })

    res.status(200).send(result.map(artist => {
        const {userFavoriteArtist, ...rest} = artist.toJSON();

        return rest;
    }))
}

const getFavoritePlaylists = async (req, res) => {
    const user = await getUser(req, res)

    const result = await user.getFavoritePlaylists({
        attributes: [
            ...playlistAttributes,
            [trackCountQuery('Playlist'), 'trackCount']
        ],
        order: [[literal('"userFavoritePlaylist.createdAt"'), 'DESC']]
    }).then(playlists => playlists.map(playlist => {
        const {userFavoritePlaylist, ...rest} = playlist.toJSON();

        return rest
    }))

    res.status(200).send(result)
}

const getChats = async (req, res) => {
    const user = await getUser(req, res)

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
    verifyEmail,
    normalizedSearch,
    getUser,
    getUsersByNickname,
    getReleases,
    getTracks,
    addFavoriteTrack,
    removeFavoriteTrack,
    getFavoriteArtists,
    getFavoritePlaylists,
    getChats,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    sendFriendRequest,
}
