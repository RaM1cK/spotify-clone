import React, {useEffect, useRef, useState} from "react";
import "./Messages.css";
import ChatItem from "./ChatItem";
import ChatWindow from "./ChatWindow";
import axios from "axios";
import {useSession, useSocket} from "../../../AppContext";

const MOCK_CHATS = [
    {
        id: 1,
        name: "Алексей Петров",
        avatar: "АП",
        lastMessage: "Окей, увидимся завтра",
        time: "14:32",
        unread: 0,
        messages: [
            { id: 1, from: "them", text: "Привет! Как дела?", time: "14:20" },
            { id: 2, from: "me", text: "Всё хорошо, спасибо! А у тебя?", time: "14:21" },
            { id: 3, from: "them", text: "Тоже норм. Слушай, ты завтра свободен?", time: "14:25" },
            { id: 4, from: "me", text: "Да, с утра точно свободен", time: "14:28" },
            { id: 5, from: "them", text: "Окей, увидимся завтра", time: "14:32" },
        ],
    },
    {
        id: 2,
        name: "Мария Иванова",
        avatar: "МИ",
        lastMessage: "Скинь плейлист!",
        time: "12:10",
        unread: 2,
        messages: [
            { id: 1, from: "them", text: "Что слушаешь сейчас?", time: "12:05" },
            { id: 2, from: "me", text: "Morgenshtern, новый альбом", time: "12:07" },
            { id: 3, from: "them", text: "Скинь плейлист!", time: "12:10" },
        ],
    },
    {
        id: 3,
        name: "Дмитрий Смирнов",
        avatar: "ДС",
        lastMessage: "Ок",
        time: "вчера",
        unread: 0,
        messages: [
            { id: 1, from: "me", text: "Дим, ты слышал новый трек Jane Remover?", time: "вчера" },
            { id: 2, from: "them", text: "Ок", time: "вчера" },
        ],
    },
    {
        id: 4,
        name: "Анна Козлова",
        avatar: "АК",
        lastMessage: "Супер звук 🔥",
        time: "пн",
        unread: 0,
        messages: [
            { id: 1, from: "them", text: "Рекомендуй что-нибудь послушать", time: "пн" },
            { id: 2, from: "me", text: "Слушай Gazan — очень крутой", time: "пн" },
            { id: 3, from: "them", text: "Супер звук 🔥", time: "пн" },
        ],
    },
];

const Messages = ({trackList, ALBUM_ITEMS}) => {
    const socket = useSocket();
    const session = useSession();

    const [chats, setChats] = useState(null);
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
                lastMessage: newMessage.data,
                createdAt: newMessage.createdAt
            }
        )

    const activeChatSetter = (prev, newMessage) => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: newMessage.data,
    })

    const setLastMessage = (prev, newMessage) =>
        prev.map(chat =>
            chat?.id !== newMessage?.chatId ? chat : {
                ...chat,
                lastMessage: newMessage.data,
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
            createdAt: new Date()
        };

        setInput("");

        socket.emit('send-message', {
            room: activeChat.id,
            msg: newMessage
        });

        // setTimeout(() => {
        //     const reply = {
        //         id: Date.now() + 1,
        //         from: "them",
        //         text: "Хорошо",
        //         time: new Date().toLocaleTimeString(navigator.language, { hour: "2-digit", minute: "2-digit" }),
        //     };
        //     setChats((prev) =>
        //         prev.map((chat) => {
        //             if (chat.id !== sentChatId) return chat;
        //
        //             const isOpen = activeChatRef.current?.id === chat.id;
        //             console.log(isOpen);
        //             const updated = {
        //                 ...chat,
        //                 messages: [...chat.messages, reply],
        //                 lastMessage: reply.text,
        //                 time: reply.time,
        //                 unread: isOpen ? chat.unread : chat.unread + 1
        //             };
        //
        //             if (isOpen) setActiveChat(updated);
        //             return updated;
        //         })
        //     );
        // }, 1000);
    };

    if (loading) return <div>Загрузка...</div>
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
                    handleSend={handleSend}
                    showMobileBack={mobileChatOpen}
                    onMobileBack={() => setMobileChatOpen(false)}
                />
            </div>
        );
};

export default Messages;