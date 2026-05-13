import {Release} from "../models/Release.ts";
import {getTracksBySecret, hasInFavoriteQuery, trackAttributes} from "./TrackController.js";
import {Track} from "../models/Track.ts";

const getRelease = async (req, res) => {
    const releaseId = req.params['releaseId'];

    const release = await Release.findOne({
        where: { id: releaseId },
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'icpn']
        }
    });

    if (!release) {
        return res.status(404).send({})
    }

    return res.status(200).send({
        ...release.toJSON(),
        date: new Date(release.date).getFullYear()
    });
}

export const getReleaseTracks = async (req, res) => {
    const releaseId = req.params['releaseId'];

    const release = await Release.findOne({
        where: { id: releaseId },
        include: {
            model: Track,
            as: "tracks",
            attributes: [
                ...trackAttributes,
                [hasInFavoriteQuery(req.user.id), 'hasInFavorite']
            ],
        },
        order: [[{model: Track, as: 'tracks'}, 'createdAt', 'ASC']],
    })

    if (!release) {
        return res.status(404).send({})
    }

    const result = await getTracksBySecret(req, res, release.tracks);

    res.status(200).send(result)
}

export default {getRelease, getReleaseTracks}