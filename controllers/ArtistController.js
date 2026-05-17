import {Artist} from "../models/Artist.ts";
import {getFavoriteTrackIdsSet, getTracksBySecretFromCache, trackAttributes, trackCountQuery} from "./TrackController.js";
import {getFavoriteReleaseIdsSet, releaseAttributes} from "./ReleaseController.js";
import {Track} from "../models/Track.ts";
import {Release} from "../models/Release.ts";
import {redisClient, sequelize} from "../models/index.js";
import {User} from "../models/User.ts";
import {literal} from "@sequelize/core";
import {getUserFavoriteArtistList} from "./UserController.js";

export const artistAttributes = [
    'id',
    'name',
    'avatar'
]

export const getFavoriteArtistIdsSet = async (userId) => {
    const favoriteArtists = await getUserFavoriteArtistList(userId)

    return new Set(favoriteArtists.map(t => t.id))
}

const getArtistData = async (artistId) => {
    const cached = await redisClient.get(`artist:${artistId}`)
    if (cached) return JSON.parse(cached)

    const artistModel = await Artist.findByPk(artistId, {
        attributes: [
            ...artistAttributes,
            [trackCountQuery('Artist'), 'trackCount']
        ],
        include: [
            {
                model: Track,
                as: 'tracks',
                attributes: trackAttributes,
                through: { attributes: [] }
            },
            {
                model: Release,
                as: 'releases',
                attributes: releaseAttributes,
                through: { attributes: [] }
            }
        ],
        order: [
            [{ model: Track, as: 'tracks' }, 'createdAt', 'DESC'],
            [{ model: Release, as: 'releases' }, 'createdAt', 'DESC']
        ]
    })

    if (!artistModel) return null

    const { tracks, releases, ...rest } = artistModel.dataValues

    const data = {
        ...rest,
        tracks: tracks.map(t => t.dataValues),
        releases: releases.map(r => {
            const { ArtistRelease, ...releaseData } = r.dataValues
            return {
                ...releaseData,
                date: new Date(r.date).getFullYear()
            }
        })
    }

    redisClient
        .set(`artist:${artistId}`, JSON.stringify(data), { EX: 3600 })
        .catch(err => console.log(err))

    return data
}

const getArtist = async (req, res) => {
    const artistId = req.params['artistId']
    const data = await getArtistData(artistId)

    if (!data) return res.status(404).send({})

    const { tracks, releases, ...rest } = data

    const [favTracks, favReleases, favArtists] = await Promise.all([
        getFavoriteTrackIdsSet(req.user.id),
        getFavoriteReleaseIdsSet(req.user.id),
        getFavoriteArtistIdsSet(req.user.id)
    ])

    res.status(200).send({
        ...rest,
        hasInFavorite: favArtists.has(artistId),
        tracks: getTracksBySecretFromCache(req, res, tracks.map(t => ({ ...t, hasInFavorite: favTracks.has(t.id) })))
            .slice(0, 5),
        releases: releases.map(r => ({ ...r, hasInFavorite: favReleases.has(r.id) }))
            .slice(0, 5)
    })
}

const getArtistTracks = async (req, res) => {
    const artistId = req.params['artistId']
    const data = await getArtistData(artistId)

    if (!data) return res.status(404).send({})

    const favTracks = await getFavoriteTrackIdsSet(req.user.id)

    res.status(200).send(
        getTracksBySecretFromCache(req, res, data.tracks.map(t => ({ ...t, hasInFavorite: favTracks.has(t.id) })))
    )
}

const getArtistReleases = async (req, res) => {
    const artistId = req.params['artistId']
    const data = await getArtistData(artistId)

    if (!data) return res.status(404).send({})

    const favReleases = await getFavoriteReleaseIdsSet(req.user.id)

    res.status(200).send(
        data.releases.map(r => ({ ...r, hasInFavorite: favReleases.has(r.id) }))
    )
}

export default {getArtist, getArtistTracks, getArtistReleases}