import React from 'react';

const MenuButton = ({menuOpen, setMenuOpen}) => {
    return (
        <>
            <button
                onClick={() => setMenuOpen(p => !p)}
                style={{
                    display: "none",
                    position: "fixed", top: 16, left: 16, zIndex: 200,
                    border: "none",
                    background: "transparent",
                    color: "#6366f1",
                }}
                className="menu-toggle"
            >
                ☰
            </button>

            {menuOpen && (
                <div
                    onClick={() => setMenuOpen(false)}
                    style={{
                        position: "fixed", inset: 0,
                        background: "rgba(0,0,0,0.9)", zIndex: 100,
                    }}
                />
            )}
        </>)
};

export default MenuButton;