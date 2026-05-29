import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import { Heart, MoreVertical, Pause, Play, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {Player} from "../../../classes/Player.ts";
import "./trackitem.css";
import {TrackUI} from "../../../classes/observers/TrackUI.ts";
import axios from "axios";
import TrackMenu from "./TrackMenu.jsx";

function TrackItem({ number, track, tracks, setCurrentTrack, onFavoriteChange, difference }) {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isCurrent, setIsCurrent] = React.useState(false);
    const [isFavorite, setIsFavorite] = React.useState(track.hasInFavorite);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, openUp: false });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const player = React.useRef(Player.getInstance()).current;

    const formatTime = (seconds) => {
        if (!seconds) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    useEffect(() => {
        const observer = new TrackUI(() => {
            if (player.track && track.id === player.track.id) {
                setIsPlaying(player.isPlaying());
                setIsCurrent(true);
                return;
            }

            setIsPlaying(false)
            setIsCurrent(false);
        })
        observer.update()

        player.attach(observer);

        return () => {
            player.detach(observer);
        }
    }, [])

    const handleClick = () => {
        if (!player.track) {
            player.setTrack(track, tracks);
            setCurrentTrack(track);
        }
        else {
            if (player.track.id !== track.id) {
                player.setTrack(track, tracks)
                setCurrentTrack(track);
            } else {
                if (player.isLoading()) {
                    player.pause()
                    return
                }

                player.isPlaying() && !player.isLoading() ? player.pause() : player.play()
            }
        }
    }

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && menuRef.current.contains(e.target)) return;
            if (buttonRef.current && !buttonRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const mainEl = document.querySelector('.app-content');
        const onScroll = () => setMenuOpen(false);
        mainEl?.addEventListener('scroll', onScroll, { passive: true });
        return () => mainEl?.removeEventListener('scroll', onScroll);
    }, [menuOpen]);

    useLayoutEffect(() => {
        if (!menuOpen || !menuRef.current) return;
        const btn = buttonRef.current;
        if (!btn) return;

        const actualHeight = menuRef.current.offsetHeight;
        const actualWidth = menuRef.current.offsetWidth;
        const rect = btn.getBoundingClientRect();
        const mainEl = document.querySelector('.app-content');
        const mainRect = mainEl?.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < actualHeight;

        let top = openUp ? rect.top - actualHeight - 4 : rect.bottom + 4;
        let left = rect.right - actualWidth;

        if (mainRect) {
            left = Math.max(mainRect.left + 4, Math.min(left, mainRect.right - actualWidth - 4));
            if (openUp) {
                top = Math.max(mainRect.top + 4, top);
            } else {
                top = Math.min(top, mainRect.bottom - actualHeight - 4);
            }
        }

        setMenuPos({ top, left, openUp });
    }, [menuOpen]);

    const toggleMenu = (e) => {
        e.stopPropagation();
        const btn = e.currentTarget;
        setMenuOpen(prev => {
            if (!prev) {
                const rect = btn.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.right - 200, openUp: false });
            }
            return !prev;
        });
    };

    const toFavorite = () => {
        const request = () => isFavorite
            ? axios.delete(`/api/users/removeFavoriteTrack/${track.id}`)
            : axios.post(`/api/users/addFavoriteTrack/${track.id}`)

        request()
            .then(() => {
                const newValue = !isFavorite
                setIsFavorite(newValue)
                onFavoriteChange?.(track.id, newValue);
            })
            .catch(err => console.error(err));
    }

        return (
            <div className="track-item">
                {/* Left section */}

                <div onClick={handleClick} className="track-item__left">
                    <div className="track-number"
                    style={{ width: `${tracks.length.toString().length}ch` }}
                    >
                        {number}
                    </div>

                    {difference !== undefined && (
                        <div className="track-item__difference">
                            {difference === 0 ? (
                                <>
                                    <Minus size={24} className="track-item__diff-icon track-item__diff-icon--neutral" strokeWidth={2.5} />
                                </>
                            ) : difference > 0 ? (
                                <>
                                    <ArrowUp size={21} className="track-item__diff-icon track-item__diff-icon--up" />
                                    <span className="track-item__diff-value track-item__diff-value--up">{difference}</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDown size={21} className="track-item__diff-icon track-item__diff-icon--down" />
                                    <span className="track-item__diff-value track-item__diff-value--down">{Math.abs(difference)}</span>
                                </>
                            )}
                        </div>
                    )}

                    <div className="track-item__cover-wrapper">
                        <img
                            src={`/api/files/${track.cover}`}
                            alt={track.title}
                            className="track-item__cover"
                        />
                        <div className={`track-item__play${isCurrent ? "--current" : ""}`}>
                            {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                        </div>
                    </div>
                    <div className="track-item__info d-flex flex-column justify-content-between">
                        <span className="track-item__title">{track.title}</span>
                        <span className="track-item__artist">{track.artist}</span>
                    </div>


                </div>

                {/* Right section */}
                <div className="track-item__actions">
                    <span className="time">{formatTime(track.duration)}</span>

                    <button onClick={toFavorite} className="track-item__button">
                        <Heart size={20} color={"white"} fill={isFavorite ? "white" : "none"}/>
                    </button>

                    <button onClick={toggleMenu} ref={buttonRef} className="track-item__button">
                        <MoreVertical size={20} color={"white"}/>
                    </button>
                    {menuOpen && (
                        <TrackMenu
                            ref={menuRef}
                            track={track}
                            style={{ top: menuPos.top, left: menuPos.left, zIndex: 9999 }}
                            openUp={menuPos.openUp}
                            onClose={() => setMenuOpen(false)}
                        />
                    )}
                </div>
            </div>
        );
}

export default TrackItem;
