import React, {useEffect, useState} from 'react';
import "./ArtistItem.css"
import {ChevronLeft, ChevronRight, CircleUserRound, Heart, Pause, Play} from "lucide-react";
import {Routes, Route, useNavigate, useParams} from "react-router-dom";
import AlbumMenu from "./AlbumMenu";
import TrackList from "../../UI/TrackList/TrackList";
import {Player} from "../../../classes/Player.ts";
import usePlayerState from "../../../hooks/usePlayerState";
import axios from "axios";
import {LoadingPage} from "../LoadingPage";

const declension = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return "трек";
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "трека";
    return "треков";
};

const ArtistMain = ({ artist, isFavorite, toFavorite, setCurrentTrack }) => {
    const navigate = useNavigate();
    const player = React.useRef(Player.getInstance()).current;
    const [tracks, setTracks] = useState(artist.tracks.slice(0, 5));
    const [albums, setAlbums] = useState(artist.releases.slice(0, 5));
    const isPlaying = usePlayerState(player, tracks);

    const getCount = () => artist.trackCount

    const handlePlay = () => {
        const queue = player.queue;
        const isSameQueue = queue.length === tracks.length &&
            queue.every((t, i) => t.id === tracks[i]?.id);

        if (!isSameQueue) {
            player.setTrack(tracks[0], tracks);
        } else {
            player.isPlaying() ? player.pause() : player.play();
        }
    };

    return (
        <div className="artist-item">
            <button className="music-back" onClick={() => navigate(-1)}><ChevronLeft size={20} /></button>
            <div className="artist-header">
                <div className="artist-header__image">
                    {artist.avatar
                        ? <img src={`/api/files/${artist.avatar}`} alt={artist.name} />
                        : <CircleUserRound size={64} color="#b4b2a9" />
                    }
                </div>
                <div className="artist-header__info">
                    <h1 className="artist-header__name">{artist.name}</h1>
                    <div className="artist-header__bottom">
                        <div className="artist-header__meta">
                            <span className="artist-header__type">Артист</span>
                            <span className="artist-header__count">
                                {getCount()} {declension(getCount())}
                            </span>
                        </div>
                        <button
                            className="liked-play-btn-artist"
                            onClick={handlePlay}
                            disabled={tracks.length === 0}
                        >
                            {isPlaying ? <Pause size={18}/> : <Play size={18}/>}
                            <span>Слушать</span>
                        </button>
                        <button
                            className="liked-props-btn"
                            onClick={toFavorite}
                        >
                            <Heart size={18} fill={isFavorite ? 'white' : 'none'}/>
                        </button>
                    </div>
                </div>
            </div>

            {albums.length > 0 && (
                <div className="artist-albums-section">
                    <button
                        className="artist-albums-header"
                        onClick={() => navigate("albums")}
                    >
                        <span>Альбомы</span>
                        <ChevronRight size={18} color="#a3a3a3" />
                    </button>
                    <div className="playlist-grid">
                        {albums.map(({ id, title, cover, date }) => (
                            <button
                                key={id}
                                onClick={() => navigate(`/music/albums/${id}`)}
                            >
                                <div className="album-imagediv">
                                    <img src={`/api/files/${cover}`} alt="" />
                                </div>
                                <span className="music-tile__label">{title}</span>
                                <span className="date-issingle">{date}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {tracks.length > 0 && (
                <div className="artist-albums-section">
                    <button
                        className="artist-albums-header"
                        onClick={() => navigate("tracks")}
                    >
                        <span>Треки</span>
                        <ChevronRight size={18} color="#a3a3a3" />
                    </button>
                    <TrackList
                        tracks={tracks}
                        setCurrentTrack={setCurrentTrack}
                        UsingContext={null}
                    />
                </div>
            )}
        </div>
    );
};

const ArtistItem = ({ setCurrentTrack }) => {
    const navigate = useNavigate();
    const { artistId } = useParams();
    const [artist, setArtist] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        axios.get(`/api/artists/${artistId}`)
            .then(res => {
                setArtist(res.data)
                setIsFavorite(res.data.hasInFavorite)
            })
            .catch(() => setError('Артист не найден'))
            .finally(() => setLoading(false));
    }, [])

    const toFavorite = () => {
        const request = () => isFavorite
            ? axios.delete(`/api/users/removeFavoriteArtist/${artistId}`)
            : axios.post(`/api/users/addFavoriteArtist/${artistId}`)

        request()
            .then(() => {
                const newValue = !isFavorite
                setIsFavorite(newValue)
            })
            .catch(err => console.error(err));
    }

    if (loading) return <LoadingPage/>;
    if (error) return <div>{error}</div>;

    if (artist)
        return (
            <Routes>
                <Route
                    index
                    element={
                        <ArtistMain
                            isFavorite={isFavorite}
                            toFavorite={toFavorite}
                            artist={artist}
                            setCurrentTrack={setCurrentTrack}
                        />
                    }
                />
                <Route
                    path="tracks"
                    element={
                    <div style={{ padding: 32 }}>
                        <TrackList
                            setCurrentTrack={setCurrentTrack}
                            UsingContext={artist.name}
                            RollBack={() => navigate(-1)}
                        />
                    </div>
                    }
                />
                <Route
                    path="albums/*"
                    element={
                        <AlbumMenu
                            setCurrentTrack={setCurrentTrack}
                            UsingContext={artist.name}
                            RollBack={() => navigate(-1)}
                        />
                    }
                />
            </Routes>
        );
};

export default ArtistItem;