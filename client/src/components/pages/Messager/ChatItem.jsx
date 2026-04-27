import React from "react";

const ChatItem = ({ chat, isActive, onClick }) => {
    return (
        <div
            className={`messages-chat-item ${isActive ? "active" : ""}`}
            onClick={onClick}
        >
            <div className="messages-avatar">{chat.avatar}</div>
            <div className="messages-chat-info">
                <div className="messages-chat-top">
                    <span className="messages-chat-name">{chat.name}</span>
                    <span className="messages-chat-time">{chat.time}</span>
                </div>
                <div className="messages-chat-bottom">
                    <span className="messages-chat-last">{chat.lastMessage}</span>
                    {chat.unread > 0 && (
                        <span className="messages-unread">{chat.unread}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatItem;