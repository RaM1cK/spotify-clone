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
                {albums.map(({ id, label, sub, sub2, img, tracks }) => (
                    <button
                        key={id}
                        onClick={() => navigate(id)}
                    >
                        <div className="album-imagediv">
                            <img src={img} alt="" />
                        </div>
                        <span className="music-tile__label">{label}</span>
                        {UsingContext === "menu" && <span className="album-autor">{sub}</span>}
                        <span className="date-issingle">{sub2}{(tracks ?? []).length === 1 ? " · сингл" : ""}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const AlbumDetail = ({ albums, setCurrentTrack }) => {
    const { albumId } = useParams();
    const navigate = useNavigate();

    const album = albums.find(a => a.id === albumId);
    if (!album) return <Navigate to=".." relative="path" replace />;

    return (
        <PlaylistItem
            Tracks={album.tracks ?? []}
            title={album.label}
            type="Альбом"
            image={album.img}
            setCurrentTrack={setCurrentTrack}
            AutName={album.sub}
            year={album.sub2}
            RollBack={() => navigate(-1)}
        />
    );
};

const AlbumMenu = ({ albums, setCurrentTrack, RollBack, UsingContext }) => {
    return (
        <Routes>
            <Route
                index
                element={
                    <AlbumList
                        albums={albums}
                        UsingContext={UsingContext}
                        RollBack={RollBack}
                    />
                }
            />
            <Route
                path=":albumId"
                element={
                    <AlbumDetail
                        albums={albums}
                        setCurrentTrack={setCurrentTrack}
                    />
                }
            />
        </Routes>
    );
};

export default AlbumMenu;