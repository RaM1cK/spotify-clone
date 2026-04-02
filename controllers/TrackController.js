import {Track} from "../client/src/classes/models/Track.ts";
import {parseFile} from "music-metadata";
import {inspect} from 'util';
import path from "path";
import {__dirname} from "../server.js";

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
            url: "http://localhost:8080/tracks/getTrackFile/" + trackName,
            duration: Math.floor(metadata.format.duration)
        }

    res.json(track);
}

export const getTrackFile = (req, res)=> {
    res.sendFile(path.join(__dirname + '/music/' + req.params['trackName']));
}

export default {getTrack, getTrackFile}

