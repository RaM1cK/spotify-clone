import {Playlist} from "../models/Playlist.ts";
import {literal} from "@sequelize/core";
import {getFavoriteTrackIdsSet, getTracksBySecret, trackAttributes} from "./TrackController.js";
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
            attributes: trackAttributes,
            order: [[literal('"playlistTrack.createdAt"'), 'DESC']]
        }
    })

    if (!playlist) return res.status(404).send('No such playlist')

    const favoriteSet = await getFavoriteTrackIdsSet(req.user.id)
    const result = await getTracksBySecret(req, res, playlist.tracks)

    res.status(200).send(
        result.map(track => ({ ...track, hasInFavorite: favoriteSet.has(track.id) }))
    )
}

export default {
    getPlaylist,
    getPlaylistTracks
}