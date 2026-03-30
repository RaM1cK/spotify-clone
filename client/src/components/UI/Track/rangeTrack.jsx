import React, {useState} from 'react';
import {Heart} from "lucide-react";
import "./trackitem.css"

// eslint-disable-next-line react-hooks/rules-of-hooks

const RangeTrack = ({duration, currentTime, onSeek}) => {
    return (
            <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                style={{
                    width: '100%',
                    height: 4,
                    appearance: 'none',
                    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${
                        duration ? (currentTime / duration) * 100 : 0
                    }%, #444 ${duration ? (currentTime / duration) * 100 : 0}%, #444 100%)`,
                }}
            />
    );
};

export default RangeTrack;