import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../App.css";
import TrackList from "../UI/TrackList/TrackList";
import SearchBar from "../SearchBar";
import { filterTracksBySearchTerm } from "../../../../searchUtils";

const MainPage = ({setCurrentTrack}) => {
    const music = [
        "morgenshtern-cvetok-(allmusic.kz).mp3",
        "Jane_Remover_-_Dancing_with_your_eyes_closed_80039450.mp3",
        "morgenshtern-уфф-деньги.mp3",
        "MORGENSHTERN_-_Novyjj_merin_66404393.mp3"
    ]

    const [trackList, setTrackList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const getTrack = async (trackId) => {
        try {
            const res =  await axios.post(`/api/tracks/getTrack/${trackId}`)

            return res.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // console.log(Intl.DateTimeFormat().resolvedOptions().timeZone)

    useEffect(() => {
        (async () => {
            const tracks = await Promise.all(music.map(async name => {
                return await getTrack(name);
            }));
            setTrackList(tracks.filter(track => track !== null));
        })();
    }, []);

    const filteredTracks = filterTracksBySearchTerm(trackList, searchTerm);

    return (
        <>
            <div
                className="d-flex flex-row"
                style={{
                    height: '100%'
                }}
            >
                <div
                    className="d-flex flex-column"
                    style={{
                        width: "100%",
                        height: '100%',
                    }}
                >
                    <SearchBar onSearch={setSearchTerm} />
                    <TrackList tracks={filteredTracks} setCurrentTrack = {setCurrentTrack} />
                </div>
            </div>
        </>
    );
};

export default MainPage;