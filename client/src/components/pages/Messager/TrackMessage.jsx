import React from "react";
import { Play, Pause } from "lucide-react";
import { Player } from "../../../classes/Player.ts";
import usePlayerState from "../../../hooks/usePlayerState";

const TrackMessage = ({ track, onOpenAlbum }) => {
    const player = React.useRef(Player.getInstance()).current;
    const isPlaying = usePlayerState(player, [track]);

    const handlePlay = (e) => {
        e.stopPropagation();
        const isSameTrack = player.track?.id === track.id;
        if (isSameTrack) {
            player.isPlaying() ? player.pause() : player.play();
        } else {
            player.setTrack(track, [track]);
        }
    };

    return (
        <div className="track-message" onClick={() => onOpenAlbum(track.mainAlbId)}>
            <img className="track-message__img" src={track.img} alt={track.name} />
            <div className="track-message__info">
                <span className="track-message__name">{track.name}</span>
                <span className="track-message__artist">{track.creator}</span>
            </div>
            <button className="track-message__play" onClick={handlePlay}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
        </div>
    );
};

export default TrackMessage;