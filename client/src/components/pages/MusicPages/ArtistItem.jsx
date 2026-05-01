import React, {useState} from 'react';
import "./ArtistItem.css"
import {ChevronRight, Pause, Play} from "lucide-react";
import {Routes, Route, useNavigate} from "react-router-dom";
import AlbumMenu from "./AlbumMenu";
import TrackList from "../../UI/TrackList/TrackList";
import PlaylistItem from "./PlaylistItem";
import {Player} from "../../../classes/Player.ts";
import usePlayerState from "../../../hooks/usePlayerState";

const declension = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return "трек";
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "трека";
    return "треков";
};

const ArtistMain = ({ artist, tracks, albums, setCurrentTrack }) => {
    const navigate = useNavigate();
    const player = React.useRef(Player.getInstance()).current;
    const isPlaying = usePlayerState(player, tracks);

    const artistAlbums = albums.filter(a => a.sub === artist.name);
    const previewTracks = tracks.slice(0, 5);
    const previewAlbums = artistAlbums.slice(0, 5);

    const getCount = (artistId) =>
        tracks.filter(t => t.artistId === artistId).length;

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
            <button className="music-back" onClick={() => navigate(-1)}>← Назад</button>
            <div className="artist-header">
                <div className="artist-header__image">
                    <img src={artist.photo} alt={artist.name}/>
                </div>
                <div className="artist-header__info">
                    <h1 className="artist-header__name">{artist.name}</h1>
                    <div className="artist-header__bottom">
                        <div className="artist-header__meta">
                            <span className="artist-header__type">Артист</span>
                            <span className="artist-header__count">
                                {getCount(artist.id)} {declension(getCount(artist.id))}
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
                    </div>
                </div>
            </div>

            {artistAlbums.length > 0 && (
                <div className="artist-albums-section">
                    <button
                        className="artist-albums-header"
                        onClick={() => navigate("albums")}
                    >
                        <span>Альбомы</span>
                        <ChevronRight size={18} color="#a3a3a3" />
                    </button>
                    <div className="playlist-grid">
                        {previewAlbums.map(({ id, label, sub2, img, tracks: aTracks }) => (
                            <button
                                key={id}
                                onClick={() => navigate(`albums/${id}`)}
                            >
                                <div className="album-imagediv">
                                    <img src={img} alt="" />
                                </div>
                                <span className="music-tile__label">{label}</span>
                                <span className="date-issingle">
                                    {sub2}{aTracks.length === 1 ? " · сингл" : ""}
                                </span>
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
                        tracks={previewTracks}
                        setCurrentTrack={setCurrentTrack}
                        UsingContext={null}
                    />
                </div>
            )}
        </div>
    );
};

const ArtistItem = ({ artist, tracks, albums, setCurrentTrack, RollBack }) => {
    const navigate = useNavigate();
    const artistAlbums = albums.filter(a => a.sub === artist.name);

    return (
        <Routes>
            <Route
                index
                element={
                    <ArtistMain
                        artist={artist}
                        tracks={tracks}
                        albums={albums}
                        setCurrentTrack={setCurrentTrack}
                    />
                }
            />
            <Route
                path="tracks"
                element={
                    <TrackList
                        tracks={tracks}
                        setCurrentTrack={setCurrentTrack}
                        UsingContext={artist.name}
                        RollBack={() => navigate(-1)}
                    />
                }
            />
            <Route
                path="albums/*"
                element={
                    <AlbumMenu
                        albums={artistAlbums}
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