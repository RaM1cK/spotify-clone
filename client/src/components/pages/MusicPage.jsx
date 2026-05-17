import React, {useRef} from "react";
import {Navigate, Route, Routes, useNavigate} from "react-router-dom";
import {CircleUserRound, Disc3, Heart, LayoutList} from "lucide-react";
import Liked from "./MusicPages/Liked";
import PlaylistMenu from "./MusicPages/PlaylistMenu";
import AlbumMenu from "./MusicPages/AlbumMenu";
import ArtistMenu from "./MusicPages/ArtistMenu";
import "./MusicPage.css";

const MENU_ITEMS = [
    { id: "liked",     path: "/music/liked",       label: "Избранное",   sub: "Вам понравилось", Icon: Heart,           color: "info" },
    { id: "playlists", path: "/music/playlists",   label: "Плейлисты",   sub: "Ваши подборки",   Icon: LayoutList,      color: "success" },
    { id: "artists",   path: "/music/artists",     label: "Исполнители", sub: "По артистам",     Icon: CircleUserRound, color: "warning" },
    { id: "albums",    path: "/music/albums",      label: "Альбомы",     sub: "Дискография",     Icon: Disc3,           color: "danger" },
];

const MusicHome = () => {
    const navigate = useNavigate();

    return (
        <div className="MusicPage">
            <div className="music-home">
                <h1 className="music-home__title">Коллекция</h1>
                <div className="music-grid">
                    {MENU_ITEMS.map(({ id, path, label, sub, Icon, color }) => (
                        <button
                            key={id}
                            className={`music-tile music-tile--${color}`}
                            onClick={() => navigate(path)}
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
        </div>
    );
};

const MusicPage = ({ trackList, ALBUM_ITEMS, artists, setCurrentTrack }) => {
    const navigate = useNavigate();

    const rollBack = () => navigate(-1);

    return (
        <Routes>
            <Route index element={<MusicHome />} />

            <Route
                path="liked"
                element={
                    <Liked
                        setCurrentTrack={setCurrentTrack}
                        RollBack={rollBack}
                    />
                }
            />

            <Route
                path="playlists/*"
                element={
                    <PlaylistMenu
                        setCurrentTrack={setCurrentTrack}
                        RollBack={rollBack}
                    />
                }
            />

            <Route
                path="artists/*"
                element={
                    <ArtistMenu
                        artists={artists}
                        tracks={trackList}
                        albums={ALBUM_ITEMS}
                        setCurrentTrack={setCurrentTrack}
                        RollBack={rollBack}
                    />
                }
            />

            <Route
                path="albums/*"
                element={
                    <AlbumMenu
                        setCurrentTrack={setCurrentTrack}
                        albums={ALBUM_ITEMS}
                        RollBack={rollBack}
                        UsingContext="menu"
                    />
                }
            />

            <Route path="*" element={<Navigate to="/music" replace />} />
        </Routes>
    );
};

export default MusicPage;