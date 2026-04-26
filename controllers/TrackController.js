import {parseFile} from "music-metadata";
import {inspect} from 'util';
import path from "path";
import {__dirname} from "../server.js";
import * as fs from "node:fs";
import dotenv from "dotenv";
import {Track} from "../models/Track.ts";
import {Release} from "../models/Release.ts";

dotenv.config();

export const getTrack = async (req, res)=> {
    const id = req.params['trackId'];

    const track = await Track.findOne({
        where: { id },
        attributes: {
            exclude: ['isrc', 'createdAt', 'updatedAt']
        },
    })

    if (!track) {
        return res.status(404).json({})
    }

    return res.json(track);
}

export const getTrackFile = async (req, res)=> {
    const id = req.params['trackId'];

    console.log(id);

    const track = await Track.findOne({
        where: { id }
    })

    const release = await Release.findOne({
        where: { id: track.releaseId }
    })

    const filePath = path.join(__dirname, 'music', release.icpn, track.uri);

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    const range = req.headers.range;

    console.log(range);

    if (!range) {
        return res.status(404).send('No such file');
    }

    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = start + 1024 * 1024 >= fileSize ? fileSize - 1 : start + 1024 * 1024;

    const fileStream = fs.createReadStream(filePath, { start, end});

    fileStream.on('error', () => {
        fileStream.destroy()
    })

    fileStream.on('close', () => {
        if (!fileStream.destroyed) fileStream.destroy();
    })

    fileStream.on('end', () => {
        if (!fileStream.destroyed) fileStream.destroy();
    })

    const chunkSize = end - start + 1

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize
    });

    fileStream.pipe(res);
}

export const getCover = async (req, res) => {
    const trackId = req.params['trackId'];

    const track = await Track.findOne({
        where: { id: trackId }
    })

    const release = await Release.findOne({
        where: { id: track.releaseId }
    })

    res.sendFile(path.join(__dirname, 'music', release.icpn, track.cover));
}

export default {getTrack, getTrackFile, getCover}

