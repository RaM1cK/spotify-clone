import path from "path";
import {__dirname} from "../server.js";
import * as fs from "node:fs";
import dotenv from "dotenv";
import {Track} from "../models/Track.ts";
import * as crypto from "node:crypto";
import {literal} from "@sequelize/core";
import {redisClient, sequelize} from "../models/index.js";
import {User} from "../models/User.ts";
import {getUserFavoriteArtistList, getUserFavoriteTrackList} from "./UserController.js";
import {StreamLog} from "../models/StreamLog.ts";

dotenv.config();

export const trackAttributes = [
    'id',
    'title',
    'artist',
    'duration',
    'cover',
    'parentalWarning',
    'uri',
    'releaseId',
]

export const hasInFavoriteQuery = (userId, alias = 'tracks') => {
    const favoriteAlias = {
        tracks: 'FavoriteTracks',
        Track: 'FavoriteTracks',
        Playlist: 'FavoritePlaylists',
        artists: 'FavoriteArtists',
        releases: 'FavoriteReleases',
        playlists: 'FavoritePlaylists',
    }

    const aliasToOneString = {
        tracks: 'track',
        Track: 'track',
        Playlist: 'playlist',
        artists: 'artist',
        releases: 'release',
        playlists: 'playlist'
    }

    const query = `(
        select exists (
            select 1
            from "${favoriteAlias[alias]}" fs
            where fs."${aliasToOneString[alias]}Id" = "${alias}"."id" and fs."userId" = '${userId}'
        )
    )`

    return literal(query)
}

export const getFavoriteTrackIdsSet = async (userId) => {
    const favoriteTracks = await getUserFavoriteTrackList(userId)

    return new Set(favoriteTracks.map(t => t.id))
}

export const trackCountQuery = (alias) => literal(`(
    select count(*) 
    from "${alias}Track"
    where "${alias}Track"."${alias.toLowerCase()}Id" = "${alias}"."id"
)`)

const MIN_STREAM_DURATION_SECONDS = 30

export const requestTrackToken = async (req, res) => {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({});

    const track = await Track.findByPk(trackId, {
        attributes: trackAttributes
    });

    if (!track) return res.status(404).json({});

    const fingerprint = crypto
        .createHash('sha256')
        .update(req.ip + req.headers['user-agent'] + req.user.id)
        .digest('hex')

    const { uri, ...rest } = track.toJSON();

    const sessionId = crypto.randomUUID();

    redisClient
        .set(`streamSession:${sessionId}`, JSON.stringify({ ...rest, uri, fingerprint }), { EX: Math.max(track.duration, MIN_STREAM_DURATION_SECONDS) })
        .catch(err => console.log(err));

    res.json({ token: sessionId });
}

export const saveLastPosition = async (req, res) => {
    const token = req.body.token;
    const position = req.body.position

    const sessionData = await redisClient.get(`streamSession:${token}`);
    if (!sessionData) return res.status(403).json({});

    const { uri, fingerprint, ...restTrack } = JSON.parse(sessionData);

    redisClient
        .set(`currentTrack:${req.user.id}`, JSON.stringify({...restTrack, start: position}))
        .catch(err => console.log(err));

    res.status(200).json({})
}

export const getTrackFile = async (req, res)=> {
    const token = req.query.token;

    const sessionData = await redisClient.get(`streamSession:${token}`);
    if (!sessionData) return res.status(403).json({});

    const track = JSON.parse(sessionData);
    redisClient.expire(`streamSession:${token}`, track.duration).catch(() => {});

    const filePath = path.join(__dirname, 'music', track.uri);


    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const range = req.headers.range;

    const chunk = 1024 * 1024;

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

export const reportPlay = async (req, res) => {
    const { token } = req.body;
    const userId = req.user.id;

    const raw =
        await redisClient.get(`streamSession:${token}`);

    if (!raw) return res.status(403).json({ counted: false });

    const session = JSON.parse(raw);
    if (session.counted) return res.json({ counted: true });

    const now = Date.now();
    const elapsed = (now - (session.lastTimestamp || now)) / 1000;

    if (elapsed > 0 && elapsed < 10)
        session.accumulated = Math.min((session.accumulated || 0) + elapsed, session.duration);

    const thresholdReached =
        session.accumulated >= 30 ||
        (session.duration > 0 && session.accumulated / session.duration >= 0.7);


    if (thresholdReached) {
        const cooldownKey = `streamCooldown:${userId}:${session.id}`;
        const cooldown = await redisClient.get(cooldownKey);

        if (!cooldown) {
            const lockKey = `streamLock:${userId}:${session.id}`;
            const acquired = await redisClient.set(lockKey, '1', { NX: true, EX: 10 });

            if (acquired) {
                await StreamLog.create({
                    id: token,
                    trackId: session.id,
                    userId,
                });

                await redisClient.set(cooldownKey, '1', { EX: Math.ceil(session.duration) });
            }
        }

        session.counted = true;
    }

    await redisClient.set(
        `streamSession:${token}`,
        JSON.stringify(session),
        { EX: Math.ceil(session.duration) }
    );

    res.json({ counted: thresholdReached });
};

// export const getTrackArtists = async (req, res) => {
//     const trackId = req.params.trackId;
//
//     const artists = await
// }

export default {getTrackFile, saveLastPosition, requestTrackToken, reportPlay}

