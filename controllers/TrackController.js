import path from "path";
import {__dirname} from "../server.js";
import * as fs from "node:fs";
import dotenv from "dotenv";
import {Track} from "../models/Track.ts";
import jwt from "jsonwebtoken";
import * as crypto from "node:crypto";

dotenv.config();

export const getTrack = async (req, res)=> {
    const id = req.params['trackId'];

    const track = await Track.findByPk(id,{
        attributes: {
            exclude: ['isrc', 'createdAt', 'updatedAt', 'releaseId']
        },
    })

    if (!track) {
        return res.status(404).json({})
    }

    return res.json(track);
}

export const getTracksBySecret = (req, res, tracks, user) => {
    const fingerprint = crypto
        .createHash('sha256')
        .update(req.ip + req.headers['user-agent'] + req.user.id)
        .digest('hex')

    return Promise.all(tracks.map(async ({id, title, artist, duration, uri, cover, releaseId}) => ({
        id,
        title,
        artist,
        duration,
        cover,
        releaseId,
        hasInFavorite: await user.hasFavoriteTrack(id),
        token: jwt.sign({
            id, uri, fingerprint
        }, process.env.SECRET_KEY)
    })))
}

export const getTrackFile = async (req, res)=> {
    const token = req.query.token;

    let uri;
    try {
        uri = jwt.verify(token, process.env.SECRET_KEY).uri;
    } catch (err) {
        return res.status(403).json({})
    }

    const filePath = path.join(__dirname, 'music', uri);

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const range = req.headers.range;
    console.log(range)

    const chunk = 3 * 1024 * 1024;

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
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

export default {getTrack, getTrackFile}

