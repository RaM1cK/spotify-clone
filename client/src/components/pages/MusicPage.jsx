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


const MusicPage = ({trackList, ALBUM_ITEMS, artists, setCurrentTrack}) => {
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