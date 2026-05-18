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
import SearchPage from "./components/pages/MusicPages/SearchPage";
import Messages from "./components/pages/Messager/Messages";
import {AppProvider, useSession, useSocket} from "./AppContext";
import MyProfile from "./components/pages/MyProfile";
import {UserProfile} from "./components/pages/MyProfile";
import {LoadingPage} from "./components/pages/LoadingPage";



const PAGES = [
    { id: "testTrack",   path: "/music/*",  navPath: "/music",    component: MusicPage, label: "Коллекция" },
    { id: "search",      path: "/search",   navPath: "/search",   component: SearchPage, label: "Поиск" },
    { id: "messagePage", path: "/messages", navPath: "/messages", component: Messages,  label: "Сообщения" },
    { id: "testPage",    path: "/gazan",    navPath: "/gazan",    component: testpage,  label: "Газан" },
];

const ROUTES_PAGES = [
    { id: "testTrack",   path: "/music/*",  navPath: "/music",    component: MusicPage, label: "Коллекция" },
    { id: "search",      path: "/search",   navPath: "/search",   component: SearchPage, label: "Поиск" },
    { id: "messagePage", path: "/messages", navPath: "/messages", component: Messages,  label: "Сообщения" },
    { id: "testPage",    path: "/gazan",    navPath: "/gazan",    component: testpage,  label: "Газан" },

    { id: "myProfile", path: "/me", component: MyProfile },
    { id: "userProfile", path: "/profile/:id", component: UserProfile},
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
        <div className="app-root">
            <MenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

            <div className="app-body">
                <ContextMenu
                    PAGES={PAGES}
                    ROUTES_PAGES = {ROUTES_PAGES}
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

function App() {
    const [session, setSession] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const handleAuth = () =>
        axios.get(`/api/users/me`)
            .then(res => {
                setSession(res.data)
                console.log(res.data)
                setCurrentTrack(res.data.currentTrack)
            })
            .catch(() => setSession(null))
            .finally(() => setLoading(false));

    const handleLogout = () => {
        axios.post('/api/users/logout')
            .then(() => {
                setSession(null)
                setCurrentTrack(null);
            });
    };

    useEffect(() => {
        handleAuth()
    }, []);

    if (loading) return <LoadingPage/>;

    if (!session)
        return <AppProvider session={session}>;
                <AuthPage onAuth={handleAuth} setSession={setSession} />
            </AppProvider>


    return (
        <BrowserRouter>
            <AppProvider session={session} setSession={setSession}>
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