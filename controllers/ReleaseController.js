import {Release} from "../models/Release.ts";
import {getUser} from "./UserController.js";
import {getTracksBySecret} from "./TrackController.js";
import {Track} from "../models/Track.ts";

const getRelease = async (req, res) => {
    const releaseId = req.params['releaseId'];

    const release = await Release.findOne({
        where: {
            id: releaseId
        },
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
    const user = await getUser(req, res);

    const release = await Release.findOne({
        where: { id: releaseId },
        include: {
            model: Track,
            as: "tracks",
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'isrc']
            },
            order: [['id', 'ASC']]
        }
    })

    if (!release) {
        return res.status(404).send({})
    }

    const result = await  getTracksBySecret(req, res, release.tracks, user);

    res.status(200).send(result)
}

export default {getRelease, getReleaseTracks}