import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import PlaylistItem from "./PlaylistItem";
import "./AlbumMenu.css"

const music = [
    "morgenshtern-cvetok-(allmusic.kz).mp3",
    "morgenshtern-уфф-деньги.mp3",
    "MORGENSHTERN_-_Novyjj_merin_66404393.mp3"
]

const getWordForm = (count) => {
    const lastTwo = count % 100;
    const last = count % 10;

    if (lastTwo >= 11 && lastTwo <= 14) {
        return "треков";
    }
    if (last === 1) {
        return "трек";
    }
    if (last >= 2 && last <= 4) {
        return "трека";
    }
    return "треков";
};


const AlbumMenu = ({setCurrentTrack, RollBack, albums, UsingContext}) => {

    const [activePageId, setActivePageId] = useState(() => localStorage.getItem("musicActivePage"));

    const activePage = activePageId ? albums.find(p => p.id === activePageId) || null : null;
    const handleSetPage = (page) => {
        if (page) {
            setActivePageId(page.id);
            localStorage.setItem("musicActivePage", page.id);
        } else {
            setActivePageId(null);
            localStorage.removeItem("musicActivePage");
        }
    };

    const getTrack = async (trackId) => {
        try {
            const res =  await axios.post(`/api/tracks/getTrack/${trackId}`)

            return res.data;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // useEffect(() => {
    //     (async () => {
    //         const tracks = await Promise.all(music.map(async name => {
    //             return await getTrack(name);
    //         }));
    //         const filtered = tracks.filter(track => track !== null);
    //         setTrackList(tracks.filter(track => track !== null));
    //     })();
    // }, []);

    if (!activePage) {
        return (
            <div className="playlist-home">

                <div className="menuHeader">
                    {UsingContext !== "menu" ?
                        <>
                            <button className="music-back" onClick={() => RollBack(null)}>
                                ← Назад
                            </button>
                            <h1>Все альбомы: {UsingContext}</h1>
                        </>
                        :
                        <button className="music-back" onClick={() => RollBack(null)}>
                            ← Назад
                        </button>
                    }
                </div>
                <div className="playlist-grid">
                    {albums.map(({ id, label, sub, sub2, img, tracks }) => (
                        <button
                            key={id}
                            onClick={() => handleSetPage({ id, label, sub, sub2, img, tracks })}
                        >
                            <div className="album-imagediv">
                                <img src={img} alt="" />
                            </div>
                            <span className="music-tile__label">{label}</span>
                            {UsingContext === "menu" && <span className="album-autor">{sub}</span>}
                            <span className="date-issingle">{sub2} {tracks.length === 1 ? " · сингл" : ""}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    else return (
        <PlaylistItem Tracks={activePage.tracks} title={activePage.label} type = {"Альбом"} image={activePage.img} setCurrentTrack={setCurrentTrack} AutName={activePage.sub} year={activePage.sub2} RollBack = {handleSetPage}/>
    );
};

export default AlbumMenu;