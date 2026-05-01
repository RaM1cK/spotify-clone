import React from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import './ContextMenuStyle.css';

export default function ContextMenu({ PAGES, menuOpen, setMenuOpen }) {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <aside className={`context-menu MainDiv ${menuOpen ? "open" : ""}`}>
            {PAGES.map(page => (
                <button
                    className={`buttons${location.pathname.startsWith(page.navPath) ? " select" : ""}`}
                    key={page.id}
                    onClick={() => {
                        navigate(page.navPath);
                        setMenuOpen(false);
                    }}
                >
                    {page.label}
                </button>
            ))}
        </aside>
    );
}