import {Artist} from "../models/Artist.ts";
import {getTracksBySecret} from "./TrackController.js";
import {getUser} from "./UserController.js";
import {Track} from "../models/Track.ts";

const getArtist = async (req, res) => {
    const artistId = req.params['artistId'];

    const artist = await Artist.findByPk(artistId, {
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        },
        include: {model: Track, as: 'tracks'}
    })

    if (!artist) return res.status(404).send('Not Found');

    res.status(200).send(
        {
            ...artist.toJSON(),
            trackCount: artist.tracks.length
        }
    );
}

const getTracks = async (req, res) => {
    const artistId = req.params.artistId;
    const limit = req.query.limit;
    const user = await getUser(req, res)

    const artist = await Artist.findByPk(artistId);

    if (!artist) return res.status(404).send('Not Found');

    const result = await artist.getTracks({
        limit: limit,
        order: [['createdAt', 'DESC']],
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'isrc']
        }
    }).then(tracks => getTracksBySecret(req, res, tracks, user));

    res.status(200).send(result);
}

const getReleases = async (req, res) => {
    const artistId = req.params.artistId;
    const limit = req.query.limit;

    const artist = await Artist.findByPk(artistId);

    if (!artist) return res.status(404).send('Not Found');

    const result = await artist.getReleases({
        limit: limit,
        order: [['createdAt', 'DESC']],
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'icpn']
        }
    }).then(releases => releases.map(release => ({
        ...release.toJSON(),
        date: new Date(release.date).getFullYear()
    })))

    res.status(200).send(result);
}

export default {
    getArtist,
    getTracks,
    getReleases
}