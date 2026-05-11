import path from "path";
import {__dirname} from "../server.js";
import * as fs from "node:fs";
import dotenv from "dotenv";
import {Track} from "../models/Track.ts";
import jwt from "jsonwebtoken";
import * as crypto from "node:crypto";
import {literal} from "@sequelize/core";
import {redisClient} from "../models/index.js";
import {getUser} from "./UserController.js";

dotenv.config();

export const trackAttributes = [
    'id',
    'title',
    'artist',
    'duration',
    'cover',
    'uri',
    'releaseId',
]

export const hasInFavoriteQuery = (userId, alias = 'tracks') => literal(`(
    select exists (
        select 1
        from "FavoriteTracks" ft
        where ft."trackId" = "${alias}"."id" and ft."userId" = '${userId}'
    )
)`)

export const trackCountQuery = (alias) => literal(`(
    select count(*) 
    from "${alias}Track"
    where "${alias}Track"."${alias.toLowerCase()}Id" = "${alias}"."id"
)`)

// export const getTrack = async (req, res)=> {
//     const id = req.params['trackId'];
//
//     const track = await Track.findByPk(id,{
//         attributes: {
//             exclude: ['isrc', 'createdAt', 'updatedAt', 'releaseId']
//         },
//     })
//
//     if (!track) {
//         return res.status(404).json({})
//     }
//
//     return res.json(track);
// }

export const getTracksBySecret = (req, res, tracks) => {
    const fingerprint = crypto
        .createHash('sha256')
        .update(req.ip + req.headers['user-agent'] + req.user.id)
        .digest('hex')

    return tracks.map(track => {
        const {
            uri,
            hasInFavorite,
            userFavoriteTrack,
            artistTrack,
            PlaylistTrack,
            ...rest
        } = track.toJSON()

        redisClient
            .set(`track:${track.id}`, JSON.stringify({...rest, uri}))
            .catch(err => console.log(err));

        return {
            ...rest,
            hasInFavorite,
            token: jwt.sign(
            {
                ...rest,
                uri,
                fingerprint
            }, process.env.SECRET_KEY)
        }
    })
}

export const getTracksBySecretFromCache = (req, res, tracks) => {
    const fingerprint = crypto
        .createHash('sha256')
        .update(req.ip + req.headers['user-agent'] + req.user.id)
        .digest('hex')

    return tracks.map(track => {
        const {
            uri,
            ...rest
        } = track

        return {
            ...rest,
            token: jwt.sign(
                {
                    ...rest,
                    uri,
                    fingerprint
                }, process.env.SECRET_KEY)
        }
    })
}

export const saveLastPosition = async (req, res) => {
    const token = req.body.token;
    const position = req.body.position

    let track;
    try {
        track = jwt.verify(token, process.env.SECRET_KEY)
    } catch (err) {
        return res.status(403).json({})
    }

    const {iat, hasInFavorite, fingerprint, ...restTrack} = track;

    redisClient
        .set(`currentTrack:${req.user.id}`, JSON.stringify({...restTrack, start: position}))
        .catch(err => res.status(500).json(err));

    res.status(200).json({})
}

export const getTrackFile = async (req, res)=> {
    const token = req.query.token;

    let track;
    try {
        track = jwt.verify(token, process.env.SECRET_KEY)
    } catch (err) {
        return res.status(403).json({})
    }

    const filePath = path.join(__dirname, 'music', track.uri);


    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const range = req.headers.range;

    const chunk = 3 * 1024 * 1024;

    const parts = range.replace(/bytes=/, "").split("-");

    const start = parseInt(parts[0], 10)

    const end = start + chunk >= fileSize ? fileSize - 1 : start + chunk;

    const fileStream = fs.createReadStream(filePath, { start, end});

    fileStream.on('error', () => {
        fileStream.destroy()
        if (!res.headersSent) {
            res.sendStatus(500);
        }
    })

    const chunkSize = end - start + 1

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Disposition': `inline`,
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });

    fileStream.pipe(res);
}

export default {getTrackFile, saveLastPosition}

