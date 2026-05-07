import React, {useEffect, useState} from "react"
import TrackItem from "../Track/TrackItem";
import "./TrackList.css"
import {useParams} from "react-router-dom";
import axios from "axios";
import {ChevronLeft} from "lucide-react";

function TrackList({tracks: propTracks, setCurrentTrack, UsingContext, RollBack, onFavoriteChange}) {
    const { artistId} = useParams();
    const [localTracks, setLocalTracks] = useState(null);

    useEffect(() => {
        if (!propTracks)
            axios.get(`/api/artists/${artistId}/tracks`)
                .then(res => setLocalTracks(res.data))
                .catch(() => console.error('Ошибка загрузки треков'));
    }, []);

    const tracks = localTracks ?? propTracks

    if (tracks)
        return (
            <div className="track-list">
                {RollBack && (
                    <button className="music-back" onClick={RollBack}><ChevronLeft size={20} /></button>
                )}
                {UsingContext != null && (
                    <h1 style={{color: '#fff'}}>Все треки: {UsingContext}</h1>
                )}
                <div className="tracks">
                    {tracks.map((track, index) => (
                        <TrackItem
                            number={index+1}
                            key={track.id}
                            index={index}
                            track={track}
                            tracks={tracks}
                            setCurrentTrack = {setCurrentTrack}
                            onFavoriteChange = {onFavoriteChange}
                        />
                    ))}
                </div>
            </div>
        );
}

export default TrackList;