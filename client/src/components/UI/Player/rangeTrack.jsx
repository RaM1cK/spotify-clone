import React, {useRef, useEffect, useState} from 'react';
import {Heart} from "lucide-react";
import "./rangeTrack.css"
import "../Track/trackitem.css"
import {Player as pl} from "../../../classes/Player.ts";
import {PlayerUI} from "../../../classes/observers/PlayerUI.ts";

// eslint-disable-next-line react-hooks/rules-of-hooks

const RangeTrack = ({duration, playing, intervalRef, position, setPosition}) => {
    const isDraggingRef = useRef(false);
    const player = useRef(pl.getInstance()).current

    useEffect(() => {
        const playerObserver = new PlayerUI(() => {
            if (player.isStopped()) {
                setPosition(0)
            }
        },[])

        player.attach(playerObserver);

        return () => {
            player.detach(playerObserver);
            player.destroy();
            clearInterval(intervalRef.current);
        }
    }, [])

    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                if (!isDraggingRef.current) setPosition(player.seek());
            }, 1000)
        } else {
            clearInterval(intervalRef.current);
        }

        return () => {
            clearInterval(intervalRef.current);
        }
    }, [playing])

    const handleMouseDown = (e) => {
        if (e.button !== 0) return

        isDraggingRef.current = true;
    };

    const handleMouseUp = (e) => {
        if (isDraggingRef.current) {
            const newValue = parseInt(e.target.value);
            player.seek(newValue);
            setPosition(newValue);

            isDraggingRef.current = false;
        }
    };

    const handleChange = (e) => {
        const newValue = parseInt(e.target.value);
        setPosition(newValue);
    };

    return (
            <input
                type="range"
                min={0}
                max={duration || 0}
                value={position}
                onInput={handleChange}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onPointerDown={handleMouseDown}
                onPointerUp={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                onKeyDown={(e) => e.preventDefault()}
                style={{
                    width: '100%',
                    height: 4,
                    appearance: 'none',
                    color: "black",
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${
                        duration ? (position / duration) * 100 : 0
                    }%, #444 ${duration ? (position / duration) * 100 : 0}%, #444 100%)`,
                    touchAction: 'none'
                }}
            />
    );
};

export default RangeTrack;