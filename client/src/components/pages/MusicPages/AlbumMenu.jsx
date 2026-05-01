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
    const [albumsData, setAlbumsData] = useState([]);

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

    // const getTrack = async (trackId) => {
    //     try {
    //         const res =  await axios.post(`/api/tracks/getTrack/${trackId}`)
    //
    //         return res.data;
    //     } catch (error) {
    //         console.error(error);
    //         return null;
    //     }
    // }

    useEffect(() => {
        (async () => {
            const results = await Promise.all(
                albums.map(({ id }) =>
                    axios.post(`/api/releases/getRelease/${id}`)
                        .then(res => ({ id, ...res.data }))
                )
            )

            setAlbumsData(results);
        })();
    }, []);

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
                    {albumsData.map(data => (
                            <button
                                key={data.id}
                                onClick={() => handleSetPage({id: data.id})}
                            >
                                <div className="album-imagediv">
                                    <img src={`/api/releases/getCover/${data.id}`} alt={`${data.title}`} />
                                </div>
                                <span className="music-tile__label">{data.title}</span>
                                {UsingContext === "menu" && <span className="album-autor">{data.displayArtist}</span>}
                            </button>
                        )
                    )}
                </div>
            </div>
        );
    }

    else return (
        <PlaylistItem Tracks={activePage.tracks} title={activePage.title} type = {"Альбом"} image={`/api/releases/getCover/${activePage.id}`} setCurrentTrack={setCurrentTrack} AutName={activePage.sub}
                      // year={activePage.sub2}
                      RollBack = {handleSetPage}/>
    );
};

export default AlbumMenu;