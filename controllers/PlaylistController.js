import {Playlist} from "../models/Playlist.ts";
import {literal} from "@sequelize/core";
import {getTracksBySecret, hasInFavoriteQuery, trackAttributes} from "./TrackController.js";
import {Track} from "../models/Track.ts";

export const playlistAttributes = [
    'id',
    'name',
    'cover'
]

const getPlaylist = async (req, res) => {
    const id = req.params['playlistId']

    const playlist = await Playlist.findByPk(id, {
        attributes: [
            ...playlistAttributes,
            [
                literal(`(
                    select u."nickname"
                    from "users" u
                    where u."id" = "Playlist"."creator_id"
                )`),
                'creator'
            ]
        ]
    })

    if (!playlist) return res.status(404).send('No such playlist')

    res.status(200).send(playlist)
}

const getPlaylistTracks = async (req, res) => {
    const id = req.params['playlistId']

    const playlist = await Playlist.findByPk(id, {
        include: {
            model: Track,
            as: 'tracks',
            attributes: [
                ...trackAttributes,
                [hasInFavoriteQuery(req.user.id), 'hasInFavorite']
            ],
            order: [[literal('"playlistTrack.createdAt"'), 'DESC']]
        }
    })

    if (!playlist) return res.status(404).send('No such playlist')

    const result = await getTracksBySecret(req, res, playlist.tracks)

    res.status(200).send(result)
}

export default {
    getPlaylist,
    getPlaylistTracks
}