import io from "socket.io-client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const socket = io('http://localhost:8080');
// const socket = io('https://spotify-clone.ru', { transports: ['websocket'] });

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [friends, setFriends] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [favoriteTracks, setFavoriteTracks] = useState(null);

    const fetchFavorites = useCallback(async () => {
        try {
            const res = await axios.get('/api/users/me/favoriteTracks');
            setFavoriteTracks(res.data);
        } catch (err) {
            console.error('Failed to fetch favorite tracks', err);
        }
    }, []);

    const addFavoriteTrack = useCallback(async (track) => {
        try {
            await axios.post(`/api/users/addFavoriteTrack/${track.id}`);
            setFavoriteTracks(prev => prev ? [track, ...prev] : [track]);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const removeFavoriteTrack = useCallback(async (trackId) => {
        try {
            await axios.delete(`/api/users/removeFavoriteTrack/${trackId}`);
            setFavoriteTracks(prev => prev ? prev.filter(t => t.id !== trackId) : []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    const toggleFavoriteTrack = useCallback(async (track) => {
        const isFav = favoriteTracks?.some(t => t.id === track.id);
        if (isFav) {
            await removeFavoriteTrack(track.id);
        } else {
            await addFavoriteTrack(track);
        }
    }, [favoriteTracks, addFavoriteTrack, removeFavoriteTrack]);

    // Когда session загружается — инициализируем friends/requests и избранное
    useEffect(() => {
        if (session) {
            setFriends(session.friends ?? []);
            setIncomingRequests(session.incomingRequests ?? []);
            setOutgoingRequests(session.outgoingRequests ?? []);
            socket.emit('identity', session.id);
            fetchFavorites();
        }
    }, [session?.id]);

    const rejectRequest = (senderId) =>
        setIncomingRequests(prev => prev.filter(r => r.id !== senderId));

    const acceptRequest = (senderId) => {
        const request = incomingRequests.find(r => r.id === senderId);
        setIncomingRequests(prev => prev.filter(r => r.id !== senderId));
        setFriends(prev => [request, ...prev]);
    };

    const cancelRequest = (receiverId) =>
        setOutgoingRequests(prev => prev.filter(r => r.id !== receiverId));

    const sendRequest = (user) =>
        setOutgoingRequests(prev => [user, ...prev]);

    return (
        <AppContext.Provider value={{
            socket,
            session, setSession,
            currentTrack, setCurrentTrack,
            friends, incomingRequests, outgoingRequests,
            acceptRequest, rejectRequest, cancelRequest, sendRequest,
            favoriteTracks, fetchFavorites, addFavoriteTrack, removeFavoriteTrack, toggleFavoriteTrack,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useSocket            = () => useContext(AppContext).socket;
export const useSession           = () => useContext(AppContext).session;
export const useSetSession        = () => useContext(AppContext).setSession;
export const useCurrentTrack      = () => useContext(AppContext).currentTrack;
export const useSetCurrentTrack   = () => useContext(AppContext).setCurrentTrack;
export const useFriends           = () => useContext(AppContext).friends;
export const useIncomingRequests  = () => useContext(AppContext).incomingRequests;
export const useOutgoingRequests  = () => useContext(AppContext).outgoingRequests;
export const useFavoriteTracks    = () => useContext(AppContext).favoriteTracks;
export const useFavoriteActions   = () => {
    const { fetchFavorites, addFavoriteTrack, removeFavoriteTrack, toggleFavoriteTrack } = useContext(AppContext);
    return { fetchFavorites, addFavoriteTrack, removeFavoriteTrack, toggleFavoriteTrack };
};

export const useFriendRequestActions = () => {
    const { acceptRequest, rejectRequest, cancelRequest, sendRequest } = useContext(AppContext);
    return { acceptRequest, rejectRequest, cancelRequest, sendRequest };
};