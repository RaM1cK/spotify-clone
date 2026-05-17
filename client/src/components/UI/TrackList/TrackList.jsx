import React, {useEffect, useState} from "react"
import TrackItem from "../Track/TrackItem";
import "./TrackList.css"
import {useParams} from "react-router-dom";
import axios from "axios";
import {ChevronLeft} from "lucide-react";
import {LoadingPage} from "../../pages/LoadingPage";

function TrackList({tracks: propTracks, setCurrentTrack, UsingContext, RollBack, onFavoriteChange}) {
    const { artistId} = useParams();
    const [localTracks, setLocalTracks] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!propTracks)
            axios.get(`/api/artists/${artistId}/tracks`)
                .then(res => setLocalTracks(res.data))
                .catch(() => setError('Ошибка загрузки треков'))
                .finally(() => setLoading(false));
        else
            setLoading(false);
    }, []);

    const tracks = propTracks ?? localTracks;

    if (loading) return <LoadingPage/>
    if (error) return <div>{error}</div>

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