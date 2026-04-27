import { useState, useEffect } from 'react';

const usePlayerState = (player, tracks) => {
    const getState = () => {
        const queue = player.queue;
        const isSameQueue = queue.length === tracks.length &&
            queue.every((t, i) => t.id === tracks[i]?.id);
        return player.isPlaying() && isSameQueue;
    };

    const [isPlaying, setIsPlaying] = useState(getState());

    useEffect(() => {
        const interval = setInterval(() => {
            setIsPlaying(getState());
        }, 200);

        return () => clearInterval(interval);
    }, [player, tracks]);

    return isPlaying;
};

export default usePlayerState;