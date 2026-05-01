import {Release} from "../models/Release.ts";
import {Track} from "../models/Track.ts";
import path from "path";
import {__dirname} from "../server.js";

const getRelease = async (req, res) => {
    const releaseId = req.params['releaseId'];

    const release = await Release.findOne({
        where: {
            id: releaseId,
        }
    });

    if (!release) {
        return res.status(404).send({})
    }

    return res.status(200).send(release);
}

export const getCover = async (req, res) => {
    const releaseId = req.params['releaseId'];

    const release = await Release.findOne({
        where: { id: releaseId }
    })

    if (!release) {
        return res.status(404).send({})
    }

    res.sendFile(path.join(__dirname, 'music', release.icpn, release.cover));
}

export default {getRelease, getCover}