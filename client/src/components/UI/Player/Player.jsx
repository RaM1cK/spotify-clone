import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from "react-bootstrap";
import {Pause, Play, SkipForward, SkipBack, Repeat, Repeat1, LoaderCircle, Shuffle, Volume2} from "lucide-react";
import "./Player.css"
import {Player as pl} from "../../../classes/Player.ts";
import RangeTrack from "./rangeTrack";
import {PlayerUI} from "../../../classes/observers/PlayerUI.ts";
import axios from "axios";
import FullPlayer from "./FullPlayer";
import {useFavoriteTracks} from "../../../AppContext";

const Player = ({track, setTrack}) => {
    const intervalRef = useRef(null);
    const player = useRef(pl.getInstance()).current
    const [loopState, setLoopState] = useState("noneLoop")
    const [isShuffle, setIsShuffle] = useState(false);

    const chainLoopStates = {
        "noneLoop": "loopPlaylist",
        "loopPlaylist": "loopTrack",
        "loopTrack": "noneLoop"
    }

    const [disabledPlayer, setDisabledPlayer] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [position, setPosition] = useState(0);
    const positionRef = useRef(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [showVolume, setShowVolume] = useState(false);
    const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
    const volumeRef = useRef(null);
    const favoriteTracks = useFavoriteTracks();
    const currentTrackId = track?.id;
    const isFavorite = useMemo(
        () => favoriteTracks?.some(t => t.id === currentTrackId),
        [favoriteTracks, currentTrackId]
    );

    useEffect(() => {
        positionRef.current = position;
    }, [position]);


    useEffect(() => {
        const playerObserver = new PlayerUI(() => {
            setPlaying(player.isPlaying());
            setLoading(player.isLoading())
            setDisabledPlayer(player.isLoading())
            setPosition(player.seek())
            if (player.track) {
                setTrack(player.track);
                setDuration(player.track.duration);
            }
        })

        if (track) {
            setDuration(track.duration);
            setPosition(Math.floor(track.start));
            player.setTrack(track, [track], false)
        }

        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
            player.destroy();
            clearInterval(intervalRef.current);
        }
    }, [])

    useEffect(() => {
        const handleUnload = () => {
            if (track) {
                const data = new Blob(
                    [JSON.stringify({
                        token: player.token,
                        position: positionRef.current
                    })],
                    { type: "application/json" }
                );

                navigator.sendBeacon("/api/tracks/position", data);
            }
        };

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, [track]);

    useEffect(() => {
        if (!showVolume) return;
        const handleClickOutside = (e) => {
            if (volumeRef.current && !volumeRef.current.contains(e.target)) {
                setShowVolume(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showVolume]);

    const handleRepeat = () => {
        const tempState = chainLoopStates[loopState]

        setLoopState(tempState);
        player.setStrategy(tempState)
    }

    return (
        <>
            <div
                id={"playerView"}
                className="rounded-3 d-flex flex-column"
                style={{
                    paddingTop: 0,
                    backgroundColor: "black",
                    visibility: track ? "visible" : "hidden",
                    height: track ? "auto" : 0,
                    width: '100%',
                    overflowX: "clip",
                    overflowY: "visible"
            }}
            >
                <RangeTrack
                    duration={duration}
                    playing={playing}
                    position={position}
                    setPosition={setPosition}
                    intervalRef={intervalRef}

                />

                <div className="d-flex flex-row p-3">
                    <Button
                        onClick={() => {
                            player.previous()
                        }}
                        style={{
                            backgroundColor: 'transparent',
                            border: "none"
                        }}
                    >
                        <SkipBack className="d-flex align-self-center" size={20}/>
                    </Button>
                    <Button
                        disabled={disabledPlayer}
                        style={{
                            width: '45px',
                            height: '45px',
                            backgroundColor: 'rgb(131 0 255)',
                            border: 'none'
                        }}
                        onClick={() => {
                            player.isPlaying() ? player.pause() : player.play()
                        }}
                        className="d-flex align-self-center rounded-5"
                    >
                        <div className="d-flex align-self-center">
                            {(() => {
                                if (loading) {
                                    return <LoaderCircle className="spin-player" size={20}/>
                                } else {
                                    return playing ? <Pause size={20}/> : <Play size={20}/>
                                }
                            })()}
                        </div>
                    </Button>
                    <Button
                        onClick={() => {
                            player.next()
                        }}
                        style={{
                            backgroundColor: 'transparent',
                            border: "none"
                        }}
                    >
                        <SkipForward

                            className="d-flex align-self-center"
                            size={20}
                        />
                    </Button>

                    <div
                        className="d-flex flex-column"
                        style={{ flex: 1, minWidth: 0, overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => {
                            setFullPlayerOpen(true)
                            setShowVolume(false)
                        }}
                    >
                        <div className="d-flex flex-column justify-content-between" style={{ minWidth: 0 }}>
                            <span className="track-item__title">{track ? track.title : ""}</span>
                            <span className="track-item__artist ">{track ? track.artist : ""}</span>
                        </div>
                    </div>

                    <Button
                        style={{
                            backgroundColor: 'transparent',
                            border: "none"
                        }}
                        onClick={() => {
                            player.setStrategy(isShuffle ? "simple" : "shuffle")
                            setIsShuffle(!isShuffle);
                        }}
                    >
                        <Shuffle
                            color={isShuffle ? 'rgb(165,69,244)' : "white"}
                            className="d-flex align-self-center"
                            size={20}
                        />
                    </Button>

                    <Button
                        style={{
                            backgroundColor: 'transparent',
                            border: "none"
                        }}
                        onClick={handleRepeat}
                    >
                        {loopState === "noneLoop" &&
                            <Repeat
                                className="d-flex align-self-center"
                                size={20}
                            />
                        }
                        {loopState === "loopPlaylist" &&
                            <Repeat
                                color='rgb(165,69,244)'
                                className="d-flex align-self-center"
                                size={20}
                            />
                        }

                        {loopState === "loopTrack" &&
                            <Repeat1
                                color='rgb(165,69,244)'
                                className="d-flex align-self-center"
                                size={20}
                            />
                        }
                    </Button>
                    <div ref={volumeRef} style={{ position: 'relative', display: 'inline-flex' }}>
                        <Button
                            className="volume-btn"
                            style={{
                                backgroundColor: 'transparent',
                                border: "none",
                                marginBottom: '4px'
                            }}
                            onClick={() => setShowVolume(!showVolume)}
                        >
                            <Volume2 size={20} color="white" />
                        </Button>
                        {showVolume && (
                            <input
                                type="range"
                                className="volume-slider"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onInput={e => {
                                    const v = parseFloat(e.target.value);
                                    setVolume(v);
                                    player.setVolume(v);
                                }}
                                style={{
                                    background: `linear-gradient(to top, #a855f7 0%, #a855f7 ${volume * 100}%, #555 ${volume * 100}%, #555 100%)`
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {fullPlayerOpen && track && (
                <FullPlayer
                    track={track}
                    onClose={() => setFullPlayerOpen(false)}
                    volume={volume}
                    setVolume={setVolume}
                    loopState={loopState}
                    setLoopState={setLoopState}
                    isShuffle={isShuffle}
                    setIsShuffle={setIsShuffle}
                    isFavorite={isFavorite}
                />
            )}
        </>
    );
};

export default Player;
