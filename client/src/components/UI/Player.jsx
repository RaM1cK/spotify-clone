import React, { useEffect, useRef, useState } from 'react';
import { Button } from "react-bootstrap";
import {Pause, Play, SkipForward, SkipBack, Repeat, Repeat1} from "lucide-react";
import FormRange from "react-bootstrap/cjs/FormRange";
import classes from '../../css/rangestyle.module.css';
import { Howl, Howler } from 'howler';
import {Player as pl} from "../../classes/Player.ts";
import RangeTrack from "./Track/rangeTrack";
import {PlayerUI} from "../../classes/observers/PlayerUI.ts";

const Player = ({}) => {
    const soundRef = useRef(null)
    const intervalRef = useRef(null);
    const isDraggingRef = useRef(false);
    const player = useRef(pl.getInstance()).current

    const [track, setTrack] = useState(null);
    const [trackId, setTrackId] = useState(null);
    const [disabledPlayer, setDisabledPlayer] = useState(true);
    const [hidePlayer, setHidePlayer] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rangeValue, setRangeValue] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const playerObserver = new PlayerUI(() => {
            setPlaying(player.isPlaying());
            setLoading(player.isLoading())

            if (player.track) {
                setTrack(player.track);
                setTrackId(player.track.id)
            }
        })

        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
        }
    }, [])

    const setHowl = (audioSrc) => {
        setHidePlayer(false);
        setDisabledPlayer(true)

        soundRef.current = new Howl({
                src: [audioSrc],
                volume: 0.05,
                loop: true,
                onload: () => {
                    setLoading(false);
                    setDisabledPlayer(false);
                    setDuration(Math.floor(soundRef.current.duration()));
                    setRangeValue(0);
                },
                onplay: () => {
                    intervalRef.current = setInterval(() => {
                        if (!isDraggingRef.current) setRangeValue(parseInt(soundRef.current.seek()));
                    }, 1000);
                },
                onpause: () => {
                    clearIntervalIfExists()
                },
                onstop: () => {
                    clearIntervalIfExists()
                    setRangeValue(0);
                },
                onend: () => {
                    if (!soundRef.current.loop()) {
                        player.stop()
                    }
                    clearIntervalIfExists();
                    setRangeValue(0);
                }
            }
        )
    }

    const clearIntervalIfExists = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    useEffect(() => {
        if (track) {
            setHowl(track.url)
        }

        return () => {
            clearIntervalIfExists()
            if (soundRef.current) {
                soundRef.current.stop();
                soundRef.current.unload();
            }
        }
    }, [trackId]);

    useEffect(() => {
        if (!soundRef.current || loading) return;
        if (playing) {
            soundRef.current.play();
        } else {
            soundRef.current.pause();
        }
    }, [playing, soundRef.current]);

    const handleMouseDown = (e) => {
        if (e.button === 0) {
            isDraggingRef.current = true;
            clearIntervalIfExists();
        }
    };

    const handleMouseUp = (e) => {
        const newValue = parseInt(e.target.value);
        soundRef.current.seek(newValue);
        setRangeValue(newValue);

        intervalRef.current = setInterval(() => {
            if (!isDraggingRef.current) setRangeValue(parseInt(soundRef.current.seek()));
        }, 1000);

        isDraggingRef.current = false;
    };

    const handleChange = (e) => {
        setRangeValue(parseInt(e.target.value));
    };

    return (
        <>
            {hidePlayer ? <></> : <div
                className="position-sticky rounded-1 p-2 d-flex"
                style={{
                    border: '2px solid purple',
                    backgroundColor: 'black',
                    bottom: '0',
                    width: '100%',
            }}
            >
                <Button
                    onClick={() => {
                        if (soundRef.current.seek() > 3) {
                            soundRef.current.stop();
                            soundRef.current.play()
                        } else {
                            player.previous()
                        }
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
                        width: '50px',
                        height: '50px',
                        backgroundColor: 'purple',
                        borderColor: 'purple'
                    }}
                    onClick={() => {
                        player.isPlaying() ? player.pause() : player.play()
                    }}
                    className="d-flex align-self-center rounded-5"
                >
                    <div className="d-flex align-self-center">
                        {playing ? <Pause size={20}/> : <Play size={20}/>}
                    </div>
                </Button>
                <Button
                    onClick={() => {
                        soundRef.current.stop();
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

                <div className="d-flex w-100 flex-column">
                    <div className="d-flex flex-column justify-content-between">
                        <span className="track-item__title">{track ? track.name : ""}</span>
                        <span className="track-item__artist ">{track ? track.creator : ""}</span>
                    </div>

                    {/*<RangeTrack*/}
                    {/*    duration={track.duration}*/}
                    {/*    currentTime={rangeValue}*/}
                    {/*    onSeek={*/}
                    {/*        soundRef.current.seek*/}
                    {/*    }*/}
                    {/*/>*/}


                    <FormRange
                        className={classes.customRange}
                        value={rangeValue}
                        max={duration}
                        onChange={handleChange}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onPointerDown={handleMouseDown}
                        onPointerUp={handleMouseUp}
                        onKeyDown={(e) => e.preventDefault()}
                    />
                </div>

                <Button
                    style={{
                        backgroundColor: 'transparent',
                        border: "none"
                    }}
                >
                    <Repeat
                        className="d-flex align-self-center"
                        size={20}
                    />
                </Button>
            </div>}
        </>
    );
};

export default Player;