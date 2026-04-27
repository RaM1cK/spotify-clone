import React, {useEffect, useRef, useState} from "react";
import "./Messages.css";
import ChatItem from "./ChatItem";
import ChatWindow from "./ChatWindow";

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
    const [chats, setChats] = useState(MOCK_CHATS);
    const [activeChat, setActiveChat] = useState(null);
    const [input, setInput] = useState("");

    const activeChatRef = useRef(activeChat);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const handleChatChange = (chat) => {
        setChats((prev) =>
            prev.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c)
        );
        setActiveChat({ ...chat, unread: 0 });
    };

    const handleSend = (text = input, track = null) => {
        if (!track && !text.trim() || !activeChat) return;

        const newMessage = {
            id: Date.now(),
            from: "me",
            text: track ? null : text.trim(),
            track: track || null,
            time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        };

        const sentChatId = activeChat.id;

        setChats((prev) =>
            prev.map((chat) => {
                if (chat.id !== sentChatId) return chat;
                return {
                    ...chat,
                    messages: [...chat.messages, newMessage],
                    lastMessage: track ? `🎵 ${track.name}` : newMessage.text,
                    time: newMessage.time,
                };
            })
        );
        setActiveChat((prev) => ({
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: track ? `🎵 ${track.name}` : newMessage.text,
        }));

        if (!track) setInput("");

        setTimeout(() => {
            const reply = {
                id: Date.now() + 1,
                from: "them",
                text: "Пошёл нахуй!",
                time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
            };
            setChats((prev) =>
                prev.map((chat) => {
                    if (chat.id !== sentChatId) return chat;

                    const isOpen = activeChatRef.current?.id === chat.id;
                    console.log(isOpen);
                    const updated = {
                        ...chat,
                        messages: [...chat.messages, reply],
                        lastMessage: reply.text,
                        time: reply.time,
                        unread: isOpen ? chat.unread : chat.unread + 1
                    };

                    if (isOpen) setActiveChat(updated);
                    return updated;
                })
            );
        }, 1000);
    };

    return (
        <div className="messages-layout">
            <aside className="messages-sidebar">
                <div className="messages-sidebar__title">Сообщения</div>
                <div className="messages-chat-list">
                    {chats.map((chat) => (
                        <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={activeChat?.id === chat.id}
                            onClick={() => {
                                setActiveChat({ ...chat, unread: 0 });
                                setChats((prev) =>
                                    prev.map((c) => c.id === chat.id ? { ...c, unread: 0 } : c)
                                );
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
                // tracks={trackList}
                // onOpenAlbum={(albumId) => {
                //     const album = ALBUM_ITEMS.find(a => a.id === albumId);
                //     if (album) setActiveAlbum(album);
                // }}
            />
        </div>
    );
};

export default Messages;