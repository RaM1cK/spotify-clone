import io from 'socket.io-client';
import React, {useEffect, useState} from "react";
import Player from "./components/UI/Player/Player";
import {Button, Nav, NavLink} from "react-bootstrap";
import {CircleUserRound, ListMusic, MessageCircleMore} from 'lucide-react'
import axios from "axios";
import "./App.css";
import TrackList from "./components/UI/TrackList/TrackList";
import AuthPage, { getSession, clearSession } from "./AuthPage";
import MainPage from "./components/MainPage";

const IP_APP = process.env.REACT_APP_IP_APP
const SERVER_PORT = process.env.REACT_APP_SERVER_PORT

function App() {
    const [session, setSession] = useState(() => getSession());

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

    return <MainPage user={session} onLogout={handleLogout} />;
}

export default App;
