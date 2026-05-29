import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

import Player from "./components/UI/Player/Player";
import AuthPage from "./AuthPage";
import MusicPage from "./components/pages/MusicPage";
import ContextMenu from "./components/ContextMenu";
import testpage from "./components/pages/testpage";
import MenuButton from "./components/MenuButton";
import SearchPage from "./components/pages/MusicPages/SearchPage";
import Messages from "./components/pages/Messager/Messages";
import MyProfile, { UserProfile } from "./components/pages/MyProfile";
import { LoadingPage } from "./components/pages/LoadingPage";
import {
    AppProvider,
    useCurrentTrack,
    useSetCurrentTrack,
    useSession,
    useSetSession,
} from "./AppContext";
import playlistItem from "./components/pages/MusicPages/PlaylistItem";
import ChartsPage from "./components/pages/MusicPages/ChartsPage";

const PAGES = [
    { id: "testTrack",   path: "/music/*",  navPath: "/music",    component: MusicPage,  label: "Коллекция" },
    { id: "search",      path: "/search",   navPath: "/search",   component: SearchPage, label: "Поиск" },
    { id: "charts",      path: "/charts",   navPath: "/charts",   component: ChartsPage, label: "Популярно" },
    { id: "messagePage", path: "/messages", navPath: "/messages", component: Messages,   label: "Сообщения" },
    { id: "testPage",    path: "/gazan",    navPath: "/gazan",    component: testpage,   label: "Газан" },
];

const ROUTES_PAGES = [
    ...PAGES,
    { id: "myProfile",   path: "/me",                   component: MyProfile   },
    { id: "userProfile", path: "/profile/:id",          component: UserProfile },
    { id: "userLiked",   path: "/profile/:id/liked",    component: playlistItem },
];

function AppLayout({ menuOpen, setMenuOpen, onLogout }) {
    const currentTrack    = useCurrentTrack();
    const setCurrentTrack = useSetCurrentTrack();
    const playerRef       = useRef(null);

    useEffect(() => {
        if (!playerRef.current) return;
        const observer = new ResizeObserver(() => {});
        observer.observe(playerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="app-root">
            <MenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

            <div className="app-body">
                <ContextMenu
                    PAGES={PAGES}
                    ROUTES_PAGES={ROUTES_PAGES}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    onLogout={onLogout}
                />

                <main className="app-main">
                    <div className="app-content">
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

function AppInner() {
    const session         = useSession();
    const setSession      = useSetSession();
    const setCurrentTrack = useSetCurrentTrack();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading]   = useState(true);

    const handleAuth = () =>
        axios.get('/api/users/me')
            .then(res => {
                setSession(res.data);
                setCurrentTrack(res.data.currentTrack);
            })
            .catch(() => setSession(null))
            .finally(() => setLoading(false));

    const handleLogout = () =>
        axios.post('/api/users/logout')
            .then(() => {
                setSession(null);
                setCurrentTrack(null);
            });

    useEffect(() => { handleAuth(); }, []);

    if (loading) return <LoadingPage />;

    if (!session) return <AuthPage onAuth={handleAuth} setSession={setSession} />;

    return (
        <BrowserRouter>
            <AppLayout
                menuOpen={menuOpen}
                setMenuOpen={setMenuOpen}
                onLogout={handleLogout}
            />
        </BrowserRouter>
    );
}

export default function App() {
    return (
        <AppProvider>
            <AppInner />
        </AppProvider>
    );
}