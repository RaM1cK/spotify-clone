import React from "react";
import {createPortal} from "react-dom";
import {User, Disc3, ListPlus, Share2} from "lucide-react";
import {useLocation, useNavigate} from "react-router-dom";

const TrackMenu = React.forwardRef(({ track, style, openUp, onClose }, ref) => {
    const navigate = useNavigate();
    const location = useLocation();

    return createPortal(
        <div ref={ref}
             className={`track-item__menu${openUp ? " track-item__menu--up" : ""}`}
             style={{ position: "fixed", ...style }}>
            <button className="track-item__menu-item"
                    // onClick={(e) => {
                    //     e.stopPropagation();
                    //     navigate(`/music/artists/${track.artistId}`);
                    //     onClose();
                    // }}
            >
                <User size={16}/> Перейти к исполнителю
            </button>
            <button className="track-item__menu-item"
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log(track);

                        const path = `/music/albums/${track.releaseId}`;
                        if (path !== location.pathname) navigate(path);
                        onClose();
                    }}>
                <Disc3 size={16}/> Перейти к альбому
            </button>
            <button className="track-item__menu-item"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}>
                <ListPlus size={16}/> Добавить в плейлист
            </button>
            <button className="track-item__menu-item"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}>
                <Share2 size={16}/> Поделиться
            </button>
        </div>,
        document.body
    );
});

TrackMenu.displayName = 'TrackMenu';

export default TrackMenu;
