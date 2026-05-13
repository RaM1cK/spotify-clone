import {Artist} from "../models/Artist.ts";
import {getTracksBySecret, hasInFavoriteQuery, trackAttributes, trackCountQuery} from "./TrackController.js";
import {getUser} from "./UserController.js";
import {Track} from "../models/Track.ts";
import {literal} from "@sequelize/core";

export const artistAttributes = [
    'id',
    'name',
    'avatar'
]

const getArtist = async (req, res) => {
    const artistId = req.params['artistId'];

    const artist = await Artist.findByPk(artistId, {
        attributes: [
            ...artistAttributes,
            [trackCountQuery('Artist'), 'trackCount']
        ]
    })

    if (!artist) return res.status(404).send('Not Found');

    res.status(200).send(artist);
}

const getTracks = async (req, res) => {
    const artistId = req.params.artistId
    const limit = req.query.limit

    const artist = await Artist.findByPk(artistId)
    if (!artist) return res.status(404).send('Not Found')

    const tracks = await artist.getTracks({
        limit: limit,
        order: [['createdAt', 'DESC']],
        attributes: [
            ...trackAttributes,
            [hasInFavoriteQuery(req.user.id, 'Track'), 'hasInFavorite']
        ]
    }).then(tracks => getTracksBySecret(req, res, tracks))

    res.status(200).send(tracks)
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
    }).then(releases => releases.map(release => {
        const {artistRelease, ...rest} = release.toJSON();

        return {
            ...rest,
            date: new Date(release.date).getFullYear()
        }
    }))

    res.status(200).send(result);
}

export default {
    getArtist,
    getTracks,
    getReleases
}