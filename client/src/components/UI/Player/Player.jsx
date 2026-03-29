import React, { useEffect, useRef, useState } from 'react';
import { Button } from "react-bootstrap";
import {Pause, Play, SkipForward, SkipBack, Repeat, Repeat1, LoaderCircle} from "lucide-react";
import FormRange from "react-bootstrap/cjs/FormRange";
import classes from '../../../css/rangestyle.module.css';
import "./Player.css"
import {Player as pl} from "../../../classes/Player.ts";
import RangeTrack from "../Track/rangeTrack";
import {PlayerUI} from "../../../classes/observers/PlayerUI.ts";

const Player = () => {
    const intervalRef = useRef(null);
    const isDraggingRef = useRef(false);
    const player = useRef(pl.getInstance()).current

    const [track, setTrack] = useState(undefined);
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
            setTrack(player.track);
            setHidePlayer(player.track === undefined)
            setDisabledPlayer(player.isLoading())
            if (player.track) {
                setDuration(player.track.duration);
            }

            if (player.isPlaying()) {
                intervalRef.current = setInterval(() => {
                    if (!isDraggingRef.current) setRangeValue(prev => prev + 1);
                }, 1000)
            } else {
                clearIntervalIfExists()
            }

            if (player.isStopped() || player.isLoading()) {
                clearIntervalIfExists()
                setRangeValue(0)
            }
        })

        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
        }
    })

    const clearIntervalIfExists = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const handleMouseDown = () => {
        isDraggingRef.current = true;
        clearIntervalIfExists();
    };

    const handleMouseUp = (e) => {
        if (isDraggingRef.current) {
            const newValue = parseInt(e.target.value);
            player.seek(newValue);
            setRangeValue(newValue);

            intervalRef.current = setInterval(() => {
                if (!isDraggingRef.current) setRangeValue(prev => prev + 1);
            }, 1000);

            isDraggingRef.current = false;
        }
    };

    const handleChange = (e) => {
        setRangeValue(parseInt(e.target.value));
    };

    return (
        <>
            {hidePlayer ? <></> : <div
                id={"playerView"}
                className="position-sticky rounded-1 p-2 d-flex"
                style={{
                    border: '2px solid purple',
                    backgroundColor: 'black',
                    bottom: '0',
            }}
            >
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
                        {(() => {
                            if (loading) {
                                return <LoaderCircle className="spin" size={20}/>
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
                        value={rangeValue.toString()}
                        max={duration}
                        onInput={handleChange}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchEnd={handleMouseUp}
                        onKeyDown={(e) => e.preventDefault()}
                        style={{
                            touchAction: 'none',
                        }}
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