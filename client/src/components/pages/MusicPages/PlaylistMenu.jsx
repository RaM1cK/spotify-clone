import io from 'socket.io-client';
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

// const socket = io("http://localhost:8080");

const music = [
    1,
    "morgenshtern-уфф-деньги.mp3",
    "MORGENSHTERN_-_Novyjj_merin_66404393.mp3"
]

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



const PlaylistMenu = ({trackList, setCurrentTrack, RollBack }) => {
    const navigate = useNavigate();

    const PLAYLIST_ITEMS = [
        { id: "morgen", label: "MORGENSHTERN: лучшее", tracks: trackList ?? [] , img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen1", label: "MORGENSHTERN: лучшее", tracks: trackList ?? [], img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen2", label: "MORGENSHTERN: лучшее", tracks: trackList ?? [], img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen3", label: "MORGENSHTERN: лучшее", tracks: trackList ?? [], img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen4", label: "MORGENSHTERN: худшее", tracks: [], img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
    ];

    return (
        <Routes>
            <Route
                index
                element={
                    <PlaylistList
                        items={PLAYLIST_ITEMS}
                        onSelect={(item) => navigate(item.id)}
                        RollBack={RollBack}
                    />
                }
            />
            <Route
                path=":playlistId"
                element={
                    <PlaylistDetail
                        items={PLAYLIST_ITEMS}
                        setCurrentTrack={setCurrentTrack}
                        RollBack={() => navigate(-1)}
                    />
                }
            />
        </Routes>
    );
};

// Список плейлистов
const PlaylistList = ({ items, onSelect, RollBack }) => (
    <div className="playlist-home">
        <button className="music-back" onClick={RollBack}>← Назад</button>
        <div className="playlist-grid">
            {items.map((item) => (
                <button key={item.id} onClick={() => onSelect(item)}>
                    <div className="album-imagediv">
                        <img src={item.img} alt="" />
                    </div>
                    <span className="music-tile__label">{item.label}</span>
                    <span className="playlist-track-count">
                        {item.tracks.length} {getWordForm(item.tracks.length)}
                    </span>
                </button>
            ))}
        </div>
    </div>
);

// Открытый плейлист
const PlaylistDetail = ({ items, setCurrentTrack, RollBack }) => {
    const { playlistId } = useParams();
    const item = items.find((p) => p.id === playlistId);

    if (!item) return <Navigate to="/music/playlists" replace />;
    console.log(item.tracks)
    return (
        <PlaylistItem
            Tracks={item.tracks}
            title={item.label}
            type="Плейлист"
            image={item.img}
            setCurrentTrack={setCurrentTrack}
            RollBack={RollBack}
        />

    );
};

export default PlaylistMenu;