import React, {useRef, useState, useEffect} from "react";
import { Music, ChevronLeft, Reply, Pencil, Trash2, X } from "lucide-react";
import {useSession} from "../../../AppContext";
import TrackPickerModal from "./TrackPickerModal";

const ChatWindow = ({ activeChat, input, setInput, handleSend,
                        showMobileBack, onMobileBack, replyTo, setReplyTo,
                        onSendTrack
}) => {
    const [showTrackPicker, setShowTrackPicker] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [usersMap, setUsersMap] = useState(new Map());
    const session = useSession();
    const textareaRef = useRef(null);
    const menuRef = useRef(null);
    const messagesBodyRef = useRef(null);

    const formatDateSeparator = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isSameDay = (d1, d2) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        if (isSameDay(date, today)) return "Сегодня";
        if (isSameDay(date, yesterday)) return "Вчера";

        return date.toLocaleDateString(navigator.language, {
            day: 'numeric',
            month: 'long',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
    };

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
                {(() => {
                    let prevDate = null;
                    return activeChat.messages.map((msg) => {
                        const msgDate = new Date(msg.createdAt).toDateString();
                        const showDate = msgDate !== prevDate;
                        prevDate = msgDate;
                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && (
                                    <div className="messages-date-separator">
                                        <span>{formatDateSeparator(msg.createdAt)}</span>
                                    </div>
                                )}
                                <div
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
                            </React.Fragment>
                        );
                    });
                })()}
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
                        <Reply size={16} />
                        Ответить
                    </div>
                    {contextMenu.isMine && (
                        <>
                            <div className="messages-context-menu__item">
                                <Pencil size={16} />
                                Редактировать
                            </div>
                            <div className="messages-context-menu__divider" />
                            <div className="messages-context-menu__item messages-context-menu__item--danger">
                                <Trash2 size={16} />
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
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="messages-input-row">
                <button
                    className="messages-attach-btn"
                    onClick={() => setShowTrackPicker(v => !v)}
                >
                    <Music size={18} />
                </button>

                {showTrackPicker && (
                    <TrackPickerModal
                        onClose={() => setShowTrackPicker(false)}
                        onSend={onSendTrack}
                    />
                )}

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