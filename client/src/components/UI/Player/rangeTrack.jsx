import React, {useRef, useEffect, useState} from 'react';
import {Heart} from "lucide-react";
import "../Track/trackitem.css"
import {Player as pl} from "../../../classes/Player.ts";
import {PlayerUI} from "../../../classes/observers/PlayerUI";

// eslint-disable-next-line react-hooks/rules-of-hooks

const RangeTrack = ({duration, playing, intervalRef}) => {
    const isDraggingRef = useRef(false);
    const player = useRef(pl.getInstance()).current
    const [rangeDisabled, setRangeDisabled] = useState(false);
    const [rangeValue, setRangeValue] = useState(0);

    useEffect(() => {
        const playerObserver = new PlayerUI(() => {
            if (player.track) {
                setRangeValue(player.seek())
            }

            if (player.isStopped()) {
                setRangeValue(0)
            }

            if (player.isLoading() && player.seek() === 0) {
                // setRangeValue(player.seek())
                setRangeDisabled(true);
            } else {
                setRangeDisabled(false);
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
                if (!isDraggingRef.current) setRangeValue(prev => (prev + 1) % (duration + 1));
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
            if (!rangeDisabled) {
                const newValue = parseInt(e.target.value);
                player.seek(newValue);
                setRangeValue(newValue);
            }

            isDraggingRef.current = false;
        }
    };

    const handleChange = (e) => {
        const newValue = parseInt(e.target.value);
        setRangeValue(newValue);
    };

    return (
            <input
                type="range"
                min={0}
                max={duration || 0}
                value={rangeValue}
                onInput={handleChange}
                disabled={rangeDisabled}
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
                        duration ? (rangeValue / duration) * 100 : 0
                    }%, #444 ${duration ? (rangeValue / duration) * 100 : 0}%, #444 100%)`,
                    touchAction: 'none'
                }}
            />
    );
};

export default RangeTrack;