import io from "socket.io-client";
import {createContext, useContext, useEffect} from "react";

const socket = io('ws://localhost:8080');
const AppContext = createContext(null);

export const AppProvider = ({session, children}) => {
    useEffect(() => {
        socket.emit('identity', session.id)
    }, [session]);

    return (
        <AppContext.Provider value={{socket, session}}>
            {children}
        </AppContext.Provider>
    )
}

export const useSocket = () => useContext(AppContext).socket;
export const useSession = () => useContext(AppContext).session;
