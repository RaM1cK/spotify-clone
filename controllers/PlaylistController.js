import {Playlist} from "../models/Playlist.ts";
import {literal} from "@sequelize/core";
import {getTracksBySecret} from "./TrackController.js";
import {getUser} from "./UserController.js";

const getPlaylist = async (req, res) => {
    const id = req.params['playlistId']

    const playlist = await Playlist.findByPk(id)

    if (!playlist) return res.status(404).send('No such playlist')

    res.status(200).send({
        ...playlist.toJSON(),
        creator: await playlist.getUser().then(user => user.nickname),
        trackCount: await playlist.countTracks()
    })
}

const getPlaylistTracks = async (req, res) => {
    const id = req.params['playlistId']
    const user = await getUser(req, res)

    const playlist = await Playlist.findByPk(id)

    if (!playlist) return res.status(404).send('No such playlist')

    const result = await playlist.getTracks({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'isrc']
        },
        order: [[literal('"playlistTrack.createdAt"'), 'DESC']],
    }).then(tracks => getTracksBySecret(req, res, tracks, user))

    res.status(200).send(result)
}

export default {
    getPlaylist,
    getPlaylistTracks
}