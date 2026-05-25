import React, {useRef} from 'react';
import {useSession, useSetSession} from "../../AppContext";
import axios from "axios";
import {Image} from "react-bootstrap";

const Testpage = () => {
    const session = useSession();
    const setSession = useSetSession();

    const inputRef = useRef(null);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('avatar', file);

        axios.post('/api/users/edit', fd)
            .then(({data}) => setSession(prev => ({ ...prev, avatar: data.avatar })))
    };

    return (
        <>
            <Image
                src={session.avatar ? `/api/files/${session.avatar}` : '/default-avatar.png'}
                alt="avatar"
                style={{ cursor: 'pointer', width: 150, height: 150, borderRadius: '50%', objectFit: 'cover' }}
                onClick={() => inputRef.current?.click()}
            />
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleUpload}
            />
        </>
    );
};

export default Testpage;