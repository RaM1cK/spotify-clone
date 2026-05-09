import React, {useEffect} from "react";
import {Heart, MoreVertical, Pause, Play} from "lucide-react";
import {Player} from "../../../classes/Player.ts";
import "./trackitem.css";
import {TrackUI} from "../../../classes/observers/TrackUI.ts";
import axios from "axios";

function TrackItem({ number, track, tracks, setCurrentTrack, onFavoriteChange }) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isCurrent, setIsCurrent] = React.useState(false);
    const [isFavorite, setIsFavorite] = React.useState(track.hasInFavorite);
    const player = React.useRef(Player.getInstance()).current;

    const formatTime = (seconds) => {
        if (!seconds) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    useEffect(() => {
        const observer = new TrackUI(() => {
            if (player.track && track.id === player.track.id) {
                setIsPlaying(player.isPlaying());
                setIsCurrent(true);
                return;
            }

            setIsPlaying(false)
            setIsCurrent(false);
        })
        observer.update()

        player.attach(observer);

        return () => {
            player.detach(observer);
        }
    }, [])

    const handleClick = () => {
        if (!player.track) {
            player.setTrack(track, tracks);
            setCurrentTrack(track);
        }
        else {
            if (player.track.id !== track.id) {
                player.setTrack(track, tracks)
                setCurrentTrack(track);
            } else {
                if (player.isLoading()) {
                    player.pause()
                    return
                }

                player.isPlaying() && !player.isLoading() ? player.pause() : player.play()
            }
        }
    }

    const toFavorite = () => {
        const request = () => isFavorite
            ? axios.delete(`/api/users/removeFavoriteTrack/${track.id}`)
            : axios.post(`/api/users/addFavoriteTrack/${track.id}`)

        request()
            .then(() => {
                const newValue = !isFavorite
                setIsFavorite(newValue)
                onFavoriteChange?.(track.id, newValue);
            })
            .catch(err => console.error(err));
    }

        return (
            <div className="track-item">
                {/* Left section */}

                <div onClick={handleClick} className="track-item__left">
                    <div className="track-number"
                    style={{ width: `${tracks.length.toString().length}ch` }}
                    >
                        {number}
                    </div>
                    <div className="track-item__cover-wrapper">
                        <img
                            src={`/api/files/${track.cover}`}
                            alt={track.title}
                            className="track-item__cover"
                        />
                        <div className={`track-item__play${isCurrent ? "--current" : ""}`}>
                            {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                        </div>
                    </div>
                    <div className="d-flex flex-column justify-content-between">
                        <span className="track-item__title">{track.title}</span>
                        <span className="track-item__artist">{track.artist}</span>
                    </div>
                </div>

                {/* Right section */}
                <div className="track-item__actions">
                    <span className="time">{formatTime(track.duration)}</span>

                    <button onClick={toFavorite} className="track-item__button">
                        <Heart size={20} color={"white"} fill={isFavorite ? "white" : "none"}/>
                    </button>

                    <button className="track-item__button">
                        <MoreVertical size={20} color={"white"}/>
                    </button>
                </div>
            </div>
        );
}

export default TrackItem;