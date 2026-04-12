import io from 'socket.io-client';
import React, {useEffect, useState} from "react";
import Player from "./UI/Player/Player";
import {Button, Nav, NavLink} from "react-bootstrap";
import {CircleUserRound, ListMusic, MessageCircleMore} from 'lucide-react'
import axios from "axios";
import "../App.css";
import TrackList from "./UI/TrackList/TrackList";

// const socket = io("http://localhost:8080");

const MainPage = () => {
    const music = [
        "morgenshtern-cvetok-(allmusic.kz).mp3",
        "Jane_Remover_-_Dancing_with_your_eyes_closed_80039450.mp3",
        "morgenshtern-уфф-деньги.mp3",
        "MORGENSHTERN_-_Novyjj_merin_66404393.mp3"
    ]

    const [trackList, setTrackList] = useState([]);

    const getTrack = async (trackId) => {
        try {
            const res =  await axios.post(`/api/tracks/getTrack/${trackId}`)

            return res.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)

    useEffect(() => {
        (async () => {
            const tracks = await Promise.all(music.map(async name => {
                return await getTrack(name);
            }));
            setTrackList(tracks.filter(track => track !== null));
        })();
    }, []);

    return (
        <>
            <div
                className="d-flex flex-row"
                style={{
                    minHeight: '100vh'
                }}
            >
                <Nav
                    className="d-flex flex-column justify-content-start"
                    style={{
                        position: "sticky",
                        top: '0',
                        height: '100%',
                    }}
                >
                    <NavLink>
                        <CircleUserRound />
                    </NavLink>
                    <NavLink>
                        <ListMusic />
                    </NavLink>
                    <NavLink>
                        <MessageCircleMore />
                    </NavLink>
                </Nav>

                <div
                    className="d-flex flex-column"
                    style={{
                        width: "100%",
                        height: '100%',
                    }}
                >
                    <TrackList tracks={trackList}/>
                </div>
            </div>
            <Player/>
        </>
    );
};

export default MainPage;