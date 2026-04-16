import io from 'socket.io-client';
import React, {useEffect, useState} from "react";
import Player from "./components/UI/Player/Player";
import {Button, Nav, NavLink} from "react-bootstrap";
import {CircleUserRound, ListMusic, MessageCircleMore} from 'lucide-react'
import axios from "axios";
import "./App.css";
import TrackList from "./components/UI/TrackList/TrackList";
import AuthPage, { getSession, clearSession } from "./AuthPage";
import MainPage from "./components/pages/MainPage";
import ContextMenu from "./components/ContextMenu";
import testpage from "./components/pages/testpage";
import MenuButton from "./components/MenuButton";

// const socket = io("http://localhost:8080");

const IP_APP = process.env.REACT_APP_IP_APP
const SERVER_PORT = process.env.REACT_APP_SERVER_PORT

//Страницы, которые будут посередине
const PAGES = [
    {id: "testTrack", component: MainPage, label: "Test Track"},
    {id: "testPage", component: testpage, label: "Test Page"},
]


function App() {
    const [session, setSession] = useState(() => getSession());
    const [activePage, setActivePage] = useState("testTrack");

    const [currentTrack, setCurrentTrack] = useState(null);

    const [menuOpen, setMenuOpen] = useState(false);

    //Строчка ниже очищает локальную сессию - если удалишь, при обновлении страницы форма бл
    // clearSession();

    const handleAuth = (newSession) => {
        setSession(newSession);
    };

    const handleLogout = () => {
        clearSession();
        setSession(null);
    };

    if (!session) {
        return <AuthPage onAuth={handleAuth} />;
    }

    //Функция ищет активную страницу в массиве страниц и возвращает ее
    const { component: PageComponent } = PAGES.find(p => p.id === activePage);
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            <MenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
            <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
                <ContextMenu PAGES={PAGES} activePage={activePage} setActivePage={setActivePage} menuOpen={menuOpen} setMenuOpen={setMenuOpen}/>
                <main style={{ flex: 1, overflowY: "auto" }}>
                    <PageComponent setCurrentTrack={setCurrentTrack} />
                </main>
            </div>
            <Player
                track={currentTrack}
                setTrack={setCurrentTrack}
            />
        </div>
    )

}

export default App;
