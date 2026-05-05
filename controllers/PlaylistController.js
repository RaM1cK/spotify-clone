import {Playlist} from "../models/Playlist.ts";
import {literal} from "@sequelize/core";
import {getTracksBySecret} from "./TrackController.js";
import {getUser} from "./UserController.js";
import {User} from "../models/User.ts";
import {Track} from "../models/Track.ts";

const getPlaylist = async (req, res) => {
    const id = req.params['playlistId']

    const playlist = await Playlist.findByPk(id, {
        include: [
            { model: User, as: "user" },
            { model: Track, as: "tracks" },
        ]
    })

    if (!playlist) return res.status(404).send('No such playlist')

    res.status(200).send({
        ...playlist.toJSON(),
        creator: playlist.user.nickname,
        trackCount: playlist.tracks.length,
    })
}

const getPlaylistTracks = async (req, res) => {
    const id = req.params['playlistId']
    const user = await getUser(req, res)

    const playlist = await Playlist.findByPk(id, {
        include: [
            { model: User, as: 'user'},
            {
                model: Track,
                as: 'tracks',
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'isrc']
                },
                order: [[literal('"playlistTrack.createdAt"'), 'DESC']]
            }
        ]
    })

    if (!playlist) return res.status(404).send('No such playlist')

    const result = await getTracksBySecret(req, res, playlist.tracks, user)

    res.status(200).send(result)
}

export default {
    getPlaylist,
    getPlaylistTracks
}