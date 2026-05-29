import React, {useEffect} from 'react';
import myLikeIcon from '../../../images/MYLIKEDICON.png';
import TrackList from "../../UI/TrackList/TrackList";
import './Liked.css';
import {MoreHorizontal, Pause, Play, ChevronLeft} from "lucide-react";
import {Player} from "../../../classes/Player.ts";
import usePlayerState from '../../../hooks/usePlayerState';
import axios from "axios";
import {LoadingPage} from "../LoadingPage";
import TrackItem from "../../UI/Track/TrackItem";

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



const Liked = ({setCurrentTrack, RollBack, Context}) => {
    const player = React.useRef(Player.getInstance()).current;
    const [Tracks, setTracks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const isPlaying = usePlayerState(player, Tracks);

    useEffect(() => {
        axios.get('/api/users/me/favoriteTracks')
            .then(res =>  setTracks(res.data))
            .catch(() =>  setError('Ошибка загрузки треков'))
            .finally(() => setLoading(false));
    }, []);

    const onFavoriteChange = (trackId, isFavorite) => {
        if (!isFavorite) {
            setTracks(tracks => tracks.filter(track => track.id !== trackId));
        }
    }

    if (loading) return <LoadingPage/>;
    if (error) return <div>{error}</div>

    if (Tracks) {
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
                <button className="music-back" onClick={() => RollBack(null)}>
                    <ChevronLeft size={20} />
                </button>
                <div className="liked-header">
                    <img src={myLikeIcon} className="logo" alt="logo" />
                    <div className="liked-header-info">
                        <p>Плейлист</p>
                        <h2>{Context ? `Любимые треки ${Context}` : "Избранное"}</h2>
                        <div className="liked-count-time">
                            <div>{Tracks.length} {getWordForm(Tracks.length)}</div>
                            <span>·</span>
                            <div>{getSum(Tracks)}</div>
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

                <TrackList tracks={Tracks} setCurrentTrack={setCurrentTrack} onFavoriteChange={onFavoriteChange}/>
            </div>
        );
    }
};

export default Liked;