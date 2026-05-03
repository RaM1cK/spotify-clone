import React, {useRef} from 'react';
import TrackList from "../../UI/TrackList/TrackList";
import "./PlaylistItem.css"
import {Player as pl, Player} from "../../../classes/Player.ts";
import usePlayerState from "../../../hooks/usePlayerState";
import {MoreHorizontal, Pause, Play} from "lucide-react";


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

const getSum = (Tracks) => {
    const totalSeconds = Tracks.reduce(
        (sum, track) => sum + (track.duration || 0),
        0
    );

    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");

    return `${m} мин ${s} сек`;
};


const PlaylistItem = ({Tracks, setCurrentTrack, title, type, AutName, year, image, RollBack}) => {
    const player = useRef(pl.getInstance()).current
    const isPlaying = usePlayerState(player, Tracks);


    const handlePlay = () => {
        const queue = player.queue;
        const isSameQueue = queue.length === Tracks.length &&
            queue.every((t, i) => t.id === Tracks[i]?.id);

        if (!isSameQueue) {
            player.setTrack(Tracks[0], Tracks);
            setCurrentTrack(Tracks[0]);
        } else {
            if (player.isPlaying()) {
                player.pause();
            } else {
                player.play();
            }
        }
    };

    return (
        <div className={"liked"}>
            <button className="music-back" onClick={() => RollBack()}>
                ← Назад
            </button>
            <div className="liked-header">
                <img src={image} className="logo" alt="logo" />
                <div className="liked-header-info">
                    <p>{type}</p>
                    <h1>{title}</h1>
                    <p className="liked-composer">
                        {type === "Альбом" ? `${AutName} · ${year}` : `Составитель: ${AutName}`}
                    </p>
                    <div className="liked-count-time">
                        {type === "Альбом" && Tracks.length === 1 ? (
                            <div>сингл</div>
                        ) : (
                            <>
                                <div>{Tracks.length} {getWordForm(Tracks.length)}</div>
                                <span>·</span>
                                <div>{getSum(Tracks)}</div>
                            </>
                        )}
                    </div>
                    <div className="liked-buttons-action">
                        <button
                            className="liked-play-btn"
                            onClick={handlePlay}
                            disabled={Tracks.length === 0}
                        >
                            {isPlaying? <Pause size={18}/> : <Play size={18}/>}
                            <span>Слушать</span>
                        </button>
                        <button className="liked-props-btn">
                            <MoreHorizontal size={18}/>
                        </button>
                    </div>
                </div>
            </div>

            <TrackList tracks={Tracks} setCurrentTrack={setCurrentTrack}/>
        </div>
    );
};

export default PlaylistItem;