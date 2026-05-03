import io from 'socket.io-client';
import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Player from "./components/UI/Player/Player";
import axios from "axios";
import "./App.css";
import AuthPage from "./AuthPage";
import MusicPage from "./components/pages/MusicPage";
import ContextMenu from "./components/ContextMenu";
import testpage from "./components/pages/testpage";
import MenuButton from "./components/MenuButton";
import Messages from "./components/pages/Messager/Messages";
import SearchBar from "./components/SearchBar";

const SESSION_KEY = "app_session";

axios.defaults.withCredentials = true;

const PAGES = [
    { id: "testTrack",   path: "/music/*",  navPath: "/music",    component: MusicPage, label: "Музыка" },
    { id: "messagePage", path: "/messages", navPath: "/messages", component: Messages,  label: "Сообщения" },
    { id: "testPage",    path: "/gazan",    navPath: "/gazan",    component: testpage,  label: "Газан" },
];

function AppLayout({ trackList, setCurrentTrack, ALBUM_ITEMS, artists, currentTrack, menuOpen, setMenuOpen }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
            <MenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
                <ContextMenu
                    PAGES={PAGES}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                />
                <main style={{ flex: 1, overflowY: "auto" }}>
                    <Routes>
                        {PAGES.map(({ path, component: Component }) => (
                            <Route
                                key={path}
                                path={path}
                                element={
                                    <Component
                                        trackList={trackList}
                                        setCurrentTrack={setCurrentTrack}
                                        ALBUM_ITEMS={ALBUM_ITEMS}
                                        artists={artists}
                                    />
                                }
                            />
                        ))}
                        <Route path="*" element={<Navigate to="/music" replace />} />
                    </Routes>
                </main>
            </div>
            <Player track={currentTrack} setTrack={setCurrentTrack} />
        </div>
    );
}

function App() {
    const [session, setSession] = useState(null);
    const [trackList, setTrackList] = useState([]);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const music = [
        { src: '1',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '2',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '3',                        artistId: 3, mainAlbId:  "tsoi_alb"},
        { src: '4',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '5',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '6',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '7',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '8',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '9',                        artistId: 2, mainAlbId:  "tsoi_alb"},
        { src: '10',                        artistId: 1, mainAlbId:  "morgen_alb"},
        // { src: "Jane_Remover_-_Dancing_with_your_eyes_closed_80039450.mp3",    artistId: 2, mainAlbId: "Jane_Danced"},
        // { src: "morgenshtern-уфф-деньги.mp3",                                  artistId: 1, mainAlbId: "morgen_alb" },
        // { src: "MORGENSHTERN_-_Novyjj_merin_66404393.mp3",                     artistId: 1, mainAlbId: "morgen_alb" },
        // { src: "gazan-khochu-bit-kak-gazan-(allmusic.kz).mp3",                 artistId: 3, mainAlbId: "Want_to_be_like_Gazan"},
    ];

    const artists = [
        { id: 1, name: "Morgenshtern", photo: "https://www.zakon.kz/pbi/WEBP/2025-02-19/file-a3417f56-d40b-4703-af10-cfbe7f10f827/800x450.orig.webp" },
        { id: 2, name: "Jane Remover", photo: "https://images.squarespace-cdn.com/content/v1/50527c0c24ac3b03d5345ee2/db4dbe6b-6c1f-47fa-b96f-49cb424aaaf1/15868369.jpeg" },
        { id: 3, name: "Gazan",        photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-Vek7QsauspkcdTMgCfRX8TdM_3u0M7NrnQ&s" },
    ];

    const ALBUM_ITEMS = useMemo(() => [
        {id: '1'},
        {id: '2'},
        // { id: "morgen_alb", label: "Легендарная пыль 2", sub: "Morgenshtern", sub2: "2027", tracks: trackList, img: "https://upload.wikimedia.org/wikipedia/ru/0/0f/%D0%9B%D0%B5%D0%B3%D0%B5%D0%BD%D0%B4%D0%B0%D1%80%D0%BD%D0%B0%D1%8F_%D0%BF%D1%8B%D0%BB%D1%8C.jpg" },
        // { id: "flower",     label: "Цветок",             sub: "Morgenshtern", sub2: "2022", tracks: trackList[0] ? [trackList[0]] : [], img: "https://images.genius.com/76714eccf8df6ec9924514712f9cdd15.1000x1000x1.png" },
        // { id: "Jane_Danced", label: "Danced with your eyes closed", sub: "Jane Remover", sub2: "2021", tracks: trackList[1] ? [trackList[1]] : [], img:  artists[1].photo},
        // { id: "Want_to_be_like_Gazan", label: "Хочу быть как Газан", sub: "Gazan", sub2: "2026", tracks: trackList[4] ? [trackList[4]] : [], img:  artists[2].photo},
    ], [trackList]);

    // const getTrack = (trackId) => {
    //     try {
    //         return axios.post(`/api/tracks/${trackId}/info`)
    //             .then(res => res.data);
    //     } catch (error) {
    //         console.error(error);
    //         return null;
    //     }
    // };
    //
    // useEffect(() => {
    //     (async () => {
    //         const tracks = await Promise.all(
    //             music.map(async ({ src, artistId, mainAlbId }) => {
    //                 const track = await getTrack(src);
    //                 return track ? { ...track, artistId, mainAlbId } : null;
    //             })
    //         );
    //         setTrackList(tracks.filter(Boolean));
    //     })();
    // }, []);

    // const initializeSocket = (token) => {
    //     const socket = io('ws://localhost:8080', { auth: { token } });
    //     socket.on('connect', () => console.log('Socket.IO connected'));
    //     socket.on('connect_error', (err) => {
    //         console.error('Socket connection failed:', err.message);
    //         if (err.message === 'USER_DOESNT_EXISTS') handleLogout();
    //     });
    //     return socket;
    // };

    const handleAuth = () => {
        axios.get(`/api/users/me`)
            .then(res => setSession(res.data));
    };

    const handleLogout = () => {
        axios.post('/api/users/logout')
            .then(() => setSession(null));
    };

    useEffect(() => {
        axios.get(`/api/users/me`)
            .then(res => setSession(res.data))
            .catch(() => setSession(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!session) return <AuthPage onAuth={handleAuth} />;

    return (
        <BrowserRouter>
            <AppLayout
                trackList={trackList}
                setCurrentTrack={setCurrentTrack}
                ALBUM_ITEMS={ALBUM_ITEMS}
                artists={artists}
                currentTrack={currentTrack}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />
        </BrowserRouter>
    );
}

export default App;