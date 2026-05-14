import {User} from "../models/User.ts";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import io from "../server.js"
import {getTracksBySecret} from "./TrackController.js";
import {Track} from "../models/Track.ts";
import {sequelize} from "../models/index.js";
import {literal, sql} from "@sequelize/core";

dotenv.config();

function sendVerificationLink(email) {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_FROM,
            pass: process.env.MAIL_PASSWORD
        }
    })

    const tokenEmailVerify = jwt.sign({ email }, process.env.SECRET_KEY, {
        expiresIn: '5m', //для тестов
    })

    const tokenAuth = jwt.sign({ email }, process.env.SECRET_KEY)

    const result = transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject: "Spotify Clone",
        html: `Для подтверждения email перейдите по <a href="${process.env.IP_APP}/api/users/verify-email?token=${tokenEmailVerify}">ссылке</a>`
    })

    return tokenAuth;
}
//TODO: сделать одноразовую ссылку
const verifyEmail = async (req, res) => {
    const token = req.query.token;

    try {
        const email = jwt.verify(token, process.env.SECRET_KEY).email;
        console.log(email)

        io.to(`user:${email}`).emit('email-verified', { message: email });
        return res.status(200).send({})
    } catch (error) {
        return res.status(500).send({error: "Token verifying error"});
    }
}

const reg = async (req, res) => {
    const regData = req.body;

    const [user, created] = await User.findOrCreate({
            where: {
                email: regData.email,
            },
            defaults: regData
        }
    )

    if (!created) {
        console.log(created);

        return res.status(409).json({})
    }

    res.status(201).send(sendVerificationLink(regData.email))
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
        { id: user.id, email: user.email },
        process.env.SECRET_KEY
    )

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
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

export const updateUser = async (req, res) => {
    const id = req.user.id;

    users_cache.delete(id)

    const user = await User.findByPk(id)

    if (!user) {
        res.clearCookie('token');
        return res.status(404).json({})
    }

    users_cache.set(id, {user, expiresOn: Date.now() + 5 * 60 * 1000})

    return user
}

export const getUser = async (req, res) => {
    let id;
    const userId = req.params.userId

    userId === 'me' ? id = req.user.id : id = userId;

    const user_cache = users_cache.get(id)

    if (!user_cache) return updateUser(req, res);

    const { user, expiresOn } = user_cache

    if (expiresOn <= Date.now()) return updateUser(req, res);

    return user
}

const getUsersByNickname = async (req, res) => {
    const nickname = req.body.nickname

    const user = await User.findAll({
        where: { nickname },
        attributes: {
            exclude: ['password_hash', 'createdAt', 'updatedAt'],
        }
    })

    if (!user) {
        return res.status(404).json({})
    } else {
        return res.status(200).send(user)
    }
}

const normalizedSearch = async (req, res) => {
    const search_query = req.body.search_query;
    const normalizedQuery = stringNormalization.normalizeString(search_query);

    const result = await Track.findAll({
        where: sequelize.where(
            sequelize.fn('similarity', sequelize.col('title'), normalizedQuery),
            '>=',
            0.3 // Порог схожести
        ),
        order: [[sequelize.fn('similarity', sequelize.col('title'), normalizedQuery), 'DESC']],
        limit: 10 // Количество вхождений
    });

    return res.status(200).json(result);
}

const getReleases = async (req, res) => {
    const user = await getUser(req, res)

    const result = await user.getFavoriteReleases({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'icpn']
        },
        order: [[literal('"userFavoriteRelease.createdAt"'), 'DESC']]
    }).then(releases => releases.map(release => ({
        ...release.toJSON(),
        date: new Date(release.date).getFullYear()
    })))

    res.status(200).send(result)
}

const getTracks = async (req, res) => {
    const user = await getUser(req, res)

    const result = await user.getFavoriteTracks({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'isrc']
        },
        order: [[literal('"userFavoriteTrack.createdAt"'), 'DESC']]
    }).then(tracks => getTracksBySecret(req, res, tracks, user));

    res.status(200).send(result)
}

const addFavoriteTrack = async (req, res) => {
    const user = await getUser(req, res)
    const trackId = req.params['trackId'];

    try {
        await sequelize.transaction(async t => {
            await user.addFavoriteTrack(trackId, { transaction: t });
        });

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

const removeFavoriteTrack = async (req, res) => {
    const user = await getUser(req, res)
    const trackId = req.params['trackId'];

    try {
        await sequelize.transaction(async t => {
            await user.removeFavoriteTrack(trackId, { transaction: t });
        });

        return res.status(200).send({});
    } catch {
        return res.status(500).send({});
    }
}

const getFavoriteArtists = async (req, res) => {
    const user = await getUser(req, res)

    const result = await user.getFavoriteArtists({
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        order: [[literal('"userFavoriteArtist.createdAt"'), 'DESC']]
    }).then(artists => Promise.all(artists.map(async artist => ({
        ...artist.toJSON(),
        trackCount: await artist.countTracks()
    }))))

    res.status(200).send(result)
}

const getFavoritePlaylists = async (req, res) => {
    const user = await getUser(req, res)

    const result = await user.getFavoritePlaylists({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'userFavoritePlaylist']
        },
        order: [[literal('"userFavoritePlaylist.createdAt"'), 'DESC']]
    }).then(playlists => Promise.all(playlists.map(async playlist => ({
        ...playlist.toJSON(),
        trackCount: await playlist.countTracks()
    }))))

    res.status(200).send(result)
}

export default {
    reg,
    auth,
    logout,
    verifyEmail,
    normalizedSearch,
    getUsersByNickname,
    getReleases,
    getTracks,
    addFavoriteTrack,
    removeFavoriteTrack,
    getFavoriteArtists,
    getFavoritePlaylists
}
