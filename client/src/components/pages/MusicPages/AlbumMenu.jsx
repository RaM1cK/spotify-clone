import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import PlaylistItem from "./PlaylistItem";
import "./AlbumMenu.css"
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import {ChevronLeft} from "lucide-react";
import {LoadingPage} from "../LoadingPage";

const AlbumList = ({ artistId, UsingContext, RollBack }) => {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(artistId ? `/api/artists/${artistId}/releases` : `/api/users/me/favoriteReleases`)
            .then(res => setAlbums(res.data))
            .catch(() => setError('Ошибка загрузки'))
            .finally(() => setLoading(false));
    }, [artistId]);

    if (loading) return <LoadingPage/>;
    if (error) return <div>{error}</div>;

    if (albums)
        return (
            <div className="playlist-home">
                <div className="menuHeader">
                    {UsingContext !== "menu" ?
                        <>
                            <button className="music-back" onClick={() => RollBack(null)}><ChevronLeft size={20} /></button>
                            <h1>Все альбомы: {UsingContext}</h1>
                        </>
                        :
                        <button className="music-back" onClick={() => RollBack(null)}><ChevronLeft size={20} /></button>
                    }
                </div>
                <div className="playlist-grid">
                    {albums.map(({ id, title, artist, date, cover }) => (
                        <button key={id} onClick={() => navigate(id)}>
                            <div className="album-imagediv">
                                <img src={`/api/files/${cover}`} alt={title} />
                            </div>
                            <span className="music-tile__label">{title}</span>
                            {UsingContext === "menu" && <span className="album-autor">{artist}</span>}
                            <span className="date-issingle">{date}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
};

const AlbumDetail = ({ setCurrentTrack }) => {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [tracks, setTracks] = useState(null);
    const [album, setAlbum] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            axios.get(`/api/releases/${albumId}`),
            axios.get(`/api/releases/${albumId}/tracks`)
        ])
            .then(([albumRes, tracksRes]) => {
                if (!albumRes.data) {
                    setError('Альбом не найден');
                    return;
                }
                setAlbum(albumRes.data);
                setTracks(tracksRes.data);
            })
            .catch((err) => {
                if (err.response?.status === 404) setError('Альбом не найден');
                else setError('Ошибка загрузки');
            })
            .finally(() => setLoading(false));
    }, [albumId]);

    if (loading) return <LoadingPage/>;
    if (error) return <div>{error}</div>;

    if (album && tracks)
        return (
            <PlaylistItem
                Tracks={tracks}
                title={album.title}
                type="Альбом"
                image={`/api/files/${album.cover}`}
                setCurrentTrack={setCurrentTrack}
                AutName={album.artist}
                year={album.date}
                RollBack={() => navigate(-1)}
            />
        );
};

const AlbumMenu = ({ setCurrentTrack, RollBack, UsingContext }) => {
    const { artistId } = useParams();

    return (
        <Routes>
            <Route
                index
                element={
                    <AlbumList
                        artistId={artistId}
                        UsingContext={UsingContext}
                        RollBack={RollBack}
                    />
                }
            />
            <Route
                path=":albumId"
                element={
                    <AlbumDetail setCurrentTrack={setCurrentTrack} />
                }
            />
        </Routes>
    );
};

export default AlbumMenu;