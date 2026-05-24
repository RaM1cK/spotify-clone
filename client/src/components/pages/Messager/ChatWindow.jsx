import React, {useRef, useState, useEffect, useLayoutEffect} from "react";
import { Music, ChevronLeft, Reply, Pencil, Trash2, X, Play, ExternalLink, MoreVertical } from "lucide-react";
import {useNavigate} from "react-router-dom";
import {useSession} from "../../../AppContext";
import TrackPickerModal from "./TrackPickerModal";
import TrackMenu from "../../UI/Track/TrackMenu.jsx";
import "../../UI/Track/trackitem.css";
import axios from "axios";
import {Player} from "../../../classes/Player.ts";

const TrackType = Object.freeze({
    TRACK: 1,
    ALBUM: 2,
    ARTIST: 3,
    PLAYLIST: 4
});
const TYPE_LABELS = {
    [TrackType.TRACK]: 'трек',
    [TrackType.ALBUM]: 'альбом',
    [TrackType.ARTIST]: 'артист',
    [TrackType.PLAYLIST]: 'плейлист'
};

const ChatWindow = ({ activeChat, input, setInput, handleSend,
                        showMobileBack, onMobileBack, replyTo, setReplyTo,
                        onSendTrack, getMessagePreview
}) => {
    const [showTrackPicker, setShowTrackPicker] = useState(false);
    const [contextMenu, setContextMenu] = useState(null);
    const [usersMap, setUsersMap] = useState(new Map());
    const [trackMenuId, setTrackMenuId] = useState(null);
    const [trackMenuPos, setTrackMenuPos] = useState({top: 0, left: 0});
    const session = useSession();
    const navigate = useNavigate();
    const textareaRef = useRef(null);
    const menuRef = useRef(null);
    const trackMenuRef = useRef(null);
    const messagesBodyRef = useRef(null);
    const player = useRef(Player.getInstance()).current;

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

    useEffect(() => {
        if (!trackMenuId) return;

        const handleClick = (e) => {
            if (trackMenuRef.current && !trackMenuRef.current.contains(e.target))
                setTrackMenuId(null);
        };

        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [trackMenuId]);

    useEffect(() => {
        if (!trackMenuId) return;
        const mainEl = document.querySelector('.app-content');
        const onScroll = () => setTrackMenuId(null);
        mainEl?.addEventListener('scroll', onScroll, { passive: true });
        return () => mainEl?.removeEventListener('scroll', onScroll);
    }, [trackMenuId]);

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

    const openTrackMenu = (msgId, btnRect) => {
        const menuWidth = 200;
        const spaceBelow = window.innerHeight - btnRect.bottom;
        const openUp = spaceBelow < 200;
        setTrackMenuPos({
            top: openUp ? btnRect.top - 4 : btnRect.bottom + 4,
            left: btnRect.right - menuWidth,
            openUp
        });
        setTrackMenuId(msgId);
    };

    useLayoutEffect(() => {
        if (!trackMenuId || !trackMenuRef.current) return;

        const menu = trackMenuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const pad = 8;

        let top = menuRect.top;
        let left = menuRect.left;
        let openUp = trackMenuPos.openUp;

        if (menuRect.bottom > window.innerHeight - pad) {
            openUp = true;
            top = window.innerHeight - menuRect.height - pad;
        }
        if (top < pad) top = pad;

        if (menuRect.right > window.innerWidth - pad) {
            left = window.innerWidth - menuRect.width - pad;
        }
        if (left < pad) left = pad;

        if (top !== menuRect.top || left !== menuRect.left || openUp !== trackMenuPos.openUp) {
            setTrackMenuPos({ top, left, openUp });
        }
    }, [trackMenuId]);

    const renderMediaCard = (msg) => {
        const d = JSON.parse(msg.data);

        const handlePlay = async (e) => {
            e.stopPropagation();

            let reqPath = null

            switch (msg.dataType) {
                case TrackType.ALBUM: reqPath = `/api/releases/${d.id}`; break;
                case TrackType.ARTIST: reqPath = `/api/artists/${d.id}`; break;
                case TrackType.PLAYLIST: reqPath = `/api/playlists/${d.id}`; break;
            }

            if (!reqPath) {
                player.setTrack(d, [d]);
                return;
            }

            const res = await axios.get(reqPath)

            player.setTrack(res.data.tracks[0], res.data.tracks);
        };

        const handleOpen = (e) => {
            e.stopPropagation();
            switch (msg.dataType) {
                case TrackType.ALBUM: navigate(`/music/albums/${d.id}`); break;
                case TrackType.ARTIST: navigate(`/music/artists/${d.id}`); break;
                case TrackType.PLAYLIST: navigate(`/music/playlists/${d.id}`); break;
            }
        };

        const coverSrc = d.cover ? `/api/files/${d.cover}` : d.avatar ? `/api/files/${d.avatar}` : null;

        return (
            <div className="messages-media-card">
                <div className="messages-media-card__main">
                    {coverSrc ? (
                        <img className="messages-media-card__cover" src={coverSrc} alt={d.title || d.name} />
                    ) : (
                        <div className="messages-media-card__cover messages-media-card__cover--empty">
                            <Music size={20} />
                        </div>
                    )}
                    <div className="messages-media-card__info">
                        <span className="messages-media-card__title">{d.title || d.name}</span>
                        {d.artist && <span className="messages-media-card__sub">{d.artist}</span>}
                        <span className="messages-media-card__type">{TYPE_LABELS[msg.dataType] || 'медиа'}</span>
                    </div>
                </div>
                <div className="messages-media-card__actions">
                    <button className="messages-media-card__btn messages-media-card__btn--play" onClick={handlePlay}>
                        <Play size={14} /> Прослушать
                    </button>
                    {msg.dataType === TrackType.TRACK ? (
                        <button className="messages-media-card__btn messages-media-card__btn--more"
                                onClick={(e) => { e.stopPropagation(); openTrackMenu(msg.id, e.currentTarget.getBoundingClientRect()); }}>
                            <MoreVertical size={16} />
                        </button>
                    ) : (
                        <button className="messages-media-card__btn messages-media-card__btn--open" onClick={handleOpen}>
                            <ExternalLink size={14} /> Открыть
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (!activeChat) {
        return (
            <div className="messages-chat">
                <div className="messages-empty">
                    <span>Выберите, кому хотите написать</span>
                </div>
            </div>
        );
    }

    const activeTrackMsg = trackMenuId ? activeChat.messages.find(m => m.id === trackMenuId) : null;
    const activeTrackData = activeTrackMsg ? JSON.parse(activeTrackMsg.data) : null;

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
                                                <span className="messages-bubble__quoted-text">{getMessagePreview(msg.quotedMessage)}</span>
                                            </div>
                                        </div>
                                    )}
                                    {msg.dataType > 0 ? renderMediaCard(msg) : (
                                        <span className="messages-bubble__text">{msg.data}</span>
                                    )}
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

            {trackMenuId && activeTrackData && (
                <TrackMenu
                    ref={trackMenuRef}
                    track={activeTrackData}
                    style={{ top: trackMenuPos.top, left: trackMenuPos.left, zIndex: 10001 }}
                    openUp={trackMenuPos.openUp}
                    onClose={() => setTrackMenuId(null)}
                />
            )}

            {replyTo && (
                <div className="messages-reply-indicator">
                    <div className="messages-reply-indicator__content">
                        <div className="messages-reply-indicator__line" />
                        <div className="messages-reply-indicator__info">
                            <span className="messages-reply-indicator__user">{replyTo.senderId === session.id ? 'Вы' : usersMap.get(replyTo.senderId).nickname}</span>
                            <span className="messages-reply-indicator__text">{getMessagePreview(replyTo)}</span>
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