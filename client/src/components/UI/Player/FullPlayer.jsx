import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, LoaderCircle, Volume2, MoreVertical, ListMusic } from 'lucide-react';
import { Player as pl } from '../../../classes/Player.ts';
import { PlayerUI } from '../../../classes/observers/PlayerUI.ts';
import RangeTrack from './rangeTrack';
import TrackMenu from '../Track/TrackMenu';
import {useFavoriteActions} from '../../../AppContext';
import './FullPlayer.css';

const FullPlayer = ({ track, onClose, volume, setVolume, loopState, setLoopState, isShuffle, setIsShuffle, isFavorite }) => {
    const player = useRef(pl.getInstance()).current;
    const intervalRef = useRef(null);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showVolume, setShowVolume] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUp: false });
    const [queueOpen, setQueueOpen] = useState(false);
    const queueRef = useRef(null);
    const { toggleFavoriteTrack } = useFavoriteActions();

    const chainLoopStates = {
        noneLoop: 'loopPlaylist',
        loopPlaylist: 'loopTrack',
        loopTrack: 'noneLoop',
    };

    useEffect(() => {
        const playerObserver = new PlayerUI(() => {
            setPlaying(player.isPlaying());
            setLoading(player.isLoading());
            setPosition(player.seek());
            if (player.track) {
                setDuration(player.track.duration);
            }
        });
        playerObserver.update();
        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
            clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            if (buttonRef.current && !buttonRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
            if (queueRef.current && !queueRef.current.contains(e.target)) {
                setQueueOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRepeat = () => {
        const tempState = chainLoopStates[loopState];
        setLoopState(tempState);
        player.setStrategy(tempState);
    };

    const toFavorite = () => {
        if (!track) return;
        if (player.track) {
            player.track.hasInFavorite = !isFavorite;
            player.notify();
        }
        toggleFavoriteTrack(track);
    };

    const playQueueTrack = (t) => {
        player.setTrack(t, player.queue);
    };

    const toggleMenu = (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        setMenuOpen((prev) => {
            if (!prev) {
                const rect = btn.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 200, openUp: false });
            }
            return !prev;
        });
    };

    useEffect(() => {
        if (!menuOpen || !menuRef.current || !buttonRef.current) return;
        const btn = buttonRef.current;
        const menu = menuRef.current;
        const actualHeight = menu.offsetHeight;
        const rect = btn.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < actualHeight;

        let top = openUp ? rect.top - actualHeight - 4 : rect.bottom + 4;
        let left = rect.right - 200;
        left = Math.max(4, Math.min(left, window.innerWidth - 200 - 4));
        if (openUp) {
            top = Math.max(4, top);
        } else {
            top = Math.min(top, window.innerHeight - actualHeight - 4);
        }

        setMenuPos({ top, left, openUp });
    }, [menuOpen]);

    const formatTime = (seconds) => {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return createPortal(
        <div className="fullplayer-overlay" onClick={onClose}>
            <div className="fullplayer" onClick={(e) => e.stopPropagation()}>
                <button className="fullplayer__close" onClick={onClose}>
                    <X size={28} />
                </button>

                <div className="fullplayer__cover-wrapper">
                    <img
                        src={`/api/files/${track?.cover}`}
                        alt={track?.title}
                        className="fullplayer__cover"
                    />
                </div>

                <div className="fullplayer__info">
                    <span className="fullplayer__title">{track?.title}</span>
                    <span className="fullplayer__artist">{track?.artist}</span>
                </div>

                <div className="fullplayer__seek">
                    <RangeTrack
                        duration={duration}
                        playing={playing}
                        position={position}
                        setPosition={setPosition}
                        intervalRef={intervalRef}
                    />
                    <div className="fullplayer__times">
                        <span>{formatTime(position)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="fullplayer__controls">
                    <button className="fullplayer__btn" onClick={() => player.previous()}>
                        <SkipBack size={28} />
                    </button>
                    <button
                        className="fullplayer__btn fullplayer__btn--play"
                        disabled={loading}
                        onClick={() => (player.isPlaying() ? player.pause() : player.play())}
                    >
                        {loading ? (
                            <LoaderCircle className="spin-player" size={32} />
                        ) : playing ? (
                            <Pause size={32} />
                        ) : (
                            <Play size={32} />
                        )}
                    </button>
                    <button className="fullplayer__btn" onClick={() => player.next()}>
                        <SkipForward size={28} />
                    </button>
                </div>

                <div className="fullplayer__extras">
                    <button
                        className="fullplayer__btn"
                        onClick={() => {
                            player.setStrategy(isShuffle ? 'simple' : 'shuffle');
                            setIsShuffle(!isShuffle);
                        }}
                    >
                        <Shuffle size={22} color={isShuffle ? '#a855f7' : 'white'} />
                    </button>
                    <button className="fullplayer__btn" onClick={handleRepeat}>
                        {loopState === 'loopTrack' ? (
                            <Repeat1 size={22} color="#a855f7" />
                        ) : (
                            <Repeat size={22} color={loopState === 'loopPlaylist' ? '#a855f7' : 'white'} />
                        )}
                    </button>

                    <div className="fullplayer__volume">
                        <button className="fullplayer__btn" onClick={() => setShowVolume(!showVolume)}>
                            <Volume2 size={22} />
                        </button>
                        {showVolume && (
                            <input
                                type="range"
                                className="fullplayer__volume-slider"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onInput={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setVolume(v);
                                    player.setVolume(v);
                                }}
                                style={{
                                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${volume * 100}%, #555 ${volume * 100}%, #555 100%)`,
                                }}
                            />
                        )}
                    </div>

                    <button className="fullplayer__btn" onClick={() => setQueueOpen(true)}>
                        <ListMusic size={22} />
                    </button>

                    <button className="fullplayer__btn" onClick={toFavorite}>
                        <Heart size={22} fill={isFavorite ? 'white' : 'none'} />
                    </button>
                    <button ref={buttonRef} className="fullplayer__btn" onClick={toggleMenu}>
                        <MoreVertical size={22} />
                    </button>
                    {menuOpen && (
                        <TrackMenu
                            ref={menuRef}
                            track={track}
                            style={{ top: menuPos.top, left: menuPos.left, zIndex: 10000 }}
                            openUp={menuPos.openUp}
                            onClose={() => setMenuOpen(false)}
                        />
                    )}
                </div>

                {queueOpen && (
                    <div className="fullplayer__queue-overlay" onClick={() => setQueueOpen(false)}>
                        <div className="fullplayer__queue" ref={queueRef} onClick={e => e.stopPropagation()}>
                            <div className="fullplayer__queue-header">
                                <span className="fullplayer__queue-title">Очередь</span>
                                <button className="fullplayer__queue-close" onClick={() => setQueueOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="fullplayer__queue-list">
                                {(() => {
                                    const q = player.queue;
                                    const cur = player.currentIndex;
                                    if (!q.length) return <div className="fullplayer__queue-empty">Очередь пуста</div>;
                                    return q.map((t, i) => (
                                        <div
                                            key={t.id}
                                            className={`fullplayer__queue-item${i === cur ? ' fullplayer__queue-item--current' : ''}`}
                                            onClick={() => i !== cur && playQueueTrack(t)}
                                        >
                                            <img
                                                src={`/api/files/${t.cover}`}
                                                alt={t.title}
                                                className="fullplayer__queue-cover"
                                            />
                                            <div className="fullplayer__queue-info">
                                                <span className="fullplayer__queue-track-title">{t.title}</span>
                                                <span className="fullplayer__queue-artist">{t.artist}</span>
                                            </div>
                                            {i === cur && <span className="fullplayer__queue-indicator" />}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default FullPlayer;
