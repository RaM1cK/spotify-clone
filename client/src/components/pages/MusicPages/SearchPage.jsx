import React, {useState} from "react";
import {Search} from "lucide-react";
import SearchBar from "../../SearchBar";
import TrackItem from "../../UI/Track/TrackItem";
import { AlbumList } from "./AlbumMenu";
import { ArtistList } from "./ArtistMenu";
import "./ArtistMenu.css";
import "./AlbumMenu.css";
import "./PlaylistMenu.css";
import "./SearchPage.css";

let searchCache = null;

const SearchPage = ({ setCurrentTrack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [artists, setArtists] = useState(searchCache?.artists || []);
    const [tracks, setTracks] = useState(searchCache?.tracks || []);
    const [albums, setAlbums] = useState(searchCache?.albums || []);

    const setData = (data) => {
        searchCache = {
            artists: data.artists,
            tracks: data.tracks,
            albums: data.releases,
        };
        setArtists(data.artists)
        setTracks(data.tracks);
        setAlbums(data.releases);
    }

    const hasSearched = searchCache !== null;

    return (
        <div className="search-page">
            <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                setData={setData}
            />

            {(artists.length > 0 || tracks.length > 0 || albums.length > 0) ? <div className="search-results">
                {artists.length > 0 && <section className="search-section">
                    <h2 className="search-section__title">Артисты</h2>
                    <ArtistList artists={artists} scrollable />
                </section>}

                {tracks.length > 0 && <section className="search-section">
                    <h2 className="search-section__title">Треки</h2>
                    <div className="track-list" style={{ padding: 0 }}>
                        <div className="tracks">
                            {tracks.map((track, index) => (
                                <TrackItem
                                    key={track.id}
                                    number={index + 1}
                                    track={track}
                                    tracks={tracks}
                                    setCurrentTrack={setCurrentTrack}
                                />
                            ))}
                        </div>
                    </div>
                </section>}

                {albums.length > 0 && <section className="search-section">
                    <h2 className="search-section__title">Альбомы</h2>
                    <AlbumList albums={albums} showArtist scrollable />
                </section>}
            </div>
            : <div className="search-empty">
                <div className="search-empty__orbit">
                    <div className="search-empty__ring" />
                    <Search className="search-empty__icon" size={40} />
                </div>
                {hasSearched
                    ? <>
                        <h3 className="search-empty__title">Ничего не найдено</h3>
                        <p className="search-empty__hint">Попробуй изменить запрос<br/>или поискать что-то другое</p>
                    </>
                    : <>
                        <h3 className="search-empty__title">Начните поиск</h3>
                        <p className="search-empty__hint">Введите название трека,<br/>альбома или артиста</p>
                    </>
                }
            </div>
            }
        </div>
    );
};

export default SearchPage;
