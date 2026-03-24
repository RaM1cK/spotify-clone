import React, { useEffect, useRef, useState } from 'react';
import { Button } from "react-bootstrap";
import {Pause, Play, SkipForward, SkipBack, Repeat} from "lucide-react";
import FormRange from "react-bootstrap/cjs/FormRange";
import classes from '../../css/rangestyle.module.css';
import { Howl, Howler } from 'howler';
import {Player as pl} from "../../classes/Player.ts";
import RangeTrack from "./Track/rangeTrack";
import {TrackUI} from "../../classes/TrackUI.ts";
import {PlayerUI} from "../../classes/PlayerUI.ts";

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
            setTrack(player.track);
            setTrackId(player.track.id)
        })

        const observer = new TrackUI(() => {
            setPlaying(player.isPlaying());
            setLoading(player.isLoading())
        })

        player.attach(observer);
        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
            player.detach(observer);
        }
    }, [])

    const setHowl = (audioSrc) => {
        if(!audioSrc) {
            setHidePlayer(true);
            return
        }
        setHidePlayer(false);
        setDisabledPlayer(true)

        soundRef.current = new Howl({
                src: [audioSrc],
                volume: 0.05,
                loop: true,
                onload: () => {
                    setPlaying(true)
                    setDisabledPlayer(false);
                    setDuration(Math.floor(soundRef.current.duration()));
                    setRangeValue(0);
                },
                onplay: () => {
                    player.play()
                    intervalRef.current = setInterval(() => {
                        if (!isDraggingRef.current) setRangeValue(parseInt(soundRef.current.seek()));
                    }, 1000);
                },
                onpause: () => {
                    player.pause()
                    clearIntervalIfExists()
                },
                onstop: () => {
                    clearIntervalIfExists()
                    setRangeValue(0);
                },
                onend: () => {
                    if (!soundRef.current.loop()) {
                        clearIntervalIfExists();
                        player.stop()
                    }
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
            soundRef.current.play()
        }

        return () => {
            clearIntervalIfExists();
            if (soundRef.current) {
                soundRef.current.stop();
                soundRef.current.unload();
            }
        };
    }, [trackId]);

    useEffect(() => {
        if (soundRef.current && !loading) {
            playing ? soundRef.current.play() : soundRef.current.pause();
        }
    }, [playing])

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
                className="w-100 rounded-1 p-2 d-flex flex-row align-self-center"
                style={{ border: '2px solid purple', backgroundColor: 'black', position: "fixed", bottom: '0'}}
            >
                <Button
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
                    onClick={() => {setPlaying(!playing)}}
                    className="d-flex align-self-center rounded-5"
                >
                    <div className="d-flex align-self-center">
                        {playing ? <Pause size={20}/> : <Play size={20}/>}
                    </div>
                </Button>
                <Button
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