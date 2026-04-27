import React, { useEffect, useRef, useState } from 'react';
import { Button } from "react-bootstrap";
import {Pause, Play, SkipForward, SkipBack, Repeat, Repeat1, LoaderCircle, Shuffle} from "lucide-react";
import "./Player.css"
import {Player as pl} from "../../../classes/Player.ts";
import RangeTrack from "./rangeTrack";
import {PlayerUI} from "../../../classes/observers/PlayerUI.ts";

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

    //const [track, setTrack] = useState(undefined);
    //перенес в app чтобы плеера не было, пока нет проигрываемого трека

    const [disabledPlayer, setDisabledPlayer] = useState(true);
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const playerObserver = new PlayerUI(() => {
            setPlaying(player.isPlaying());
            setLoading(player.isLoading())
            setDisabledPlayer(player.isLoading())
            if (player.track) {
                setTrack(player.track);
                setDuration(player.track.duration);
            }
        },[])

        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
            player.destroy();
            clearInterval(intervalRef.current);
        }
    }, [])

    const handleRepeat = () => {
        const tempState = chainLoopStates[loopState]

        setLoopState(tempState);
        player.setStrategy(tempState)
    }

    return (
            <div
                id={"playerView"}
                className="rounded-3 d-flex flex-column"
                style={{
                    bottom: 0,
                    paddingTop: 0,
                    backgroundColor: "black",
                    visibility: track ? "visible" : "hidden",
                    height: track ? "auto" : 0,
                    width: '100%',
                    overflow: "hidden",
                    paddingBottom: "env(safe-area-inset-bottom)"
            }}
            >
                <RangeTrack
                    duration={duration}
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
                </div>
            </div>
    );
};

export default Player;