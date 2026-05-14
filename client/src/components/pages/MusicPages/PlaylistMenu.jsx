import React, {useEffect, useState} from "react";
import Player from "../../UI/Player/Player";
import {Button, Nav, NavLink} from "react-bootstrap";
import { ListMusic, LayoutList, CircleUserRound, Disc3, Heart, Clock } from "lucide-react";
import axios from "axios";
import "../../../App.css";
import TrackList from "../../UI/TrackList/TrackList";
import "./PlaylistMenu.css"
import playlistItem from "./PlaylistItem";
import PlaylistItem from "./PlaylistItem";
import trackList from "../../UI/TrackList/TrackList";
import {Routes, Route, useNavigate, useParams, Navigate} from "react-router-dom";

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



const PlaylistMenu = ({setCurrentTrack, RollBack }) => {
    const navigate = useNavigate();

    return (
        <Routes>
            <Route
                index
                element={
                    <PlaylistList
                        onSelect={(item) => navigate(item.id)}
                        RollBack={RollBack}
                    />
                }
            />
            <Route
                path=":playlistId"
                element={
                    <PlaylistDetail
                        setCurrentTrack={setCurrentTrack}
                        RollBack={() => navigate(-1)}
                    />
                }
            />
        </Routes>
    );
};

// Список плейлистов
const PlaylistList = ({ onSelect, RollBack }) => {
    const [playlists, setPlaylists] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get("/api/users/me/favoritePlaylists")
            .then(res => setPlaylists(res.data))
            .catch(() => setError('Ошибка загрузки'))
            .finally(() => setLoading(false));
    }, [])

    if (loading) return <div>Загрузка...</div>
    if (error) return <div>{error}</div>;

    return (
        <div className="playlist-home">
            <button className="music-back" onClick={RollBack}>← Назад</button>
            <div className="playlist-grid">
                {playlists.map((item) => (
                    <button key={item.id} onClick={() => onSelect(item)}>
                        <div className="album-imagediv">
                            <img src={item.cover} alt=""/>
                        </div>
                        <span className="music-tile__label">{item.name}</span>
                        <span className="playlist-track-count">
                            {item.trackCount} {getWordForm(item.trackCount)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
};

// Открытый плейлист
const PlaylistDetail = ({ setCurrentTrack, RollBack }) => {
    const { playlistId } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`/api/playlists/${playlistId}`),
            axios.get(`/api/playlists/${playlistId}/tracks`)
        ])
            .then(([playlistRes, tracksRes]) => {
                if (!playlistRes.data) {
                    setError('Плейлист не найден');
                    return
                }

                setPlaylist(playlistRes.data);
                setTracks(tracksRes.data);
            })
            .catch((err) => {
                if (err.response?.status === 404) setError('Плейлист не найден')
                else setError('Ошибка загрузки');
            })
            .finally(() => setLoading(false));
    }, [])

    if (loading) return <div>Загрузка...</div>
    if (error) return <div>{error}</div>;

    if (playlist && tracks)
        return (
            <PlaylistItem
                Tracks={tracks}
                title={playlist.name}
                AutName={playlist.creator}
                type="Плейлист"
                image={playlist.cover}
                setCurrentTrack={setCurrentTrack}
                RollBack={RollBack}
            />
        );
};

export default PlaylistMenu;