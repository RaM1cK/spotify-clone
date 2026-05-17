import React, {useState, useRef, useEffect} from 'react';
import {
    useFriendRequestActions,
    useFriends,
    useIncomingRequests,
    useOutgoingRequests,
    useSession
} from '../../AppContext';
import './MyProfile.css';
import axios from "axios";
import { User, Pencil, ChevronRight, Ellipsis, Check, X } from "lucide-react";

/* ── Friend Card ── */
function FriendCard({ friend }) {
    return (
        <div className="mp-friend-card">
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

/* ── Main Component ── */
export default function MyProfile() {
    const session = useSession();
    const [requestsTab, setRequestsTab] = useState('incoming'); // null | 'incoming' | 'outgoing'
    const friends = useFriends()
    const incomingRequests = useIncomingRequests();
    const outgoingRequests = useOutgoingRequests()

    const nickname  = session.nickname;
    const email     = session.email;
    const avatarUrl = session.avatar ? `/api/files/${session?.avatar}` : null
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
        <div className="mp-root">

            <div className="mp-header">
                <div className="mp-header-left">
                    <div className="mp-avatar">
                        {avatarUrl
                            ? <img src={avatarUrl} alt="avatar" />
                            : <User size={52} />
                        }
                    </div>
                    <div className="mp-identity">
                        <span className="mp-nickname">{nickname}</span>
                        <span className="mp-email">{email}</span>
                    </div>
                </div>
                <button className="mp-edit-btn">
                    <Pencil size={15} />
                    <span className="mp-edit-btn-text">Редактировать</span>
                </button>
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
    );
}
