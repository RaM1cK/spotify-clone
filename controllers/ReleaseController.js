import {Release} from "../models/Release.ts";
import {
    getFavoriteTrackIdsSet,
    getTracksBySecret,
    getTracksBySecretFromCache,
    trackAttributes
} from "./TrackController.js";
import {Track} from "../models/Track.ts";
import {redisClient, sequelize} from "../models/index.js";
import t from "nodemailer/lib/smtp-connection/index.js";

export const releaseAttributes = [
    'id',
    'type',
    'title',
    'artist',
    'cover',
    'parentalWarning',
    'date'
]

export const getFavoriteReleaseIdsSet = async (userId, cache = undefined) => {
    const cached =
        cache ?? await redisClient.get(`favoriteReleases:${userId}`)

    if (cached) return new Set(JSON.parse(cached).map(r => r.id))

    const [rows] = await sequelize.query(
        `SELECT "releaseId" AS id FROM "FavoriteReleases" WHERE "userId" = $1`,
        { bind: [userId] }
    )
    return new Set(rows.map(r => r.id))
}

const getRelease = async (req, res) => {
    const releaseId = req.params['releaseId'];
    const cachedRelease =
        await redisClient.get(`release:${releaseId}`);

    let release
    let trackList = null

    if (cachedRelease) {
        release = JSON.parse(cachedRelease);
        const parsedReleaseTracks = release.tracks;

        if (parsedReleaseTracks) trackList = parsedReleaseTracks;
        else {
            const [tracks] = await sequelize.query(
                `SELECT * from tracks WHERE "releaseId" = $1
                     ORDER BY createdAt ASC`,
                { bind: [releaseId] }
                )

            if (!tracks) return res.status(404).send({})

            trackList = tracks

            redisClient
                .set(`release:${releaseId}`, JSON.stringify({...release, tracks}), { EX: 3600 })
                .catch(err => console.log(err))
        }
    } else {
        const releaseModel = await Release.findOne({
            where: { id: releaseId },
            attributes: releaseAttributes,
            include: {
                model: Track,
                as: "tracks",
                attributes: trackAttributes
            },
            order: [[{ model: Track, as: 'tracks'}, 'createdAt', 'ASC']]
        });

        if (!releaseModel) {
            return res.status(404).send({})
        }

        const { tracks, ...rest } = releaseModel.dataValues;

        release = rest
        trackList = tracks.map(t => t.dataValues)

        const result = {
            ...releaseModel.dataValues,
            date: new Date(releaseModel.date).getFullYear()
        }

        redisClient
            .set(`release:${releaseId}`, JSON.stringify(result), {EX: 3600})
            .catch(err => console.log(err));

    }

    const favTracks = await getFavoriteTrackIdsSet(req.user.id)
    const favReleases = await getFavoriteReleaseIdsSet(req.user.id)
    trackList = getTracksBySecretFromCache(req, res, trackList.map(t => ({...t, hasInFavorite: favTracks.has(t.id)})))

    res.status(200).send({
        ...release,
        hasInFavorite: favReleases.has(releaseId),
        tracks: trackList
    })
}

export default {getRelease}