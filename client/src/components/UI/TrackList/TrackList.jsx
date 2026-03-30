import React from "react"
import TrackItem from "../Track/TrackItem";
import "./TrackList.css"

function TrackList({
                        tracks
                   }) {

    const getWordForm = (count) => {
        const lastTwo = count % 100;
        const last = count % 10;

        if (lastTwo >= 11 && lastTwo <= 14) {
            return "треков";
        }
        if (last === 1) {
            return "трек";
        }
        if (last >= 2 && last <= 4) {
            return "трека";
        }
        return "треков";
    };

    const getSum = () => {
        const totalSeconds = tracks.reduce(
            (sum, track) => sum + (track.duration || 0),
            0
        );

        const m = Math.floor(totalSeconds / 60);
        const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");

        return `${m} мин ${s} сек`;
    };
    return (
        <div className="track-list">
            <div className="header">
                <span className="count">{tracks.length} {getWordForm(tracks.length)}</span>
                <span className="time">{getSum()}</span>
            </div>
            <div className="tracks">
                {tracks.map((track, index) => (
                    <TrackItem
                        key={index}
                        index={index}
                        track={track}
                        tracks={tracks}
                    />
                ))}
            </div>
        </div>
    );
}

export default TrackList;