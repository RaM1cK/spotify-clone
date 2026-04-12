import React, { useEffect, useRef, useState } from 'react';
import { Button } from "react-bootstrap";
import {Pause, Play, SkipForward, SkipBack, Repeat, Repeat1, LoaderCircle, Shuffle} from "lucide-react";
import FormRange from "react-bootstrap/cjs/FormRange";
import classes from '../../../css/rangestyle.module.css';
import "./Player.css"
import {Player as pl} from "../../../classes/Player.ts";
import RangeTrack from "./rangeTrack";
import {PlayerUI} from "../../../classes/observers/PlayerUI.ts";

const Player = () => {
    const intervalRef = useRef(null);
    const player = useRef(pl.getInstance()).current

    const [track, setTrack] = useState(undefined);
    const [disabledPlayer, setDisabledPlayer] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rangeValue, setRangeValue] = useState(0);
    const [rangeDisabled, setRangeDisabled] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const playerObserver = new PlayerUI(() => {
            setPlaying(player.isPlaying());
            setLoading(player.isLoading())
            setTrack(player.track);
            setDisabledPlayer(player.isLoading())
            if (player.track) {
                setDuration(player.track.duration);
                setRangeValue(player.seek())
            }

            if (player.isStopped()) {
                setRangeValue(0)
            }

            if (player.isLoading()) {
                setRangeValue(player.seek())
            }
        })

        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
            player.destroy();
            clearInterval(intervalRef.current);
        }
    }, [])

    return (
        <>
            <div
                id={"playerView"}
                className="position-sticky rounded-3 d-flex flex-column"
                style={{
                    background: `linear-gradient(to right, rgb(63 53 53) 0%, rgb(63 53 53) ${
                        duration ? ((rangeValue / duration) * 100) : 0
                    }%, black ${duration ? (rangeValue / duration) * 100 : 0}%, black 100%)`,
                    bottom: 0,
                    paddingTop: 0
            }}
            >
                {/*<FormRange*/}
                {/*    className={classes.customRange}*/}
                {/*    value={rangeValue.toString()}*/}
                {/*    max={duration}*/}
                {/*    onInput={handleChange}*/}
                {/*    onMouseDown={handleMouseDown}*/}
                {/*    onMouseUp={handleMouseUp}*/}
                {/*    onPointerDown={handleMouseDown}*/}
                {/*    onPointerUp={handleMouseUp}*/}
                {/*    onKeyDown={(e) => e.preventDefault()}*/}
                {/*    style={{*/}
                {/*        touchAction: 'none',*/}
                {/*        margin: 0*/}
                {/*    }}*/}
                {/*/>*/}

                <RangeTrack
                    duration={duration}
                    currentTime={rangeValue}
                    setRangeValue={setRangeValue}
                    playing={playing}
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





                    </div>

                    <Button
                        style={{
                            backgroundColor: 'transparent',
                            border: "none"
                        }}
                    >
                        <Shuffle
                            onClick={() => {
                                player.setStrategy("shuffle")
                            }}
                            className="d-flex align-self-center"
                            size={20}
                        />
                    </Button>

                    <Button
                        style={{
                            backgroundColor: 'transparent',
                            border: "none"
                        }}
                    >
                        <Repeat
                            // onClick={() => {
                            //     player.setStrategy("shuffle")
                            // }}
                            className="d-flex align-self-center"
                            size={20}
                        />
                    </Button>
                </div>
                </div>
        </>
    );
};

export default Player;