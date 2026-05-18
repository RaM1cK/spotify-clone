import React, {useEffect, useState} from "react";
import Player from "../../UI/Player/Player";
import {Button, Nav, NavLink} from "react-bootstrap";
import {ListMusic, Heart, Clock, ChevronLeft, Plus} from "lucide-react";
import axios from "axios";
import "../../../App.css";
import TrackList from "../../UI/TrackList/TrackList";
import "./PlaylistMenu.css"
import playlistItem from "./PlaylistItem";
import PlaylistItem from "./PlaylistItem";
import trackList from "../../UI/TrackList/TrackList";
import {Routes, Route, useNavigate, useParams, Navigate} from "react-router-dom";
import {LoadingPage} from "../LoadingPage";
import {CreatePlaylistModal} from "./CreatePlaylistModal";

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
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        axios.get("/api/users/me/favoritePlaylists")
            .then(res => setPlaylists(res.data))
            .catch(() => setError('Ошибка загрузки'))
            .finally(() => setLoading(false));
    }, [])

    if (loading) return <LoadingPage/>
    if (error) return <div>{error}</div>;

    return (
        <div className="playlist-home">
            <button className="music-back" onClick={RollBack}><ChevronLeft size={20} /></button>
            <div className="playlist-grid">
                <button onClick={() => setCreateOpen(true)}>
                    <div className="album-imagediv playlist-create-icon">
                        <Plus size={64} color="#b4b2a9"/>
                    </div>
                    <span className="music-tile__label">Создать плейлист</span>
                </button>
                {playlists.map((item) => (
                    <button key={item.id} onClick={() => onSelect(item)}>
                        <div className="album-imagediv">
                            {item.cover
                                ? <img src={`/api/files/${item.cover}`} alt=""/>
                                : <ListMusic size={64} color="#b4b2a9"/>
                            }
                        </div>
                        <span className="music-tile__label">{item.name}</span>
                        <span className="playlist-track-count">
                            {item.trackCount} {getWordForm(item.trackCount)}
                        </span>
                    </button>
                ))}
            </div>
            <CreatePlaylistModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onCreated={(newPlaylist) => {
                    setPlaylists(prev => [newPlaylist, ...prev])
                }}
            />
        </div>
    )
};

// Открытый плейлист
const PlaylistDetail = ({ setCurrentTrack, RollBack }) => {
    const { playlistId } = useParams();
    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState(null);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`/api/playlists/${playlistId}`)
            .then(res => {
                if (!res.data) {
                    setError('Плейлист не найден');
                    return
                }

                setPlaylist(res.data);
                setTracks(res.data.tracks);
                setIsFavorite(res.data.hasInFavorite);
            })
            .catch((err) => {
                if (err.response?.status === 404) setError('Плейлист не найден')
                else setError('Ошибка загрузки');
            })
            .finally(() => setLoading(false));
    }, [])

    const toFavorite = () => {
        const request = () => isFavorite
            ? axios.delete(`/api/users/removeFavoritePlaylist/${playlistId}`)
            : axios.post(`/api/users/addFavoritePlaylist/${playlistId}`)

        request()
            .then(() => {
                const newValue = !isFavorite
                setIsFavorite(newValue)
            })
            .catch(err => console.error(err));
    }

    if (loading) return <LoadingPage/>;
    if (error) return <div>{error}</div>;

    if (playlist && tracks)
        return (
            <PlaylistItem
                Tracks={tracks}
                title={playlist.name}
                AutName={playlist.creator}
                creatorId={playlist.creatorId}
                isFavorite={isFavorite}
                toFavorite={toFavorite}
                type="Плейлист"
                image={playlist.cover ? `/api/files/${playlist.cover}` : null}
                setCurrentTrack={setCurrentTrack}
                RollBack={RollBack}
            />
        );
};

export default PlaylistMenu;