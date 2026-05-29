import React, { useEffect, useState } from "react";
import axios from "axios";
import TrackList from "../../UI/TrackList/TrackList";
import { LoadingPage } from "../LoadingPage";
import { TrendingUp, Flame } from "lucide-react";
import "./ChartsPage.css";

const ChartsPage = ({ setCurrentTrack }) => {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('/api/users/me/favoriteTracks')
            .then(res => setTracks(res.data))
            .catch(() => setError('Ошибка загрузки треков'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <LoadingPage />;

    return (
        <div className="charts-root">
            <div className="charts-hero">
                <div className="charts-hero__glow" />
                <div className="charts-hero__content">
                    <div className="charts-hero__label">
                        <Flame size={14} />
                        <span>Еженедельный рейтинг</span>
                    </div>
                    <h1 className="charts-hero__title">Популярно</h1>
                    <p className="charts-hero__sub">
                        {tracks.length} {getNoun(tracks.length)} · обновлено сегодня
                    </p>
                </div>
                <TrendingUp size={96} className="charts-hero__icon" strokeWidth={1} />
            </div>

            <div className="charts-body">
                {error ? (
                    <p className="charts-error">{error}</p>
                ) : tracks.length === 0 ? (
                    <p className="charts-empty">Нет треков для отображения</p>
                ) : (
                    <TrackList
                        tracks={tracks}
                        setCurrentTrack={setCurrentTrack}
                        differences={tracks.map((_, i) => {
                            const vals = [1, -1, 0, 3, 1, -1, -3, 0, 2];
                            return vals[i % vals.length];
                        })}
                    />
                )}
            </div>
        </div>
    );
};

const getNoun = (n) => {
    const l2 = n % 100, l = n % 10;
    if (l2 >= 11 && l2 <= 14) return "треков";
    if (l === 1) return "трек";
    if (l >= 2 && l <= 4) return "трека";
    return "треков";
};

export default ChartsPage;