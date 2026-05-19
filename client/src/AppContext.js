import io from "socket.io-client";
import { createContext, useContext, useEffect, useState } from "react";

const socket = io('http://localhost:8080');
// const socket = io('https://spotify-clone.ru', { transports: ['websocket'] });

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [friends, setFriends] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);

    // Когда session загружается — инициализируем friends/requests
    useEffect(() => {
        if (session) {
            setFriends(session.friends ?? []);
            setIncomingRequests(session.incomingRequests ?? []);
            setOutgoingRequests(session.outgoingRequests ?? []);
            socket.emit('identity', session.id);
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
export const useFriendRequestActions = () => {
    const { acceptRequest, rejectRequest, cancelRequest, sendRequest } = useContext(AppContext);
    return { acceptRequest, rejectRequest, cancelRequest, sendRequest };
};