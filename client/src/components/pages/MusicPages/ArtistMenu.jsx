// ArtistMenu.jsx
import React from "react";
import { CircleUserRound } from "lucide-react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import "./ArtistMenu.css";
import ArtistItem from "./ArtistItem";

const declension = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return "трек";
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "трека";
    return "треков";
};

const ArtistList = ({ artists, tracks, RollBack }) => {
    const navigate = useNavigate();

    const getCount = (artistId) =>
        tracks.filter(t => t.artistId === artistId).length;

    return (
        <div className="playlist-home">
            <button className="music-back" onClick={() => RollBack(null)}>
                ← Назад
            </button>
            <div className="playlist-grid">
                {artists.map((artist) => (
                    <button
                        key={artist.id}
                        onClick={() => navigate(encodeURIComponent(artist.name))}
                    >
                        <div className="artist-avatar">
                            {artist.photo
                                ? <img src={artist.photo} alt={artist.name} />
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

const ArtistDetail = ({ artists, tracks, albums, setCurrentTrack }) => {
    const { artistName } = useParams();
    const navigate = useNavigate();

    const artist = artists.find(
        a => a.name === decodeURIComponent(artistName)
    );

    if (!artist) return <Navigate to="/music/artists" replace />;

    return (
        <ArtistItem
            artist={artist}
            tracks={tracks.filter(t => t.artistId === artist.id)}
            albums={albums}
            setCurrentTrack={setCurrentTrack}
            RollBack={() => navigate(-1)}
        />
    );
};

const ArtistMenu = ({ artists, albums, tracks, setCurrentTrack, RollBack }) => {
    return (
        <Routes>
            <Route
                index
                element={
                    <ArtistList
                        artists={artists}
                        tracks={tracks}
                        RollBack={RollBack}
                    />
                }
            />
            <Route
                path=":artistName/*"
                element={
                    <ArtistDetail
                        artists={artists}
                        tracks={tracks}
                        albums={albums}
                        setCurrentTrack={setCurrentTrack}
                    />
                }
            />
        </Routes>
    );
};

export default ArtistMenu;