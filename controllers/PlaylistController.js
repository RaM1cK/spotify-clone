import {Playlist} from "../models/Playlist.ts";
import {literal} from "@sequelize/core";
import {
    getFavoriteTrackIdsSet,
    hasInFavoriteQuery,
    trackAttributes
} from "./TrackController.js";
import {Track} from "../models/Track.ts";
import {getUserFavoritePlaylists, getUserFavoriteReleaseList} from "./UserController.js";
import {redisClient, sequelize} from "../models/index.js";
import {getFavoriteReleaseIdsSet, releaseAttributes} from "./ReleaseController.js";
import sharp from "sharp";
import fs from "fs";
import {User} from "../models/User.ts";

export const playlistAttributes = [
    'id',
    'name',
    'cover',
    'creatorId'
]

export const getFavoritePlaylistIdsSet = async (userId) => {
    const favoritePlaylists = await getUserFavoritePlaylists(userId)

    return new Set(favoritePlaylists.map(t => t.id))
}

const getPlaylist = async (req, res) => {
    const playlistId = req.params['playlistId']
    const cachedPlaylist =
        await redisClient.get(`playlist:${playlistId}`)

    let playlist
    let trackList = null

    if (cachedPlaylist) {
        playlist = JSON.parse(cachedPlaylist)
        trackList = playlist.tracks
    } else {
        const playlistModel = await Playlist.findOne({
            where: {id: playlistId},
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
            ],
            include: {
                model: Track,
                as: "tracks",
                attributes: trackAttributes
            },
            order: [[{ model: Track, as: 'tracks'}, 'createdAt', 'ASC']]
        })

        if (!playlistModel) return res.status(404).send('Not found');

        const { tracks, ...rest } = playlistModel.dataValues;

        playlist = rest
        trackList = tracks.map(t => t.dataValues)

        redisClient
            .set(`playlist:${playlistId}`, JSON.stringify(playlistModel.dataValues), {EX: 3600})
            .catch(err => console.log(err));
    }

    const favTracks = await getFavoriteTrackIdsSet(req.user.id)
    const favPlaylists = await getFavoritePlaylistIdsSet(req.user.id)
    trackList = trackList.map(t => ({...t, hasInFavorite: favTracks.has(t.id)}))

    res.status(200).send({
        ...playlist,
        hasInFavorite: favPlaylists.has(playlistId),
        tracks: trackList
    })
}

const createPlaylist = async (req, res) => {
    const creatorId = req.user.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).send({ error: 'Название обязательно' });
    }

    let playlist
    let filepath = null

    try {
        await sequelize.transaction(async t => {
            const user = await User.findByPk(creatorId)

            playlist = await user.createFavoritePlaylist({
                name: name.trim(),
                creatorId
            }, { transaction: t })
        })
    } catch (err) {
        console.error(err);

        return res.status(500).send({ error: "Ошибка создания плейлиста"})
    }

    if (req.file) {
        try {
            const filename = `${playlist.id}.jpg`;
            filepath = `images/playlists/${filename}`;

            await sharp(req.file.buffer)
                .jpeg({ quality: 85 })
                .toFile(`music/${filepath}`);

            playlist.cover = filepath;
            await playlist.save();
        } catch (err) {
            console.log(err);

            fs.unlink(`music/${filepath}`, () => {})

            return res.status(500).send({ error: 'Ошибка загрузки изображения'})
        }
    }

    redisClient
        .del(`favoritePlaylists:${creatorId}`)
        .catch(err => console.log(err));

    res.status(201).send({
        ...playlist.dataValues,
        trackCount: 0
    });
}

export default {
    getPlaylist,
    createPlaylist,
}