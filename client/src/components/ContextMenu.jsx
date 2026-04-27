import React from 'react';
import ContextMenuStyle from './ContextMenuStyle.css';

export default function ContextMenu({PAGES, activePage, setActivePage, menuOpen, setMenuOpen}) {
    return (
        <aside className={`context-menu MainDiv ${menuOpen ? "open" : ""}`}>
            {PAGES.map(page => (
                <button className={`buttons${activePage === page.id ? " select" : ""}`}
                        key={page.id}
                        onClick={() => {setActivePage(page.id); setMenuOpen(false)}}>
                    {page.label}
                </button>
            ))}
        </aside>
    );
}
