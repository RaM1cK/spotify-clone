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

const SESSION_KEY = "app_session";

axios.defaults.withCredentials = true;

const PAGES = [
    { id: "testTrack",   path: "/music/*",  navPath: "/music",    component: MusicPage, label: "Музыка" },
    { id: "messagePage", path: "/messages", navPath: "/messages", component: Messages,  label: "Сообщения" },
    { id: "testPage",    path: "/gazan",    navPath: "/gazan",    component: testpage,  label: "Газан" },
];

function AppLayout({ setCurrentTrack, currentTrack, menuOpen, setMenuOpen }) {
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
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
            <MenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
            <div style={{ display: "flex", flex: 1 }}>
                <ContextMenu PAGES={PAGES} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
                <main style={{
                    flex: 1,
                    paddingBottom: currentTrack
                        ? `calc(${playerHeight}px + env(safe-area-inset-bottom))`
                        : "env(safe-area-inset-bottom)"
                }}>
                    <Routes>
                        {PAGES.map(({ path, component: Component }) => (
                            <Route
                                key={path}
                                path={path}
                                element={<Component setCurrentTrack={setCurrentTrack} />}
                            />
                        ))}
                        <Route path="*" element={<Navigate to="/music" replace />} />
                    </Routes>
                </main>
            </div>
            <div ref={playerRef} style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
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

    if (loading) return <div>Загрузка...</div>;
    if (!session) return <AuthPage onAuth={handleAuth} />;

    return (
        <BrowserRouter>
            <AppLayout
                setCurrentTrack={setCurrentTrack}
                currentTrack={currentTrack}
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
            />
        </BrowserRouter>
    );
}

export default App;