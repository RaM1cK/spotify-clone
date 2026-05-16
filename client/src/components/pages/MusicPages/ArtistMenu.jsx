// ArtistMenu.jsx
import React, {useEffect, useState} from "react";
import {ChevronLeft, CircleUserRound, Heart} from "lucide-react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import "./ArtistMenu.css";
import ArtistItem from "./ArtistItem";
import axios from "axios";
import {LoadingPage} from "../LoadingPage";

const declension = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return "трек";
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "трека";
    return "треков";
};

const ArtistList = ({ RollBack }) => {
    const navigate = useNavigate();
    const [artists, setArtists] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/users/me/favoriteArtists')
            .then(res => setArtists(res.data))
            .catch(() => setError("Ошибка загрузки"))
            .finally(() => setLoading(false));
    }, [])

    const getCount = (artistId) =>
        artists.find(artist => artist.id === artistId).trackCount;

    if (loading) return <LoadingPage/>;
    if (error) return <div>{error}</div>;

    if (artists)
        return (
            <div className="playlist-home">
                <button className="music-back" onClick={() => RollBack(null)}>
                    <ChevronLeft size={20} />
                </button>
                <div className="playlist-grid">
                    {artists.map((artist) => (
                        <button
                            key={artist.id}
                            onClick={() => navigate(artist.id)}
                        >
                            <div className="artist-avatar">
                                {artist.avatar
                                    ? <img src={`/api/files/${artist.avatar}`} alt={artist.name} />
                                    : <CircleUserRound size={64} color="#b4b2a9" />
                                }
                            </div>
                            <span className="music-tile__label">{artist.name}</span>
                            <span className="playlist-track-count">
                                {getCount(artist.id)} {declension(getCount(artist.id))}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
};

const ArtistMenu = ({ setCurrentTrack, RollBack }) => {
    return (
        <Routes>
            <Route
                index
                element={
                    <ArtistList
                        RollBack={RollBack}
                    />
                }
            />
            <Route
                path=":artistId/*"
                element={
                    <ArtistItem
                        setCurrentTrack={setCurrentTrack}
                        RollBack={RollBack}
                    />
                }
            />
        </Routes>
    );
};

export default ArtistMenu;