import React from "react"
import TrackItem from "../Track/TrackItem";
import "./TrackList.css"

function TrackList({tracks, setCurrentTrack, UsingContext, RollBack, onFavoriteChange}) {
    return (
        <div className="track-list">
            {RollBack && (
                <button className="music-back" onClick={RollBack}>← Назад</button>
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