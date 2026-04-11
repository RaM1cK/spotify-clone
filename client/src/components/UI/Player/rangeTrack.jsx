import React, {useRef, useEffect} from 'react';
import {Heart} from "lucide-react";
import "../Track/trackitem.css"
import {Player as pl} from "../../../classes/Player.ts";

// eslint-disable-next-line react-hooks/rules-of-hooks

const RangeTrack = ({duration, currentTime, setRangeValue, playing, intervalRef}) => {
    const isDraggingRef = useRef(false);
    const player = useRef(pl.getInstance()).current

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
            const newValue = parseInt(e.target.value);
            player.seek(newValue);
            setRangeValue(newValue);

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
                value={currentTime}
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
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${
                        duration ? (currentTime / duration) * 100 : 0
                    }%, #444 ${duration ? (currentTime / duration) * 100 : 0}%, #444 100%)`,
                    touchAction: 'none'
                }}
            />
    );
};

export default RangeTrack;