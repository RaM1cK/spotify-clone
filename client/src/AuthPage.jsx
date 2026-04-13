import { useState } from "react";
import "./css/auth.css";

const USERS_KEY = "app_users";
const SESSION_KEY = "app_session";

function getUsers() {
    try {
        console.log(localStorage.getItem(USERS_KEY));
        return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch {
        return {};
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

export default function AuthPage({ onAuth }) {
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({nickname: "" , email: "", password: "", confirm: "" });
    const [error, setError] = useState("");
    const [shake, setShake] = useState(false);

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
        setError("");
    };

    const isValidEmail = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    }

    const handleSubmit = () => {
        const {nickname , email, password, confirm } = form;

        if (!email.trim() || !password.trim() || (mode === "register" && !nickname.trim())) {
            setError("Заполните все поля");
            triggerShake();
            return;
        }

        const users = getUsers();

        if (mode === "register") {
            if (password !== confirm) {
                setError("Пароли не совпадают");
                triggerShake();
                return;
            }
            if (password.length < 6) {
                setError("Пароль — минимум 6 символов");
                triggerShake();
                return;
            }
            if (users[email]) {
                setError("Пользователь уже существует");
                triggerShake();
                return;
            }
            if (!isValidEmail(email)) {
                setError("Некорректный e-mail");
                triggerShake();
                return;
            }

            users[email] = { password };
            saveUsers(users);
            const session = { email };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            onAuth(session);
        } else {
            const user = users[email];
            if (!user || user.password !== password) {
                setError("Неверный логин или пароль");
                triggerShake();
                return;
            }
            const session = { email };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            onAuth(session);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit();
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setForm({nickname: form.nickname , email: form.email, password: form.password, confirm: "" });
        setError("");
    };

    const [show, setShow] = useState(false);

    //Кнопки просмотра пароля
    const EyeIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    );

    const EyeOffIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20
             c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4
             c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );

    return (
        <div className="auth-overlay">
            <div className={`auth-card${shake ? " shake" : ""}`}>

                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">Spotify Clone</div>
                    <h1 className="auth-title">
                        {mode === "login" ? "Добро пожаловать" : "Создать аккаунт"}
                    </h1>
                    <p className="auth-subtitle">
                        {mode === "login"
                            ? "Войдите, чтобы продолжить"
                            : "Заполните данные для регистрации"}
                    </p>
                </div>

                {/* Tabs */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab${mode === "login" ? " active" : ""}`}
                        onClick={() => switchMode("login")}
                    >
                        Вход
                    </button>
                    <button
                        className={`auth-tab${mode === "register" ? " active" : ""}`}
                        onClick={() => switchMode("register")}
                    >
                        Регистрация
                    </button>
                </div>

                {/* Fields */}
                <div className="auth-fields">
                    {mode === "register" && (
                        <div className="auth-field-group">
                            <label className="auth-label">Псевдоним</label>
                            <input
                                className="auth-input"
                                name="nickname"
                                type="text"
                                value={form.nickname}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Введите псевдоним"
                                autoComplete="off"
                            />
                        </div>
                    )}

                    <div className="auth-field-group">
                        <label className="auth-label">E-mail</label>
                        <input
                            className="auth-input"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Введите e-mail"
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-field-group">
                        <label className="auth-label">Пароль</label>
                        <input
                            className="auth-input"
                            name="password"
                            type={show ? 'text' : 'password'}
                            value={form.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Введите пароль"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                            />
                        <button
                            type="button"
                            onClick={() => setShow(s => !s)}
                            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
                            style={{
                                position: 'absolute', right: '8px', top: '50%',
                                transform: 'translateY(-10%)',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#d4d4d4'
                            }}
                        >
                            {show ? <EyeOffIcon /> : <EyeIcon/>}
                        </button>
                    </div>

                    {mode === "register" && (
                        <div className="auth-field-group">
                            <label className="auth-label">Подтверждение пароля</label>
                            <input
                                className="auth-input"
                                name="confirm"
                                type="password"
                                value={form.confirm}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Повторите пароль"
                                autoComplete="new-password"
                            />
                        </div>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    <button className="auth-button" onClick={handleSubmit}>
                        {mode === "login" ? "Войти" : "Зарегистрироваться"}
                    </button>
                </div>

                {/* Footer */}
                <p className="auth-footer">
                    {mode === "login" ? "Нет аккаунта? " : "Уже есть аккаунт? "}
                    <span
                        className="auth-link"
                        onClick={() => switchMode(mode === "login" ? "register" : "login")}
                    >
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </span>
                </p>
            </div>
        </div>
    );
}
