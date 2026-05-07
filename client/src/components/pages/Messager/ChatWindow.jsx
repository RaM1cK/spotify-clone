import React, {useState} from "react";
import { Music } from "lucide-react";
import TrackMessage from "./TrackMessage";
import {useSession} from "../../../AppContext";

const ChatWindow = ({ activeChat, input, setInput, handleSend,
                        // tracks, onOpenAlbum
}) => {
    const [showTrackPicker, setShowTrackPicker] = useState(false);
    const session = useSession();

    if (!activeChat) {
        return (
            <div className="messages-chat">
                <div className="messages-empty">
                    <span>Выберите, кому хотите написать</span>
                </div>
            </div>
        );
    }

    return (
        <div className="messages-chat">
            <div className="messages-chat-header">
                <div className="messages-avatar">{activeChat.avatar}</div>
                <span className="messages-chat-name">{activeChat.name}</span>
            </div>

            <div className="messages-body">
                {activeChat.messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`messages-bubble ${msg.senderId === session.id ? "me" : "them"}`}
                    >
                        {/*{msg.track ? (*/}
                        {/*    <TrackMessage*/}
                        {/*        track={msg.track}*/}
                        {/*        onOpenAlbum={onOpenAlbum}*/}
                        {/*    />*/}
                        {/*) : (*/}
                        {/*    */}
                            <span className="messages-bubble__text">{msg.data}</span>
                        {/*)}*/}
                        <span className="messages-bubble__time">{
                            new Date(msg.createdAt)
                                .toLocaleTimeString(navigator.language, {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                        </span>
                    </div>
                ))}
            </div>

            {/*{showTrackPicker && (*/}
            {/*    <div className="track-picker">*/}
            {/*        {tracks.map((track) => (*/}
            {/*            <div*/}
            {/*                key={track.id}*/}
            {/*                className="track-picker__item"*/}
            {/*                onClick={() => {*/}
            {/*                    handleSend(null, track);*/}
            {/*                    setShowTrackPicker(false);*/}
            {/*                }}*/}
            {/*            >*/}
            {/*                <img className="track-picker__img" src={track.img} alt={track.name} />*/}
            {/*                <div>*/}
            {/*                    <div className="track-picker__name">{track.name}</div>*/}
            {/*                    <div className="track-picker__artist">{track.creator}</div>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        ))}*/}
            {/*    </div>*/}
            {/*)}*/}

            <div className="messages-input-row">
                <button
                    className="messages-attach-btn"
                    onClick={() => setShowTrackPicker((v) => !v)}
                >
                    <Music size={18} />
                </button>

                <textarea
                    className="messages-input"
                    placeholder="Написать сообщение..."
                    value={input}
                    rows={1}
                    onChange={(e) => setInput(e.target.value)}
                    onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <button className="messages-send-btn" onClick={() => handleSend()}>
                    →
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;