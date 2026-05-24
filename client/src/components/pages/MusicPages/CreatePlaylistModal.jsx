import React, {useEffect, useRef, useState} from 'react';
import {FolderPlus, ListMusic} from "lucide-react";
import axios from "axios";
import "./CreatePlaylistModal.css"

export function CreatePlaylistModal({isOpen, onClose, onCreated}) {
    const nameRef = useRef(null);
    const coverRef = useRef(null);
    const [file, setFile] = useState(null);
    const [fileURL, setFileURL] = useState(null);
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleCoverClick = (e) => {
        const f = e.target.files[0]
        if (!f) return;
        setFile(f)
        setFileURL(URL.createObjectURL(f))
        setError("")
    }

    const handleCreate = () => {
        const name = nameRef.current.value.trim();

        if (!name) {
            setError("Введите название плейлиста");
            triggerShake();
            return;
        }

        const fd = new FormData();
        fd.append('name', name);
        if (file) fd.append('cover', file);

        axios.post('/api/playlists', fd)
            .then(({data}) => {
                setError("");
                setFile(null);
                setFileURL(null);
                if (nameRef.current) nameRef.current.value = '';
                onCreated(data);
                onClose();
            })
            .catch(err => {
                if (err.response) {
                    setError(err.response.data?.error || "Ошибка создания");
                } else {
                    setError("Нет ответа от сервера");
                }
                triggerShake();
            })
    }

    if (!isOpen) return null

    return (
        <div className="cpm-overlay"
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`cpm-content${shake ? " shake" : ""}`}
                 role="dialog"
                 aria-modal={true}
                 aria-labelledby="cpm-title"
            >
                <div className="cpm-header">
                    <h2 className="cpm-title" id="cpm-title">Создать плейлист</h2>
                    <button className="cpm-close-btn" onClick={onClose} aria-label="Закрыть">✕</button>
                </div>

                <div className="cpm-cover-line">
                    <div className="cpm-cover" onClick={() => coverRef.current?.click()}>
                        {fileURL
                            ? <img src={fileURL} alt="cover" />
                            : <ListMusic size={64} color="#b4b2a9" />
                        }
                        <div className="cpm-cover-overlay">
                            <FolderPlus size={32} />
                        </div>
                    </div>
                    <input
                        ref={coverRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverClick}
                        hidden
                    />
                </div>

                <div className="cpm-field">
                    <div className="cpm-label">Название</div>
                    <input ref={nameRef} className="cpm-input" placeholder="Мой плейлист" onChange={() => setError("")} />
                </div>

                {error && <div className="cpm-error">{error}</div>}

                <div className="cpm-actions" onClick={handleCreate}>
                    <div className="cpm-create-button">Создать</div>
                </div>
            </div>
        </div>
    )
}