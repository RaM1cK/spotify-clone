import io from 'socket.io-client';
import React, {useEffect, useState, useMemo} from "react";
import Player from "../UI/Player/Player";
import {Button, Nav, NavLink} from "react-bootstrap";
import { ListMusic, LayoutList, CircleUserRound, Disc3, Heart, Clock } from "lucide-react";
import axios from "axios";
import "../../App.css";
import TrackList from "../UI/TrackList/TrackList";
import "./MusicPage.css"
import Liked from "./MusicPages/Liked";
import PlaylistMenu from "./MusicPages/PlaylistMenu";
import AlbumMenu from "./MusicPages/AlbumMenu";
import ArtistMenu from "./MusicPages/ArtistMenu";
// const socket = io("http://localhost:8080");

const MENU_ITEMS = [
    { id: "liked",     label: "Избранное",   sub: "Вам понравилось", Icon: Heart,            color: "info" }, ,
    { id: "playlists", label: "Плейлисты",   sub: "Ваши подборки",   Icon: LayoutList,       color: "success" },
    { id: "artists",   label: "Исполнители", sub: "По артистам",     Icon: CircleUserRound,  color: "warning" },
    { id: "albums",    label: "Альбомы",     sub: "Дискография",     Icon: Disc3,            color: "danger" },
];


const MusicPage = ({setCurrentTrack}) => {
    const music = [
        { src: 1,                        artistId: 1 },
        { src: "Jane_Remover_-_Dancing_with_your_eyes_closed_80039450.mp3",    artistId: 2 },
        { src: "morgenshtern-уфф-деньги.mp3",                                  artistId: 1 },
        { src: "MORGENSHTERN_-_Novyjj_merin_66404393.mp3",                     artistId: 1 },
        { src: "gazan-khochu-bit-kak-gazan-(allmusic.kz).mp3",                 artistId: 3 },
    ];

    const artists = [
        { id: 1, name: "Morgenshtern", photo: "https://www.zakon.kz/pbi/WEBP/2025-02-19/file-a3417f56-d40b-4703-af10-cfbe7f10f827/800x450.orig.webp" },
        { id: 2, name: "Jane Remover", photo: "https://images.squarespace-cdn.com/content/v1/50527c0c24ac3b03d5345ee2/db4dbe6b-6c1f-47fa-b96f-49cb424aaaf1/15868369.jpeg" },
        { id: 3, name: "Gazan",        photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-Vek7QsauspkcdTMgCfRX8TdM_3u0M7NrnQ&s" },
    ];

    const [trackList, setTrackList] = useState([]);

    const ALBUM_ITEMS = useMemo(() => [
        { id: "morgen_alb", label: "Легендарная пыль 2", sub: "Morgenshtern", sub2: "2027", tracks: trackList, img: "https://upload.wikimedia.org/wikipedia/ru/0/0f/%D0%9B%D0%B5%D0%B3%D0%B5%D0%BD%D0%B4%D0%B0%D1%80%D0%BD%D0%B0%D1%8F_%D0%BF%D1%8B%D0%BB%D1%8C.jpg" },
        { id: "flower",     label: "Цветок",             sub: "Morgenshtern", sub2: "2022", tracks: trackList[0] ? [trackList[0]] : [], img: "https://images.genius.com/76714eccf8df6ec9924514712f9cdd15.1000x1000x1.png" },
    ], [trackList]);

    const [activePage, setActivePage] = useState(
        //() => localStorage.getItem("musicActivePage") ||
        null
    );

    const handleSetPage = (page) => {
        setActivePage(page);
        if (page) {
            localStorage.setItem("musicActivePage", page);
        } else {
            localStorage.removeItem("musicActivePage");
        }
    };

    if (!activePage) {
        return (
            <div className="music-home">
                <h1 className="music-home__title">Куда отправимся?</h1>
                <div className="music-grid">
                    {MENU_ITEMS.map(({ id, label, sub, Icon, color }) => (
                        <button
                            key={id}
                            className={`music-tile music-tile--${color}`}
                            onClick={() => handleSetPage(id)}
                        >
                            <div className={`music-tile__icon music-tile__icon--${color}`}>
                                <Icon size={22} />
                            </div>
                            <span className="music-tile__label">{label}</span>
                            <span className="music-tile__sub">{sub}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Подстраница
    return (
        <div className="music-subpage">
            {activePage === "liked" && (
                <>
                    <Liked Tracks={trackList} setCurrentTrack={setCurrentTrack} RollBack = {handleSetPage} />
                </>
            )}

            {activePage === "playlists" && (
               <>
                   <PlaylistMenu setCurrentTrack={setCurrentTrack} RollBack = {handleSetPage}/>
               </>
            )}
            {activePage === "artists" && (
                <ArtistMenu
                    artists={artists}
                    tracks={trackList}
                    albums={ALBUM_ITEMS}
                    setCurrentTrack={setCurrentTrack}
                    onSelectArtist={null}
                    RollBack = {handleSetPage}
                />
            )}
            {activePage === "albums"    && (
                <>
                    <AlbumMenu setCurrentTrack = {setCurrentTrack} albums={ALBUM_ITEMS} RollBack = {handleSetPage} UsingContext={"menu"}/>
                </>
            )}
        </div>
    );
};

export default MusicPage;