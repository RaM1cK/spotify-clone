import io from "socket.io-client";
import {createContext, useContext, useEffect, useState} from "react";

const socket = io('ws://localhost:8080');
const AppContext = createContext(null);

export const AppProvider = ({session, children}) => {
    const [friends, setFriends] = useState(session?.friends);
    const [incomingRequests, setIncomingRequests] = useState(session?.incomingRequests);
    const [outgoingRequests, setOutgoingRequests] = useState(session?.outgoingRequests);

    const rejectRequest = (senderId) => setIncomingRequests(prev =>
        prev.filter(r => r.id !== senderId)
    )
    const acceptRequest = (senderId) => {
        const request = incomingRequests.find(r => r.id === senderId);

        setIncomingRequests(prev => prev.filter(r => r.id !== senderId))

        setFriends(prev => [request, ...prev])
    }

    const cancelRequest = (receiverId) =>
        setOutgoingRequests(prev => prev.filter(r => r.id !== receiverId))

    useEffect(() => {
        if (session) socket.emit('identity', session.id)
    }, [session]);

    return (
        <AppContext.Provider value={{
            socket, session, friends, incomingRequests, outgoingRequests,
            acceptRequest, rejectRequest, cancelRequest
        }}>
            {children}
        </AppContext.Provider>
    )
}

export const useSocket = () => useContext(AppContext).socket;
export const useSession = () => useContext(AppContext).session;
export const useFriends = () => useContext(AppContext).friends;
export const useIncomingRequests = () => useContext(AppContext).incomingRequests;
export const useOutgoingRequests = () => useContext(AppContext).outgoingRequests;
export const useFriendRequestActions = () => {
    const {acceptRequest, rejectRequest, cancelRequest} = useContext(AppContext);

    return {acceptRequest, rejectRequest, cancelRequest};
}
