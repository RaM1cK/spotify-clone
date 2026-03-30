import {Track} from "../client/src/classes/models/Track.ts";
import {parseFile} from "music-metadata";
import {inspect} from 'util';
import path from "path";
import {__dirname} from "../server.js";

export const getTrack = async (req, res)=> {
    let trackName = req.params['trackName'];

    const metadata = await parseFile(path.join(__dirname, '/music/', trackName))
    // console.log(inspect(metadata, {showHidden: false, depth: null}));

    let track =
        {
            id: trackName,
            logoURL: null,
            name: metadata.common.title,
            creator: metadata.common.artist,
            url: "http://192.168.25.83:8080/" + trackName,
            duration: Math.floor(metadata.format.duration)
        }

    res.send(track);
}

// export const getTrackFile = (req, res)=> {
//     console.log(__dirname)
//
//     res.sendFile(path.join(__dirname + '/music/' + req.params['trackName']));
// }

export default {getTrack}

