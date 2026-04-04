import {Track} from "../client/src/classes/models/Track.ts";
import {parseFile} from "music-metadata";
import {inspect} from 'util';
import path from "path";
import {__dirname} from "../server.js";
import * as fs from "node:fs";
import dotenv from "dotenv";

dotenv.config();

export const getTrack = async (req, res)=> {
    let trackName = req.params['trackName'];

    const metadata = await parseFile(path.join(__dirname, '/music/', trackName))
    // console.log(inspect(metadata, {showHidden: false, depth: null}));

    const track =
        {
            id: trackName,
            logoURL: null,
            name: metadata.common.title,
            creator: metadata.common.artist,
            url: `http://${process.env.IP_APP}:${process.env.SERVER_PORT}/tracks/getTrackFile/${trackName}`,
            duration: Math.floor(metadata.format.duration)
        }

    return res.json(track);
}

export const getTrackFile = async (req, res)=> {
    const filePath = path.join(__dirname, 'music', req.params['trackName']);

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

    const fileStream = fs.createReadStream(filePath, { start, end });

    const chunkSize = end - start + 1

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg'
    });

    fileStream.pipe(res);
}

export default {getTrack, getTrackFile}

