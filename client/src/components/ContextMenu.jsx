import React, {useState, useEffect, useRef, createContext, useContext} from 'react';
import {useNavigate, useLocation, Routes, Route} from "react-router-dom";
import './ContextMenuStyle.css';
import {useFriends, useSession, useSocket} from "../AppContext";
import AddFriendModal from "./AddFriendModal";
import {ChevronRight, User, LogOut, Pencil, Plus, Ellipsis} from "lucide-react";
import {Image} from "react-bootstrap";

function ProfileModal({ session, onLogout, onClose, onAddFriend, anchorRect, ROUTES_PAGES }) {
    const overlayRef = useRef(null);
    const setMenuOpen = useContextMenu().setMenuOpen;
    const friends = useFriends()

    const navigate = useNavigate();

    const username  = session.nickname;
    const email     = session.email;

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    const cardStyle = anchorRect ? (() => {
        const vw = window.innerWidth;
        const gap = 12;
        const width = Math.min(Math.max(anchorRect.width, 260), vw - gap * 2);
        const left = Math.max(gap, Math.min(anchorRect.left, vw - width - gap));
        return {
            position: 'fixed',
            left,
            bottom: window.innerHeight - anchorRect.top + 8,
            width,
            maxWidth: `calc(100vw - ${gap * 2}px)`,
        };
    })() : {};

    return (
        <div className="pm-overlay pm-overlay--anchored" ref={overlayRef} onClick={handleOverlayClick}>
            <div className="pm-card" style={cardStyle}>

                <div className="pm-section">
                    <div className="pm-user-row">
                        <div className="pm-avatar-lg">
                            {session.avatar
                                ? <Image src={`/api/files/${session.avatar}`} alt="avatar" className="avatar-img" />
                                : <User size={30} />
                            }
                        </div>
                        <div className="pm-user-details">
                            <span className="pm-username">{username}</span>
                            <span className="pm-email">{email}</span>
                        </div>
                        <div className="to-profile" onClick={() => {
                            navigate("/me")
                            onClose()
                            setMenuOpen(false)
                        }}>
                            <ChevronRight size={20}/>
                        </div>
                    </div>
                    <button className="pm-pill-btn">
                        <Pencil size={14} />
                        Редактировать
                    </button>
                </div>

                <div className="pm-divider" />

                <div className="pm-section">
                    <div className="pm-friends-header">
                        <span className="pm-section-title">Друзья</span>
                        <ChevronRight size={15} />
                    </div>

                    {friends.length === 0 ? (
                        <p className="pm-no-friends">У вас пока нет друзей. Добавьте первого!</p>
                    ) : (
                        <div className="pm-friends-grid">
                            {friends.slice(0, friends.length > 6 ? 5 : 6).map(f => (
                                <div className="pm-friend-item" key={f.id}>
                                    <div className="pm-friend-avatar">
                                        {f.avatar
                                            ? <img src={`/api/files/${f.avatar}`} alt={f.nickname} className="avatar-img" />
                                            : <User size={16} />
                                        }
                                    </div>
                                    <span className="pm-friend-name">{f.nickname || "User"}</span>
                                </div>
                            ))}
                            {friends.length > 6 && (
                                <div className="pm-friend-item">
                                    <div className="pm-friend-avatar pm-friend-dots">
                                        <Ellipsis size={16} />
                                    </div>
                                    <span className="pm-friend-name">Ещё</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button className="pm-pill-btn" onClick={() => onAddFriend()}>
                        <Plus size={14} />
                        Добавить друга
                    </button>
                </div>

                <div className="pm-divider" />

                <div className="pm-section pm-section--logout">
                    <button className="pm-logout-wide" onClick={() => { onLogout(); onClose(); }}>
                        <LogOut size={16} />
                        Выйти
                    </button>
                </div>

            </div>
        </div>
    );
}

const ContextMenuContext = createContext(null)

const ContextMenuProvider = ({setProfileOpen, setMenuOpen, children }) => {
    return (
        <ContextMenuContext.Provider value={{setProfileOpen, setMenuOpen}}>
            {children}
        </ContextMenuContext.Provider>
    )
}

const useContextMenu = () => useContext(ContextMenuContext);

export default function ContextMenu({ PAGES, menuOpen, setMenuOpen, onLogout, ROUTES_PAGES }) {
    const socket  = useSocket();
    const session = useSession();
    const navigate = useNavigate();
    const location = useLocation();
    const [profileOpen, setProfileOpen] = useState(false);
    const [addFriendOpen, setAddFriendOpen] = useState(false);
    const panelRef = useRef(null);

    const username  = session?.nickname;

    const handleOpenProfile = () => {
        setProfileOpen(true);
    };

    return (
        <ContextMenuProvider setMenuOpen={setMenuOpen} setProfileOpen={setProfileOpen}>
            <aside className={`context-menu MainDiv ${menuOpen ? "open" : ""}`}>
                <div className="nav-buttons">
                    {PAGES.map(page => (
                        <button
                            className={`buttons${location.pathname.startsWith(page.navPath) ? " select" : ""}`}
                            key={page.id}
                            onClick={() => { navigate(page.navPath); setMenuOpen(false); }}
                        >
                            {page.label}
                        </button>
                    ))}
                </div>

                <div
                    ref={panelRef}
                    className="user-panel"
                    onClick={handleOpenProfile}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleOpenProfile()}
                >
                    <div className="user-info">
                        <div className="user-avatar">
                            {session.avatar
                                ? <img src={`/api/files/${session.avatar}`} alt="avatar" className="avatar-img" />
                                : <User size={22} />
                            }
                        </div>
                        <div className="user-text">
                            <span className="user-name">{username}</span>
                            <span className="user-plan">Free plan</span>
                        </div>
                    </div>
                    <button
                        className="logout-btn"
                        onClick={(e) => { e.stopPropagation(); onLogout(); }}
                        title="Выйти"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {profileOpen && (
                <ProfileModal
                    session={session}
                    onLogout={onLogout}
                    onClose={() => setProfileOpen(false)}
                    onAddFriend={() => { setProfileOpen(false); setAddFriendOpen(true); }}
                    anchorRect={panelRef.current?.getBoundingClientRect()}
                />
            )}

            {addFriendOpen && (
                <AddFriendModal onClose={() => setAddFriendOpen(false)} />
            )}
        </ContextMenuProvider>
    );
}