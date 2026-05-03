import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import PlaylistItem from "./PlaylistItem";
import "./AlbumMenu.css"
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";

const AlbumList = ({ albums, UsingContext, RollBack }) => {
    const navigate = useNavigate();

    return (
        <div className="playlist-home">
            <div className="menuHeader">
                {UsingContext !== "menu" ?
                    <>
                        <button className="music-back" onClick={() => RollBack(null)}>← Назад</button>
                        <h1>Все альбомы: {UsingContext}</h1>
                    </>
                    :
                    <button className="music-back" onClick={() => RollBack(null)}>← Назад</button>
                }
            </div>
            <div className="playlist-grid">
                {albums.map(({ id, title, artist, date, cover}) => (
                    <button
                        key={id}
                        onClick={() => navigate(id)}
                    >
                        <div className="album-imagediv">
                            <img src={`/api/files/${cover}`} alt={`${title}`} />
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

const AlbumDetail = ({ albums, setCurrentTrack }) => {
    const { albumId } = useParams();
    const navigate = useNavigate();
    const [tracks, setTracks] = useState(null);

    useEffect(() => {
        (async () => {
            const result = await axios.post(`/api/releases/${albumId}/tracks`)
                .then(res => res.data);

            setTracks(result);
        })()
    }, [])

    const album = albums.find(a => a.id === albumId);
    if (!album) return <Navigate to=".." relative="path" replace />;

    if (tracks)
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
    const [albumsData, setAlbumsData] = useState(null);

    useEffect(() => {
        (async () => {
            const result =
                await axios.post(`/api/users/favoriteReleases`)
                    .then(res => res.data)

            console.log(result)

            setAlbumsData(result)
        })()
    }, [])

    if (albumsData)
        return (
            <Routes>
                <Route
                    index
                    element={
                        <AlbumList
                            albums={albumsData}
                            UsingContext={UsingContext}
                            RollBack={RollBack}
                        />
                    }
                />
                <Route
                    path=":albumId"
                    element={
                        <AlbumDetail
                            albums={albumsData}
                            setCurrentTrack={setCurrentTrack}
                        />
                    }
                />
            </Routes>
        );
};

export default AlbumMenu;