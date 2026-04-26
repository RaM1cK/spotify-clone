import React, {useState} from "react";
import { CircleUserRound } from "lucide-react";
import "./ArtistMenu.css";
import ArtistItem from "./ArtistItem";

const declension = (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return "трек";
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "трека";
    return "треков";
};

const ArtistMenu = ({ artists, albums, tracks, onSelectArtist, setCurrentTrack, RollBack }) => {
    const getCount = (artistId) =>
        tracks.filter(t => t.artistId === artistId).length;

    const [activeArtist, setActiveArtist] = useState(null);

    const handleSetArtist = (artist) => {
        setActiveArtist(artist);
    };

    if (activeArtist) {
        return (
            <ArtistItem
                artist={activeArtist}
                tracks={tracks.filter(t => t.artistId === activeArtist.id)}
                albums={albums}
                setCurrentTrack={setCurrentTrack}
                RollBack={() => setActiveArtist(null)}
            />
        );
    }

    return (
        <div className="playlist-home">
            <button className="music-back" onClick={() => RollBack(null)}>
                ← Назад
            </button>
            <div className="playlist-grid">
                {artists.map((artist) => (
                    <button
                        key={artist.id}
                        onClick={() => handleSetArtist(artist)}
                    >
                        <div className="artist-avatar">
                            {artist.photo
                                ? <img src={artist.photo} alt={artist.name} />
                                : <CircleUserRound size={64} color="#b4b2a9" />
                            }
                        </div>
                        <span className="music-tile__label">{artist.name}</span>
                        <span className="playlist-track-count">
                            {getCount(artist.id)} {declension(getCount(artist.id))}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ArtistMenu;