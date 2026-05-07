import io from 'socket.io-client';
import React, {useEffect, useMemo, useRef, useState} from "react";
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
import {AppProvider, useSession, useSocket} from "./AppContext";
import MyProfile from "./components/pages/MyProfile";


const PAGES = [
    { id: "testTrack",   path: "/music/*",  navPath: "/music",    component: MusicPage, label: "Коллекция" },
    { id: "messagePage", path: "/messages", navPath: "/messages", component: Messages,  label: "Сообщения" },
    { id: "testPage",    path: "/gazan",    navPath: "/gazan",    component: testpage,  label: "Газан" },
];

const ROUTES_PAGES = [
    { id: "testTrack",   path: "/music/*",  navPath: "/music",    component: MusicPage, label: "Коллекция" },
    { id: "messagePage", path: "/messages", navPath: "/messages", component: Messages,  label: "Сообщения" },
    { id: "testPage",    path: "/gazan",    navPath: "/gazan",    component: testpage,  label: "Газан" },

    { id: "myProfile", path: "/me", component: MyProfile },
]

function AppLayout({ setCurrentTrack, currentTrack, menuOpen, setMenuOpen, onLogout }) {
    const playerRef = useRef(null);
    const [playerHeight, setPlayerHeight] = useState(0);

    useEffect(() => {
        if (!playerRef.current) return;
        const observer = new ResizeObserver(entries => {
            setPlayerHeight(entries[0].contentRect.height);
        });
        observer.observe(playerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                overflow: "hidden",
            }}
        >
            <MenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

            <div
                style={{
                    display: "flex",
                    flex: 1,
                    overflow: "hidden",
                    minHeight: 0,
                }}
            >
                <ContextMenu
                    PAGES={PAGES}
                    ROUTES_PAGES = {ROUTES_PAGES}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onLogout={onLogout}
                />

                <main
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minHeight: 0,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            margin: "12px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "12px",
                            backgroundColor: "rgba(255, 255, 255, 0.07)",
                            flex: 1,
                            minHeight: 0,
                            overflowY: "auto",
                        }}
                    >
                        <Routes>
                            {ROUTES_PAGES.map(({ path, component: Component }) => (
                                <Route
                                    key={path}
                                    path={path}
                                    element={<Component setCurrentTrack={setCurrentTrack} />}
                                />
                            ))}

                            <Route path="*" element={<Navigate to="/music" replace />} />
                        </Routes>
                    </div>
                </main>
            </div>

            <div ref={playerRef}>
                <Player track={currentTrack} setTrack={setCurrentTrack} />
            </div>
        </div>
    );
}

function App() {
    const [session, setSession] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <div>Загрузка...</div>;
    if (!session) return <AuthPage onAuth={handleAuth} />;

    return (
        <BrowserRouter>
            <AppProvider session={session}>
                <AppLayout
                    setCurrentTrack={setCurrentTrack}
                    currentTrack={currentTrack}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    session={session}
                    onLogout={handleLogout}
                />
            </AppProvider>

        </BrowserRouter>
    );
}

export default App;