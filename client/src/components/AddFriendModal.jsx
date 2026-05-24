import React, { useState, useRef, useEffect } from 'react';
import { useFriends, useOutgoingRequests, useIncomingRequests, useFriendRequestActions } from "../AppContext";
import axios from 'axios';
import { Search, User, Plus, X, Check } from "lucide-react";
import {useNavigate} from "react-router-dom";

export default function AddFriendModal({ onClose }) {
    const navigate = useNavigate();
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
                        <X size={18} />
                    </button>
                </div>

                <div className="afm-search-wrap">
                    <Search size={18} />
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
                                btnContent = <><Check size={14} /> Друзья</>;
                                btnDisabled = true;
                            } else if (isIncoming) {
                                btnContent = <><Check size={14} /> Запрос получен</>;
                                btnDisabled = true;
                            } else if (isOutgoing) {
                                btnContent = <>Отменить</>;
                            } else {
                                btnContent = <><Plus size={14} /> Добавить</>;
                            }

                            return (
                                <div className="afm-user-row"
                                     key={user.id}
                                     onClick={() => {
                                         navigate(`/profile/${user.id}`)
                                         onClose()
                                     }}
                                >
                                    <div className="afm-user-avatar">
                                        {user.avatar
                                            ? <img src={`/api/files/${user.avatar}`} alt={user.nickname} className="avatar-img" />
                                            : <User size={18} />
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
