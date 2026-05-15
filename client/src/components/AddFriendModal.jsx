import React, { useState, useRef, useEffect } from 'react';
import { useFriends, useOutgoingRequests, useIncomingRequests, useFriendRequestActions } from "../AppContext";
import axios from 'axios';

function SearchIcon({ size = 18 }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function UserIcon({ size = 22 }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
    );
}

function AddIcon({ size = 14 }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    );
}

function CloseIcon({ size = 18 }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function CheckIcon({ size = 14 }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

export default function AddFriendModal({ onClose }) {
    const overlayRef = useRef(null);
    const inputRef = useRef(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const friends = useFriends();
    const outgoingRequests = useOutgoingRequests();
    const incomingRequests = useIncomingRequests();
    const { sendRequest, cancelRequest } = useFriendRequestActions();

    const friendIds = new Set(friends?.map(f => f.id) || []);
    const outgoingIds = new Set(outgoingRequests?.map(r => r.id) || []);
    const incomingIds = new Set(incomingRequests?.map(r => r.id) || []);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            setLoading(true);
            axios.post('/api/users/get-users', { nickname: query.trim() })
                .then(res => setResults(res.data || []))
                .catch(() => setResults([]))
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleAction = (user) => {
        const isOutgoing = outgoingIds.has(user.id);

        if (isOutgoing) {
            cancelRequest(user.id);
            axios.delete(`/api/users/cancel/${user.id}`).catch(() => {});
        } else {
            sendRequest(user);
            axios.post(`/api/users/send-request/${user.id}`).catch(() => {});
        }
    };

    return (
        <div className="pm-overlay" ref={overlayRef} onClick={handleOverlayClick}>
            <div className="afm-card">
                <div className="afm-header">
                    <h2 className="afm-title">Добавить друга</h2>
                    <button className="afm-close-btn" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                <div className="afm-search-wrap">
                    <SearchIcon />
                    <input
                        ref={inputRef}
                        className="afm-search-input"
                        type="text"
                        placeholder="Введите никнейм..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                <div className="afm-results">
                    {loading ? (
                        <p className="afm-status">Поиск...</p>
                    ) : results.length === 0 && query.trim() ? (
                        <p className="afm-status">Пользователи не найдены</p>
                    ) : (
                        results.map(user => {
                            const isFriend = friendIds.has(user.id);
                            const isOutgoing = outgoingIds.has(user.id);
                            const isIncoming = incomingIds.has(user.id);

                            let btnContent;
                            let btnDisabled = false;
                            let btnAction = () => handleAction(user);

                            if (isFriend) {
                                btnContent = <><CheckIcon /> Друзья</>;
                                btnDisabled = true;
                            } else if (isIncoming) {
                                btnContent = <><CheckIcon /> Запрос получен</>;
                                btnDisabled = true;
                            } else if (isOutgoing) {
                                btnContent = <>Отменить</>;
                            } else {
                                btnContent = <><AddIcon /> Добавить</>;
                            }

                            return (
                                <div className="afm-user-row" key={user.id}>
                                    <div className="afm-user-avatar">
                                        {user.avatar
                                            ? <img src={user.avatar} alt={user.nickname} className="avatar-img" />
                                            : <UserIcon size={18} />
                                        }
                                    </div>
                                    <span className="afm-user-name">{user.nickname}</span>
                                    <button
                                        className={`afm-action-btn ${btnDisabled ? 'afm-action-btn--disabled' : ''}`}
                                        disabled={btnDisabled}
                                        onClick={btnAction}
                                    >
                                        {btnContent}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
