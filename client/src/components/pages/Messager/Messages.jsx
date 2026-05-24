import React, {useEffect, useRef, useState} from "react";
import "./Messages.css";
import ChatItem from "./ChatItem";
import ChatWindow from "./ChatWindow";
import axios from "axios";
import {useSession, useSocket} from "../../../AppContext";
import {LoadingPage} from "../LoadingPage";

const getMessagePreview = (msg) => {
    if (!msg.dataType || msg.dataType === 0) return msg.data || '';
    try {
        const d = JSON.parse(msg.data);
        switch (msg.dataType) {
            case 1: return `${d.title} - ${d.artist}`;
            case 2: return `${d.title}`;
            case 3: return `${d.name}`;
            case 4: return `${d.name}`;
            default: return msg.data;
        }
    } catch {
        return msg.data || ''
    }
};

const Messages = ({trackList, ALBUM_ITEMS, setCurrentTrack}) => {
    const socket = useSocket();
    const session = useSession();

    const [chats, setChats] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [input, setInput] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeChatRef = useRef(activeChat);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 991px)");
        const onMq = () => {
            if (!mq.matches) setMobileChatOpen(false);
        };
        mq.addEventListener("change", onMq);
        return () => mq.removeEventListener("change", onMq);
    }, []);

    const chatsSetter = (prev, newMessage) =>
        prev.map(chat =>
            chat.id !== newMessage.chatId ? chat : {
                ...chat,
                messages: [...chat.messages, newMessage],
                lastMessage: getMessagePreview(newMessage),
                createdAt: newMessage.createdAt
            }
        )

    const activeChatSetter = (prev, newMessage) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: getMessagePreview(newMessage),
    })

    const setLastMessage = (prev, newMessage) =>
        prev.map(chat =>
            chat?.id !== newMessage?.chatId ? chat : {
                ...chat,
                lastMessage: getMessagePreview(newMessage),
            }
        )

    useEffect(() => {
        axios.get('/api/users/me/chats')
            .then(res => {
                const chats = res.data;
                setChats(chats);

                chats.forEach(chat => {
                    socket.emit("join-room", chat.id)

                    const lastMessage = chat.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1)

                    if (lastMessage)
                        setChats(prev => setLastMessage(prev, lastMessage));
                })
            })
            .catch(() => setError('Ошибка загрузки'))
            .finally(() => setLoading(false));

        socket.on('receive-message', message => {
            if (activeChatRef.current?.id === message.chatId)
                setActiveChat(prev => activeChatSetter(prev, message));

            setChats(prev => chatsSetter(prev, message));
        })

        socket.on('user-online', userId => {
            console.log(`user ${userId} online`);
        })

        socket.on('user-offline', userId => {
            console.log(`user ${userId} offline`);
        })

        return () => {
            socket.off('receive-message')
            socket.off('user-online')
            socket.off('user-offline')
        }
    }, [])

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const handleChatChange = (chat) => {
        setChats((prev) =>
            prev.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c)
        );
        setActiveChat({ ...chat, unread: 0 });
    };

    const handleSend = (text = input) => {
        if (!text.trim() || !activeChat) return;

        const newMessage = {
            senderId: session.id,
            chatId: activeChat.id,
            data:  text.trim(),
            dataType: 0,
            quotedId: replyTo?.id,
            createdAt: new Date()
        };

        setInput("");
        setReplyTo(null)

        socket.emit('send-message', {
            room: activeChat.id,
            msg: newMessage
        });

    };

    const handleSendMedia = (media) => {
        if (!activeChat) return;

        const dataTypeMap = {track: 1, album: 2, artist: 3, playlist: 4};

        const newMessage = {
            senderId: session.id,
            chatId: activeChat.id,
            data: JSON.stringify(media.data),
            dataType: dataTypeMap[media.type] || 0,
            quotedId: replyTo?.id,
            createdAt: new Date()
        };

        setReplyTo(null);

        socket.emit('send-message', {
            room: activeChat.id,
            msg: newMessage
        });
    };

    if (loading) return <LoadingPage/>;
    if (error) return <div>{error}</div>;

    if (chats)
        return (
            <div className={`messages-layout${mobileChatOpen ? " messages-layout--mobile-chat" : ""}`}>
                <aside className="messages-sidebar">
                    <div className="messages-sidebar__title">Сообщения</div>
                    <div className="messages-chat-list">
                        {chats.map((chat) => (
                            <ChatItem
                                key={chat.id}
                                chat={chat}
                                isActive={activeChat?.id === chat.id}
                                onClick={() => {
                                    setChats(prev => {
                                        const fresh = prev.find(c => c.id === chat.id);

                                        setActiveChat({...fresh, unread: 0});

                                        return prev.map(c => c.id === chat.id ? {...c, unread: 0} : c);
                                    });
                                    if (window.matchMedia("(max-width: 991px)").matches) {
                                        setMobileChatOpen(true);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </aside>

                {/* Открытый чат */}
                <ChatWindow
                    activeChat={activeChat}
                    input={input}
                    setInput={setInput}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    handleSend={handleSend}
                    showMobileBack={mobileChatOpen}
                    onMobileBack={() => setMobileChatOpen(false)}
                    onSendTrack={(media) => {
                        handleSendMedia(media);
                    }}
                    setCurrentTrack={setCurrentTrack}
                    getMessagePreview={getMessagePreview}
                />
            </div>
        );
};

export default Messages;