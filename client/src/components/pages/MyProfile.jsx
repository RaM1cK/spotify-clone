import React, {useState, useRef, useEffect} from 'react';
import {
    useFriendRequestActions,
    useFriends,
    useIncomingRequests,
    useOutgoingRequests,
    useSession, useSetSession
} from '../../AppContext';
import {useNavigate, useLocation, Routes, Route, useParams} from "react-router-dom";
import './MyProfile.css';
import axios from "axios";
import {LoadingPage} from "./LoadingPage";
import { User, Pencil, ChevronRight, Ellipsis, Check, X, FolderPlus, UserPlus, MessageCirclePlus, Trash2 } from "lucide-react";
import {Player} from "../../classes/Player.ts";
import usePlayerState from "../../hooks/usePlayerState";

/* ── Friend Card ── */
function FriendCard({ friend }) {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/profile/${friend.id}`)}
            className="mp-friend-card">
            <div className="mp-friend-avatar">
                {friend.avatar
                    ? <img src={`/api/files/${friend.avatar}`} alt={friend.nickname} />
                    : <User size={24} />
                }
            </div>
            <span className="mp-friend-nick">{friend.nickname}</span>
        </div>
    );
}

/* ── Request Card ── */
function RequestCard({ req, type }) {
    const {acceptRequest, rejectRequest, cancelRequest} = useFriendRequestActions()

    return (
        <div className="mp-request-card">
            <div className="mp-request-avatar">
                {req.avatar
                    ? <img src={`/api/files/${req.avatar}`} alt={req.nickname} />
                    : <User size={20} />
                }
            </div>
            <span className="mp-request-nick">{req.nickname}</span>
            {type === 'incoming' && (
                <div className="mp-request-actions">
                    <button
                        className="mp-req-btn mp-req-btn--accept"
                        onClick={() => {
                            axios.post(`/api/users/accept/${req.id}`)
                                .then(() => acceptRequest(req.id))
                                .catch(err => console.error(err))
                        }}
                    >
                        <Check size={14} />
                    </button>
                    <button
                        className="mp-req-btn mp-req-btn--decline"
                        onClick={() => {
                            axios.delete(`/api/users/reject/${req.id}`)
                                .then(() => rejectRequest(req.id))
                                .catch(err => console.error(err));
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
            {type === 'outgoing' && (
                <div className="mp-request-actions">
                    <button
                        className="mp-req-btn mp-req-btn--cancel"
                        onClick={() => {
                            axios.delete(`/api/users/cancel/${req.id}`)
                                .then(() => cancelRequest(req.id))
                                .catch(err => console.error(err));
                        }}
                    >
                        <X size={14} />Отменить
                    </button>
                </div>
            )}
        </div>
    );
}

export function UserProfile({setCurrentTrack}) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    //удалить друга
    const [confirmRemove, setConfirmRemove] = useState(false);

    const friends = useFriends();
    const outgoingRequests = useOutgoingRequests();
    const incomingRequests = useIncomingRequests();
    const { sendRequest, cancelRequest, acceptRequest, rejectRequest } = useFriendRequestActions();

    const friendIds   = new Set(friends?.map(f => f.id) || []);
    const outgoingIds = new Set(outgoingRequests?.map(r => r.id) || []);
    const incomingIds = new Set(incomingRequests?.map(r => r.id) || []);


    useEffect(() => {
        axios.get(`/api/users/${id}`)
            .then(res => setUser(res.data))
            .catch(() => setError("Пользователь не найден"))
            .finally(() => setLoading(false));
    }, [id]);

    const player = useRef(Player.getInstance()).current;
    const [Tracks, setTracks] = React.useState([])
    const isPlaying = usePlayerState(player, Tracks);

    useEffect(() => {
        axios.get(`/api/users/${id}/favoriteTracks`)
            .then(res =>  setTracks(res.data))
            .catch(() =>  setError('Ошибка загрузки'))
            .finally(() => setLoading(false));
    }, []);

    const onFavoriteChange = (trackId, isFavorite) => {
        if (!isFavorite) {
            setTracks(tracks => tracks.filter(track => track.id !== trackId));
        }
    }


    if (loading) return <LoadingPage />;
    if (error) return <div className="mp-root"><p className="mp-empty">{error}</p></div>;
    if (!user) return null;

    const isFriend   = friendIds.has(user.id);
    const isOutgoing = outgoingIds.has(user.id);
    const isIncoming = incomingIds.has(user.id);

    const handleFriendAction = () => {
        if (isOutgoing) {
            cancelRequest(user.id);
            axios.delete(`/api/users/cancel/${user.id}`).catch(() => {});
        } else if (!isFriend && !isIncoming) {
            sendRequest(user);
            axios.post(`/api/users/send-request/${user.id}`).catch(() => {});
        }
    };

    const handleAccept = () => {
        axios.post(`/api/users/accept/${user.id}`)
            .then(() => acceptRequest(user.id))
            .catch(err => console.error(err));
    };

    const handleReject = () => {
        axios.delete(`/api/users/reject/${user.id}`)
            .then(() => rejectRequest(user.id))
            .catch(err => console.error(err));
    };

    const handleRemoveFriend = () => {
    };

    return (
        <div className="mp-root">
            <div className="mp-header">
                <div className="mp-header-left">
                    <div className="mp-avatar">
                        {user.avatar
                            ? <img src={`/api/files/${user.avatar}`} alt="avatar" />
                            : <User size={52} />
                        }
                    </div>
                    <div className="mp-identity">
                        <span className="mp-nickname">{user.nickname}</span>

                        <div className="mp-action-row">
                            {/* Кнопка "Написать" */}
                            <button
                                className="mp-edit-btn"
                                onClick={() => navigate(`/messages/${user.id}`)}
                            >
                                <MessageCirclePlus size={15} />
                                <span className="mp-edit-btn-text">Написать</span>
                            </button>

                            {/* Кнопка дружбы */}
                            {isFriend ? (
                                <>
                                    <button className="mp-friend-btn mp-friend-btn--active">
                                        <Check size={15} />
                                        <span>Друзья</span>
                                    </button>
                                    <button
                                        className="mp-remove-btn"
                                        onClick={() => setConfirmRemove(true)}
                                        title="Удалить из друзей"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            ) : isIncoming ? (
                                <>
                                    <button className="mp-friend-btn mp-friend-btn--incoming" disabled>
                                        <Check size={15} />
                                        <span>Заявка получена</span>
                                    </button>
                                    <div className="mp-incoming-actions">
                                        <button className="mp-incoming-btn mp-incoming-btn--accept" onClick={handleAccept}>
                                            Принять
                                        </button>
                                        <button className="mp-incoming-btn mp-incoming-btn--reject" onClick={handleReject}>
                                            Отклонить
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    className={`mp-friend-btn${isOutgoing ? " mp-friend-btn--outgoing" : ""}`}
                                    onClick={handleFriendAction}
                                >
                                    {isOutgoing ? <X size={15} /> : <UserPlus size={15} />}
                                    <span>{isOutgoing ? "Отменить заявку" : "Добавить в друзья"}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mp-divider" />

            {/* Окно подтверждения удаления */}
            {confirmRemove && (
                <div className="mp-confirm-overlay" onClick={() => setConfirmRemove(false)}>
                    <div className="mp-confirm-card" onClick={e => e.stopPropagation()}>
                        <p className="mp-confirm-text">
                            Вы действительно хотите удалить <strong>{user.nickname}</strong> из друзей?
                        </p>
                        <div className="mp-confirm-actions">
                            <button className="mp-confirm-btn mp-confirm-btn--yes" onClick={handleRemoveFriend}>
                                Да
                            </button>
                            <button className="mp-confirm-btn mp-confirm-btn--no" onClick={() => setConfirmRemove(false)}>
                                Нет
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function EditModal({isOpen, onClose, title}) {
    const session = useSession();
    const setSession = useSetSession();
    const emailRef = useRef(null);
    const nicknameRef = useRef(null);
    const avatarRef = useRef(null);
    const [file, setFile] = useState(null);
    const [fileURL, setFileURL] = useState(null);
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleAvatarClick = (e) => {
        const file = e.target.files[0]
        if (!file) return;

        setFile(file)
        setFileURL(URL.createObjectURL(file))
        setError("")
    }

    const isValidEmail = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    const handleSend = () => {
        const nickname = nicknameRef.current.value.trim();
        const email = emailRef.current.value.trim();

        if (!nickname && !email && !file) {
            setError("Нет изменений");
            triggerShake();
            return;
        }

        if (email && !isValidEmail(email)) {
            setError("Невалидный email");
            triggerShake();
            return;
        }

        const fd = new FormData();

        if (nickname) fd.append('nickname', nickname);
        if (email) fd.append('email', email);
        if (file) fd.append('avatar', file);

        axios.post(`/api/users/edit`, fd)
            .then(({data}) => {
                setSession(prev => ({
                    ...prev,
                    ...(data.nickname && { nickname: data.nickname }),
                    ...(data.email && { email: data.email }),
                    ...(data.avatar && { avatar: data.avatar }),
                }));
                setError("");
            })
            .catch(err => {
                if (err.response) {
                    const status = err.response.status;
                    if (status === 409) {
                        setError("Пользователь уже существует");
                    } else {
                        setError("Ошибка обновления");
                    }
                } else if (err.request) {
                    setError("Нет ответа от сервера");
                } else {
                    setError("Ошибка отправки");
                }
                triggerShake();
            })
    }

    if (!isOpen) return null
    return (
        <div className="edit-modal-overlay"
             onClick={(e) => e.target === e.currentTarget && onClose(e)}>
            <div className={`edit-modal-content${shake ? " shake" : ""}`}
                 role="dialog"
                 aria-modal={true}
                 aria-labelledby="modal-title"
            >
                <div className="edit-modal-header">
                    <h2 className="edit-modal-title">{title}</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Закрыть">✕</button>
                </div>

                <div className="edit-modal-avatar-line">
                    <div className="edit-modal-avatar" onClick={() => avatarRef.current?.click()}>
                        {session.avatar || fileURL
                            ? <img src={fileURL ? fileURL : `/api/files/${session.avatar}`} alt="avatar" />
                            : <User size={52} />
                        }
                        <div className="edit-modal-avatar-overlay">
                            <FolderPlus size={32} />
                        </div>
                    </div>
                    <input
                        ref={avatarRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarClick}
                        hidden
                    />
                </div>

                <div className="edit-modal-nickname">
                    <div className="edit-modal-name">Имя</div>
                    <input ref={nicknameRef} className="edit-modal-nickname-input" placeholder={session.nickname} onChange={() => setError("")} />
                </div>

                <div className="edit-modal-nickname">
                    <div className="edit-modal-name">E-mail</div>
                    <input ref={emailRef} className="edit-modal-nickname-input" placeholder={session.email} onChange={() => setError("")} />
                </div>

                {error && <div className="edit-modal-error">{error}</div>}

                <div className="edit-modal-save" onClick={handleSend}>
                    <div className="edit-modal-save-button">Сохранить</div>
                </div>
            </div>
        </div>
    )

}


function MyUserProfile() {
    const session = useSession();
    const [requestsTab, setRequestsTab] = useState('incoming'); // null | 'incoming' | 'outgoing'
    const friends = useFriends()
    const incomingRequests = useIncomingRequests();
    const outgoingRequests = useOutgoingRequests()

    const [isOpen, setOpen] = useState(false);

    const nickname  = session.nickname;
    const email     = session.email;
    const AVATAR_SIZE = 180; // px — фиксированная ширина аватарки
    const GAP = 16;         // px — gap между карточками
    const friendsRowRef = useRef(null);
    const [maxVisible, setMaxVisible] = useState(6);

    useEffect(() => {
        const el = friendsRowRef.current;
        if (!el) return;
        const observer = new ResizeObserver(([entry]) => {
            const width = entry.contentRect.width;
            const count = Math.max(1, Math.floor((width + GAP) / (AVATAR_SIZE + GAP)));
            setMaxVisible(count);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handleSwitch = (tab) => {
        setRequestsTab(prev => prev === tab ? null : tab);
    };

    const activeRequests = requestsTab === 'incoming' ? incomingRequests : requestsTab === 'outgoing' ? outgoingRequests : [];

    return (
        <>
            <div className="mp-root">

                <div className="mp-header">
                    <div className="mp-header-left">
                        <div className="mp-avatar">
                            {session.avatar
                                ? <img src={`/api/files/${session.avatar}`} alt="avatar" />
                                : <User size={52} />
                            }
                        </div>
                        <div className="mp-identity">
                            <span className="mp-nickname">{nickname}</span>
                            <span className="mp-email">{email}</span>
                            <button className="mp-edit-btn" onClick={() => setOpen(true)}>
                                <Pencil size={20} />
                                <span className="mp-edit-btn-text">Редактировать</span>
                            </button>
                        </div>

                    </div>

                </div>

                <div className="mp-divider" />

                <div className="mp-section">
                    <div className="mp-section-header">
                        <span className="mp-section-title">Друзья</span>
                        <ChevronRight size={16} />
                        <span className="mp-section-count">{friends.length}</span>
                    </div>

                    {friends.length === 0 ? (
                        <p className="mp-empty">У вас пока нет друзей. Добавьте первого!</p>
                    ) : (
                        <div className="mp-friends-row" ref={friendsRowRef}>
                            {friends.slice(0, friends.length > 6 ? 5 : 6).map(f =>
                                <FriendCard key={f.id} friend={f} />)}
                            {friends.length > 6 && (
                                <div className="mp-friend-card mp-friend-more">
                                    <div className="mp-friend-avatar mp-friend-avatar--dots">
                                        <Ellipsis size={18} />
                                    </div>
                                    <span className="mp-friend-nick">Ещё</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mp-divider" />

                <div className="mp-section">
                    <div className="mp-section-header">
                        <span className="mp-section-title">Заявки в друзья</span>
                        <div className="mp-switch-group">
                            <button
                                className={`mp-switch-btn ${requestsTab === 'incoming' ? 'mp-switch-btn--active' : ''}`}
                                onClick={() => handleSwitch('incoming')}
                            >
                                Входящие
                                {incomingRequests.length > 0 && (
                                    <span className="mp-badge">{incomingRequests.length}</span>
                                )}
                            </button>
                            <button
                                className={`mp-switch-btn ${requestsTab === 'outgoing' ? 'mp-switch-btn--active' : ''}`}
                                onClick={() => handleSwitch('outgoing')}
                            >
                                Исходящие
                                {outgoingRequests.length > 0 && (
                                    <span className="mp-badge">{outgoingRequests.length}</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {requestsTab !== null && (
                        <div className="mp-requests-list">
                            {activeRequests.length === 0 ? (
                                <p className="mp-empty">
                                    {requestsTab === 'incoming' ? 'Нет входящих заявок' : 'Нет исходящих заявок'}
                                </p>
                            ) : (
                                activeRequests.map((req, i) => (
                                    <RequestCard key={i} req={req} type={requestsTab} />
                                ))
                            )}
                        </div>
                    )}
                </div>

            </div>

            <EditModal isOpen={isOpen} onClose={() => setOpen(false)} title="Редактировать профиль"/>
        </>
    );
}


export default function MyProfile({user}) {
    if (!user) {
        return <MyUserProfile/>
    }

    return <UserProfile user={user} />;
}