import React, {useState, useRef, useEffect} from 'react';
import {
    useFriendRequestActions,
    useFriends,
    useIncomingRequests,
    useOutgoingRequests,
    useSession
} from '../../AppContext';
import {useNavigate, useLocation, Routes, Route, useParams} from "react-router-dom";
import './MyProfile.css';
import axios from "axios";
import {LoadingPage} from "./LoadingPage";


function UserIcon({ size = 40 }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
             strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    );
}

function PencilIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

function DotsIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
             strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

/* ── Friend Card ── */
function FriendCard({ friend }) {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate(`/profile/${friend.id}`)} className="mp-friend-card">
            <div className="mp-friend-avatar">
                {friend.avatar
                    ? <img src={friend.avatar} alt={friend.nickname} />
                    : <UserIcon size={24} />
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
                    ? <img src={req.avatar} alt={req.nickname} />
                    : <UserIcon size={20} />
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
                        <CheckIcon />
                    </button>
                    <button
                        className="mp-req-btn mp-req-btn--decline"
                        onClick={() => {
                            axios.delete(`/api/users/reject/${req.id}`)
                                .then(() => rejectRequest(req.id))
                                .catch(err => console.error(err));
                        }}
                    >
                        <XIcon />
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
                        <XIcon />Отменить
                    </button>
                </div>
            )}
        </div>
    );
}

export function UserProfile() {
    const { id } = useParams()
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`/api/users/${id}`)
        .then(res => setUser(res.data))
        .catch(() => setError("loadError"))
        .finally(() => setLoading(false))
    }, [id])

    if (loading) return <LoadingPage/>;

    if (error) return (
        <div>{error}</div>
    )

    if (user) {
        return (
            <div>{user.nickname}</div>
        )
    }
}

/* ── Main Component ── */
function MyUserProfile() {
    const session = useSession();
    const [requestsTab, setRequestsTab] = useState('incoming'); // null | 'incoming' | 'outgoing'
    const friends = useFriends()
    const incomingRequests = useIncomingRequests();
    const outgoingRequests = useOutgoingRequests()

    const navigate = useNavigate();

    const nickname  = session.nickname;
    const email     = session.email;
    const avatarUrl = session.avatar;
    const AVATAR_SIZE = 80; // px — фиксированная ширина аватарки
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

    const activeRequests = requestsTab === 'incoming' ? incomingRequests
                         : requestsTab === 'outgoing' ? outgoingRequests
                         : [];

    return (
        <div className="mp-root">

            <div className="mp-header">
                <div className="mp-header-left">
                    <div className="mp-avatar">
                        {avatarUrl
                            ? <img src={avatarUrl} />
                            : <UserIcon size={52} />
                        }
                    </div>
                    <div className="mp-identity">
                        <span className="mp-nickname">{nickname}</span>
                        <span className="mp-email">{email}</span>
                        <button className="mp-edit-btn">
                            <PencilIcon />
                            Редактировать
                        </button>
                    </div>
                </div>

            </div>

            <div className="mp-divider" />

            <div className="mp-section">
                <div className="mp-section-header">
                    <span className="mp-section-title">Друзья</span>
                    <ChevronRightIcon />
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
                                    <DotsIcon />
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

export default function MyProfile({user}) {
    if (!user) {
        return <MyUserProfile/>
    }

    return <UserProfile user={user} />;
}
