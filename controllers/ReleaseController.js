import {Release} from "../models/Release.ts";
import {
    getFavoriteTrackIdsSet,
    getTracksBySecretFromCache,
    trackAttributes
} from "./TrackController.js";
import {Track} from "../models/Track.ts";
import {redisClient} from "../models/index.js";
import {getUserFavoriteReleaseList} from "./UserController.js";

export const releaseAttributes = [
    'id',
    'type',
    'title',
    'artist',
    'cover',
    'parentalWarning',
    'date'
]

export const getFavoriteReleaseIdsSet = async (userId) => {
    const favoriteReleases = await getUserFavoriteReleaseList(userId)

    return new Set(favoriteReleases.map(t => t.id))
}

const getRelease = async (req, res) => {
    const releaseId = req.params['releaseId'];
    const cachedRelease =
        await redisClient.get(`release:${releaseId}`);

    let release
    let trackList = null

    if (cachedRelease) {
        release = JSON.parse(cachedRelease);
        trackList = release.tracks;
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
            ...rest,
            tracks: trackList,
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