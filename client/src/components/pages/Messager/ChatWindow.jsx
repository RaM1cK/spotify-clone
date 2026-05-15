import React, {useRef, useState, useEffect} from "react";
import { Music, ChevronLeft } from "lucide-react";
import TrackMessage from "./TrackMessage";
import {useSession} from "../../../AppContext";

const ChatWindow = ({ activeChat, input, setInput, handleSend,
                        showMobileBack, onMobileBack, replyTo, setReplyTo
}) => {
    const [showTrackPicker, setShowTrackPicker] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [usersMap, setUsersMap] = useState(new Map());
    const session = useSession();
    const textareaRef = useRef(null);
    const menuRef = useRef(null);
    const messagesBodyRef = useRef(null);

    useEffect(() => {
        if (!contextMenu) return;

        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target))
                setContextMenu(null);
        };

        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [contextMenu]);

    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        const maxX = window.innerWidth - 200;
        const maxY = window.innerHeight - 160;
        setContextMenu({
            x: Math.min(e.clientX, maxX),
            y: Math.min(e.clientY, maxY),
            message: msg,
            isMine: msg.senderId === session.id,
        });
    };

    useEffect(() => {
        if (activeChat) {
            usersMap.clear()

            setUsersMap(new Map(activeChat.users.map(user => [user.id, user])))

            requestAnimationFrame(() => {
                if (messagesBodyRef.current) {
                    messagesBodyRef.current.scrollTop = messagesBodyRef.current.scrollHeight;
                }
            });
        }

        return () => {
            usersMap.clear()
        }
    }, [activeChat])

    if (!activeChat) {
        return (
            <div className="messages-chat">
                <div className="messages-empty">
                    <span>Выберите, кому хотите написать</span>
                </div>
            </div>
        );
    }

    return (
        <div className="messages-chat">
            <div className="messages-chat-header">
                {showMobileBack && (
                    <button
                        type="button"
                        className="messages-chat-back"
                        aria-label="К списку чатов"
                        onClick={() => onMobileBack?.()}
                    >
                        <ChevronLeft size={22} />
                    </button>
                )}
                <img src={activeChat.avatar} className="messages-avatar"/>
                <span className="messages-chat-name">{activeChat.name}</span>
            </div>

            <div className="messages-body" ref={messagesBodyRef} onContextMenu={(e) => e.preventDefault()}>
                {activeChat.messages.map((msg) => (
                    <div
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        className={`messages-bubble ${msg.senderId === session.id ? "me" : "them"}${replyTo?.id === msg.id ? " messages-bubble--reply-target" : ""}`}
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                    >
                        {msg.quotedMessage && (
                            <div className="messages-bubble__quoted" onClick={() => {
                                const el = document.getElementById(`msg-${msg.quotedMessage.id}`);
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}>
                                <div className="messages-bubble__quoted-line" />
                                <div className="messages-bubble__quoted-content">
                                    <span className="messages-bubble__quoted-user">
                                        {msg.quotedMessage.senderId === session.id ? 'Вы' : (usersMap.get(msg.quotedMessage.senderId)?.nickname)}
                                    </span>
                                    <span className="messages-bubble__quoted-text">{msg.quotedMessage.data}</span>
                                </div>
                            </div>
                        )}
                        <span className="messages-bubble__text">{msg.data}</span>
                        <span className="messages-bubble__time">{
                            new Date(msg.createdAt)
                                .toLocaleTimeString(navigator.language, {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                        </span>
                    </div>
                ))}
            </div>

            {contextMenu && (
                <div
                    className="messages-context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    ref={menuRef}
                >
                    <div className="messages-context-menu__item" onClick={() => {
                        setReplyTo(contextMenu.message);
                        setContextMenu(null);
                    }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Ответить
                    </div>
                    {contextMenu.isMine && (
                        <>
                            <div className="messages-context-menu__item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Редактировать
                            </div>
                            <div className="messages-context-menu__divider" />
                            <div className="messages-context-menu__item messages-context-menu__item--danger">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                     strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Удалить
                            </div>
                        </>
                    )}
                </div>
            )}

            {replyTo && (
                <div className="messages-reply-indicator">
                    <div className="messages-reply-indicator__content">
                        <div className="messages-reply-indicator__line" />
                        <div className="messages-reply-indicator__info">
                            <span className="messages-reply-indicator__user">{replyTo.senderId === session.id ? 'Вы' : usersMap.get(replyTo.senderId).nickname}</span>
                            <span className="messages-reply-indicator__text">{replyTo.data}</span>
                        </div>
                        <button className="messages-reply-indicator__close" type="button" onClick={() => setReplyTo(null)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                 strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="messages-input-row">
                <button
                    className="messages-attach-btn"
                    onClick={() => setShowTrackPicker((v) => !v)}
                >
                    <Music size={18} />
                </button>

                <textarea
                    ref={textareaRef}
                    className="messages-input"
                    placeholder="Написать сообщение..."
                    value={input}
                    rows={1}
                    onChange={(e) => setInput(e.target.value)}
                    onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();

                            requestAnimationFrame(() => {
                                if (textareaRef.current) {
                                    textareaRef.current.style.height = "auto";
                                }
                            });
                        }
                    }}
                />
                <button
                    className="messages-send-btn"
                    onClick={() => {
                    handleSend();

                    requestAnimationFrame(() => {
                        if (textareaRef.current) {
                            textareaRef.current.style.height = "auto";
                        }
                    });
                }}
                    >
                    →
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;