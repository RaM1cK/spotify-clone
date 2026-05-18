import React, {useState, useEffect, useRef} from "react";
import {X, ChevronLeft, ChevronRight, Heart, LayoutList, CircleUserRound, Disc3, ListMusic} from "lucide-react";
import axios from "axios";
import SearchBar from "../../SearchBar";
import "../MusicPages/ArtistItem.css";
import "./TrackPickerModal.css";

const COLLECTION_TABS = [
    {id: "liked", label: "Избранное", sub: "Вам понравилось", Icon: Heart, color: "info"},
    {id: "playlists", label: "Плейлисты", sub: "Ваши подборки", Icon: LayoutList, color: "success"},
    {id: "artists", label: "Исполнители", sub: "По артистам", Icon: CircleUserRound, color: "warning"},
    {id: "albums", label: "Альбомы", sub: "Дискография", Icon: Disc3, color: "danger"},
];

const TITLE_MAP = {
    liked: "Избранное",
    playlists: "Плейлисты",
    artists: "Исполнители",
    albums: "Альбомы",
};

const TrackPickerModal = ({onClose, onSend}) => {
    const [activeTab, setActiveTab] = useState("collection");
    const [collectionView, setCollectionView] = useState(null);
    const [subView, setSubView] = useState(null);
    const [parentSubView, setParentSubView] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const overlayRef = useRef(null);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        if (!collectionView) {
            setData(null);
            setSubView(null);
            setParentSubView(null);
            return;
        }

        setLoading(true);
        setSubView(null);
        setParentSubView(null);

        let url;
        switch (collectionView) {
            case "liked":
                url = '/api/users/me/favoriteTracks';
                break;
            case "playlists":
                url = '/api/users/me/favoritePlaylists';
                break;
            case "artists":
                url = '/api/users/me/favoriteArtists';
                break;
            case "albums":
                url = '/api/users/me/favoriteReleases';
                break;
            default:
                return;
        }

        axios.get(url)
            .then(res => setData(res.data))
            .catch(() => setData([]))
            .finally(() => setLoading(false));
    }, [collectionView]);

    const showTracks = (items, parentLabel) => {
        setSubView({type: "tracks", data: items, title: parentLabel});
    };

    const handleSelectTrack = (track) => {
        onSend?.({type: "track", data: track});
        onClose();
    };

    const handleSelectArtist = (artist) => {
        onSend?.({type: "artist", data: artist});
        onClose();
    };

    const handleSelectAlbum = (album) => {
        onSend?.({type: "album", data: album});
        onClose();
    };

    const handleSelectPlaylist = (playlist) => {
        onSend?.({type: "playlist", data: playlist});
        onClose();
    };

    const handleSelectPlaylistDetail = (playlist) => {
        setLoading(true);
        axios.get(`/api/playlists/${playlist.id}`)
            .then(r => showTracks(r.data.tracks, r.data.name))
            .catch(() => setSubView({type: "empty"}))
            .finally(() => setLoading(false));
    };

    const handleSelectAlbumDetail = (album) => {
        setLoading(true);
        axios.get(`/api/releases/${album.id}`)
            .then(r => showTracks(r.data.tracks, r.data.title))
            .catch(() => setSubView({type: "empty"}))
            .finally(() => setLoading(false));
    };

    const goBackFromSubView = () => {
        if (parentSubView) {
            setSubView(parentSubView);
            setParentSubView(null);
        } else {
            setSubView(null);
        }
    };

    const goBack = () => {
        if (parentSubView) {
            setSubView(parentSubView);
            setParentSubView(null);
        } else if (subView) {
            setSubView(null);
        } else if (collectionView) {
            setCollectionView(null);
        }
    };

    const renderTiles = () => (
        <div className="tpm-tiles">
            {COLLECTION_TABS.map(({id, label, sub, Icon, color}) => (
                <button
                    key={id}
                    className={`tpm-tile tpm-tile--${color}`}
                    onClick={() => setCollectionView(id)}
                >
                    <div className={`tpm-tile__icon tpm-tile__icon--${color}`}>
                        <Icon size={22}/>
                    </div>
                    <span className="tpm-tile__label">{label}</span>
                    <span className="tpm-tile__sub">{sub}</span>
                </button>
            ))}
        </div>
    );

    const renderTrackRow = (track) => (
        <div key={track.id} className="tpm-track-row" onClick={() => handleSelectTrack(track)}>
            <div className="tpm-track-row__info">
                <img src={`/api/files/${track.cover}`} alt="" className="tpm-track-row__cover"/>
                <div className="tpm-track-row__text">
                    <span className="tpm-track-row__title">{track.title}</span>
                    <span className="tpm-track-row__artist">{track.artist}</span>
                </div>
            </div>
        </div>
    );

    const handleSelectArtistDetail = (artist) => {
        setLoading(true);
        axios.get(`/api/artists/${artist.id}`)
            .then(r => setSubView({type: "artist", data: r.data, title: r.data.name}))
            .catch(() => setSubView({type: "empty"}))
            .finally(() => setLoading(false));
    };

    const renderArtists = () => (
        <div className="tpm-scroll-container">
            {data.map(artist => (
                <div key={artist.id} className="tpm-card-item" onClick={() => handleSelectArtist(artist)}>
                    {artist.avatar
                        ? <img src={`/api/files/${artist.avatar}`} alt=""
                               className="tpm-card-item__image tpm-card-item__image--rounded"/>
                        : <CircleUserRound size={48} color="#b4b2a9"
                                           className="tpm-card-item__image tpm-card-item__image--rounded"/>
                    }
                    <span className="tpm-card-item__label">{artist.name}</span>
                    <span className="tpm-card-item__sub">{artist.trackCount} треков</span>
                    <button className="tpm-card-send"
                            style={{position: 'static', opacity: 1, background: 'rgba(255,255,255,0.1)'}}
                            onClick={(e) => { e.stopPropagation(); handleSelectArtistDetail(artist); }}
                            title="Открыть">
                        <ChevronLeft size={14} style={{transform: 'rotate(180deg)'}}/>
                    </button>
                </div>
            ))}
        </div>
    );

    const renderAlbums = () => (
        <div className="tpm-scroll-container">
            {data.map(album => (
                <div key={album.id} className="tpm-card-item" onClick={() => handleSelectAlbum(album)}>
                    <div className="tpm-card-item__image tpm-card-item__image--square"
                         style={{background: 'transparent'}}>
                        <img src={`/api/files/${album.cover}`} alt={album.title}
                             style={{width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover'}}/>
                    </div>
                    <span className="tpm-card-item__label">{album.title}</span>
                    {album.artist && <span className="tpm-card-item__sub">{album.artist}</span>}
                    <button className="tpm-card-send"
                            style={{position: 'static', opacity: 1, background: 'rgba(255,255,255,0.1)'}}
                            onClick={(e) => { e.stopPropagation(); handleSelectAlbumDetail(album); }}
                            title="Открыть">
                        <ChevronLeft size={14} style={{transform: 'rotate(180deg)'}}/>
                    </button>
                </div>
            ))}
        </div>
    );

    const renderPlaylists = () => (
        <div className="tpm-scroll-container">
            {data.map(playlist => (
                <div key={playlist.id} className="tpm-card-item" onClick={() => handleSelectPlaylist(playlist)}>
                    <div className="tpm-card-item__image tpm-card-item__image--square"
                         style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        {playlist.cover
                            ? <img src={`/api/files/${playlist.cover}`} alt=""
                                   style={{width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover'}}/>
                            : <ListMusic size={48} color="#b4b2a9"/>
                        }
                    </div>
                    <span className="tpm-card-item__label">{playlist.name}</span>
                    <span className="tpm-card-item__sub">{playlist.trackCount} треков</span>
                    <button className="tpm-card-send"
                            style={{position: 'static', opacity: 1, background: 'rgba(255,255,255,0.1)'}}
                            onClick={(e) => { e.stopPropagation(); handleSelectPlaylistDetail(playlist); }}
                            title="Открыть">
                        <ChevronLeft size={14} style={{transform: 'rotate(180deg)'}}/>
                    </button>
                </div>
            ))}
        </div>
    );

    const declensionArtist = (n) => {
        if (n % 10 === 1 && n % 100 !== 11) return "трек";
        if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "трека";
        return "треков";
    };

    const handleViewAllAlbums = (artist) => {
        setParentSubView(subView);
        setLoading(true);
        axios.get(`/api/artists/${artist.id}/releases`)
            .then(r => setSubView({type: "artistAlbums", data: r.data, title: artist.name}))
            .catch(() => setSubView({type: "empty"}))
            .finally(() => setLoading(false));
    };

    const handleViewAllTracks = (artist) => {
        setParentSubView(subView);
        setLoading(true);
        axios.get(`/api/artists/${artist.id}/tracks`)
            .then(r => setSubView({type: "artistTracks", data: r.data, title: artist.name}))
            .catch(() => setSubView({type: "empty"}))
            .finally(() => setLoading(false));
    };

    const renderAllAlbums = (albums) => (
        <div className="tpm-scroll-container">
            {albums.map(album => (
                <div key={album.id} className="tpm-card-item" onClick={() => handleSelectAlbum(album)}>
                    <div className="tpm-card-item__image tpm-card-item__image--square"
                         style={{background: 'transparent'}}>
                        <img src={`/api/files/${album.cover}`} alt={album.title}
                             style={{width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover'}}/>
                    </div>
                    <span className="tpm-card-item__label">{album.title}</span>
                    {album.artist && <span className="tpm-card-item__sub">{album.artist}</span>}
                    <button className="tpm-card-send"
                            style={{position: 'static', opacity: 1, background: 'rgba(255,255,255,0.1)'}}
                            onClick={(e) => { e.stopPropagation(); handleSelectAlbumDetail(album); }}
                            title="Открыть">
                        <ChevronLeft size={14} style={{transform: 'rotate(180deg)'}}/>
                    </button>
                </div>
            ))}
        </div>
    );

    const renderArtistDetail = (artist) => (
        <div className="artist-item">
            <div className="artist-header">
                <div className="artist-header__image">
                    {artist.avatar
                        ? <img src={`/api/files/${artist.avatar}`} alt={artist.name} />
                        : <CircleUserRound size={64} color="#b4b2a9" />
                    }
                </div>
                <div className="artist-header__info">
                    <h1 className="artist-header__name">{artist.name}</h1>
                    <div className="artist-header__bottom">
                        <div className="artist-header__meta">
                            <span className="artist-header__type">Артист</span>
                            <span className="artist-header__count">
                                {artist.trackCount} {declensionArtist(artist.trackCount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {artist.releases?.length > 0 && (
                <div className="artist-albums-section">
                    <button
                        className="artist-albums-header"
                        onClick={() => handleViewAllAlbums(artist)}
                    >
                        <span>Альбомы</span>
                        <ChevronRight size={18} color="#a3a3a3" />
                    </button>
                    <div className="tpm-scroll-container">
                        {artist.releases.map(album => (
                            <div key={album.id} className="tpm-card-item" onClick={() => handleSelectAlbum(album)}>
                                <div className="tpm-card-item__image tpm-card-item__image--square"
                                     style={{background: 'transparent'}}>
                                    <img src={`/api/files/${album.cover}`} alt={album.title}
                                         style={{width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover'}}/>
                                </div>
                                <span className="tpm-card-item__label">{album.title}</span>
                                {album.artist && <span className="tpm-card-item__sub">{album.artist}</span>}
                                <button className="tpm-card-send"
                                        style={{position: 'static', opacity: 1, background: 'rgba(255,255,255,0.1)'}}
                                        onClick={(e) => { e.stopPropagation(); setParentSubView(subView); handleSelectAlbumDetail(album); }}
                                        title="Открыть">
                                    <ChevronLeft size={14} style={{transform: 'rotate(180deg)'}}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {artist.tracks?.length > 0 && (
                <div className="artist-albums-section">
                    <button
                        className="artist-albums-header"
                        onClick={() => handleViewAllTracks(artist)}
                    >
                        <span>Треки</span>
                        <ChevronRight size={18} color="#a3a3a3" />
                    </button>
                    {artist.tracks.map(track => renderTrackRow(track))}
                </div>
            )}
        </div>
    );

    const renderCollectionContent = () => {
        if (subView?.type === "tracks") {
            return (
                <>
                    {subView.data.length === 0 ? (
                        <div className="tpm-empty">Нет треков</div>
                    ) : (
                        subView.data.map(renderTrackRow)
                    )}
                </>
            );
        }

        if (subView?.type === "artist") {
            return renderArtistDetail(subView.data);
        }

        if (subView?.type === "artistAlbums") {
            return renderAllAlbums(subView.data);
        }

        if (subView?.type === "artistTracks") {
            return (
                <>
                    {subView.data.length === 0 ? (
                        <div className="tpm-empty">Нет треков</div>
                    ) : (
                        subView.data.map(renderTrackRow)
                    )}
                </>
            );
        }

        if (loading) return <div className="tpm-loading">Загрузка...</div>;
        if (!data) return null;

        if (data.length === 0) return <div className="tpm-empty">Нет элементов</div>;

        switch (collectionView) {
            case "liked":
                return data.map(renderTrackRow);
            case "artists":
                return renderArtists();
            case "albums":
                return renderAlbums();
            case "playlists":
                return renderPlaylists();
            default:
                return null;
        }
    };

    const SearchSection = () => {
        const [searchTerm, setSearchTerm] = useState("");
        const [isLoading, setIsLoading] = useState(false);
        const [searchArtists, setSearchArtists] = useState([]);
        const [searchTracks, setSearchTracks] = useState([]);
        const [searchAlbums, setSearchAlbums] = useState([]);

        const setData = (data) => {
            setSearchArtists(data.artists || []);
            setSearchTracks(data.tracks || []);
            setSearchAlbums(data.releases || []);
        };

        const hasResults = searchArtists.length > 0 || searchTracks.length > 0 || searchAlbums.length > 0;

        return (
            <div className="tpm-search-content">
                {subView?.type === "tracks" ? (
                    <>
                        <div className="tpm-sub-header">
                            <button className="tpm-back-btn" onClick={goBackFromSubView}>
                                <ChevronLeft size={18}/>
                            </button>
                            <span className="tpm-sub-header__title">{subView.title}</span>
                        </div>
                        {loading ? (
                            <div className="tpm-loading">Загрузка...</div>
                        ) : (
                            subView.data.map(renderTrackRow)
                        )}
                    </>
                ) : subView?.type === "artist" ? (
                    <>
                        <div className="tpm-sub-header">
                            <button className="tpm-back-btn" onClick={goBackFromSubView}>
                                <ChevronLeft size={18}/>
                            </button>
                            <span className="tpm-sub-header__title">{subView.title}</span>
                        </div>
                        {renderArtistDetail(subView.data)}
                    </>
                ) : subView?.type === "artistAlbums" ? (
                    <>
                        <div className="tpm-sub-header">
                            <button className="tpm-back-btn" onClick={goBackFromSubView}>
                                <ChevronLeft size={18}/>
                            </button>
                            <span className="tpm-sub-header__title">{subView.title}</span>
                        </div>
                        {renderAllAlbums(subView.data)}
                    </>
                ) : subView?.type === "artistTracks" ? (
                    <>
                        <div className="tpm-sub-header">
                            <button className="tpm-back-btn" onClick={goBackFromSubView}>
                                <ChevronLeft size={18}/>
                            </button>
                            <span className="tpm-sub-header__title">{subView.title}</span>
                        </div>
                        {subView.data.length === 0 ? (
                            <div className="tpm-empty">Нет треков</div>
                        ) : (
                            subView.data.map(renderTrackRow)
                        )}
                    </>
                ) : (
                    <SearchBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        setData={setData}
                    />
                )}

                {!subView && hasResults ? (
                    <>
                        {searchArtists.length > 0 && (
                            <div className="tpm-section">
                                <h3 className="tpm-section__title">Артисты</h3>
                                <div className="tpm-scroll-container">
                                    {searchArtists.map(artist => (
                                        <div key={artist.id} className="tpm-card-item"
                                                onClick={() => handleSelectArtist(artist)}>
                                            {artist.avatar
                                                ? <img src={`/api/files/${artist.avatar}`} alt=""
                                                       className="tpm-card-item__image tpm-card-item__image--rounded"/>
                                                : <CircleUserRound size={48} color="#b4b2a9"
                                                                   className="tpm-card-item__image tpm-card-item__image--rounded"/>
                                            }
                                            <span className="tpm-card-item__label">{artist.name}</span>
                                            <span className="tpm-card-item__sub">{artist.trackCount} треков</span>
                                            <button className="tpm-card-send"
                                                    style={{position: 'static', opacity: 1, background: 'rgba(255,255,255,0.1)'}}
                                                    onClick={(e) => { e.stopPropagation(); handleSelectArtistDetail(artist); }}
                                                    title="Открыть">
                                                <ChevronLeft size={14} style={{transform: 'rotate(180deg)'}}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {searchTracks.length > 0 && (
                            <div className="tpm-section">
                                <h3 className="tpm-section__title">Треки</h3>
                                {searchTracks.map(renderTrackRow)}
                            </div>
                        )}

                        {searchAlbums.length > 0 && (
                            <div className="tpm-section">
                                <h3 className="tpm-section__title">Альбомы</h3>
                                <div className="tpm-scroll-container">
                                    {searchAlbums.map(album => (
                                        <div key={album.id} className="tpm-card-item"
                                             onClick={() => handleSelectAlbum(album)}>
                                            <div className="tpm-card-item__image tpm-card-item__image--square"
                                                 style={{background: 'transparent'}}>
                                                <img src={`/api/files/${album.cover}`} alt={album.title} style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: '4px',
                                                    objectFit: 'cover'
                                                }}/>
                                            </div>
                                            <span className="tpm-card-item__label">{album.title}</span>
                                            {album.artist && <span className="tpm-card-item__sub">{album.artist}</span>}
                                            <button className="tpm-card-send" style={{
                                                position: 'static',
                                                opacity: 1,
                                                background: 'rgba(255,255,255,0.1)'
                                            }} onClick={(e) => { e.stopPropagation(); handleSelectAlbumDetail(album); }} title="Открыть">
                                                <ChevronLeft size={14} style={{transform: 'rotate(180deg)'}}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : searchTerm && !isLoading ? (
                    <div className="tpm-empty">Ничего не найдено</div>
                ) : null}
            </div>
        );
    };

    return (
        <div className="tpm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
            <div className="tpm-card">
                <div className="tpm-header">
                    <button className="tpm-close-btn" onClick={onClose}>
                        <X size={18}/>
                    </button>
                </div>

                <div className="tpm-tabs">
                    <button
                        className={`tpm-tab ${activeTab === "collection" ? "tpm-tab--active" : ""}`}
                        onClick={() => {
                            setActiveTab("collection");
                            setCollectionView(null);
                        }}
                    >
                        Коллекция
                    </button>
                    <button
                        className={`tpm-tab ${activeTab === "search" ? "tpm-tab--active" : ""}`}
                        onClick={() => {
                            setActiveTab("search");
                            setCollectionView(null);
                        }}
                    >
                        Поиск
                    </button>
                </div>

                <div className="tpm-content">
                    {activeTab === "collection" && (
                        <>
                            {collectionView && (
                                <div className="tpm-collection-header">
                                    <button className="tpm-back-btn" onClick={goBack}>
                                        <ChevronLeft size={18}/>
                                    </button>
                                    <span className="tpm-collection-title">
                    {subView?.title || TITLE_MAP[collectionView]}
                  </span>
                                </div>
                            )}
                            {collectionView ? renderCollectionContent() : renderTiles()}
                        </>
                    )}
                    {activeTab === "search" && <SearchSection/>}
                </div>
            </div>
        </div>
    );
};

export default TrackPickerModal;
