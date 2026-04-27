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

// const socket = io("http://localhost:8080");

const music = [
    "morgenshtern-cvetok-(allmusic.kz).mp3",
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


const PLaylistMenu = ({setCurrentTrack, RollBack}) => {
    const [trackList, setTrackList] = useState([]);

    const PLAYLIST_ITEMS = [
        { id: "morgen", label: "MORGENSHTERN: лучшее", tracks: trackList, img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen1", label: "MORGENSHTERN: лучшее", tracks: trackList, img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen2", label: "MORGENSHTERN: лучшее", tracks: trackList, img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen3", label: "MORGENSHTERN: лучшее", tracks: trackList, img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
        { id: "morgen4", label: "MORGENSHTERN: худшее", tracks: [], img:  "https://icdn.lenta.ru/images/2020/07/02/15/20200702153912245/square_320_fe036ec8f91d554ea933c79675902800.png"},
    ];

    const [activePage, setActivePage] = useState(() => {
        const savedId = localStorage.getItem("musicActivePage");
        return savedId ? PLAYLIST_ITEMS.find(p => p.id === savedId) || null : null;
    });

    const handleSetPage = (page) => {
        setActivePage(page);
        if (page) {
            localStorage.setItem("musicActivePage", page.id);
        } else {
            localStorage.removeItem("musicActivePage");
        }
    };

    const getTrack = async (trackId) => {
        try {
            const res =  await axios.post(`/api/tracks/getTrack/${trackId}`)

            return res.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    useEffect(() => {
        (async () => {
            const tracks = await Promise.all(music.map(async name => {
                return await getTrack(name);
            }));
            setTrackList(tracks.filter(track => track !== null));
        })();
    }, []);

    if (!activePage) {
        return (
            <div className="playlist-home">
                <button className="music-back" onClick={() => RollBack(null)}>
                    ← Назад
                </button>
                <div className="playlist-grid">
                    {PLAYLIST_ITEMS.map(({ id, label, img, tracks }) => (
                        <button
                            key={id}
                            onClick={() => handleSetPage({ id, label, img, tracks })}
                        >
                            <div className="album-imagediv">
                                <img src={img} alt="" />
                            </div>
                            <span className="music-tile__label">{label}</span>
                            <span className="playlist-track-count">{tracks.length} {getWordForm(tracks.length)}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    else return (
        <PlaylistItem Tracks={activePage.tracks} title={activePage.label} type="Плейлист" image={activePage.img} setCurrentTrack={setCurrentTrack} RollBack = {handleSetPage}/>
    );
};

export default PLaylistMenu;