import React from 'react';

const MenuButton = ({menuOpen, setMenuOpen}) => {
    return (
        <>
            <button
                type="button"
                aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
                onClick={() => setMenuOpen(p => !p)}
                style={{
                    display: "none",
                    position: "fixed",
                    top: "max(16px, env(safe-area-inset-top))",
                    left: "max(16px, env(safe-area-inset-left))",
                    zIndex: 200,
                    border: "none",
                    background: "rgba(0,0,0,0.35)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    color: "#6366f1",
                    fontSize: 20,
                    lineHeight: 1,
                }}
                className="menu-toggle"
            >
                ☰
            </button>

            {menuOpen && (
                <div
                    role="presentation"
                    onClick={() => setMenuOpen(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.55)",
                        zIndex: 140,
                    }}
                />
            )}
        </>)
};

export default MenuButton;