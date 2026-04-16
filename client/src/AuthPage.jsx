import { useState } from "react";
import "./css/auth.css";
import axios from "axios";

const USERS_KEY = "app_users";
const SESSION_KEY = "app_session";

// function saveUsers(users) {
//     localStorage.setItem(USERS_KEY, JSON.stringify(users));
// }

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
    const [sending, setSending] = useState(false);

    function setLocal(email) {
        const session = { email };
        console.log(session)
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        onAuth(session);
    }

    function register(regUserData) {
        setSending(true);

        axios.post("/api/users/reg", regUserData).then(
            () => setLocal(regUserData.email)
        ).catch(err => {
            if (err.response) {
                const status = err.response.status;

                if (status === 409) {
                    setError("Пользователь уже существует");
                    triggerShake();
                } else {
                    setError("Ошибка регистрации");
                    triggerShake()
                }
            } else if (err.request) {
                setError("Нет ответа от сервера");
                triggerShake();
            } else {
                setError("Ошибка отправки");
                triggerShake();
            }

            setSending(false);
        });
    }

    function authenticate(authUserData) {
        setSending(true);

        axios.post("/api/users/auth", authUserData).then(
            () => setLocal(authUserData.email)
        ).catch(err => {
            if (err.response) {
                setError("Неверный e-mail или пароль");
                triggerShake()
            } else if (err.request) {
                setError("Нет ответа от сервера");
                triggerShake();
            } else {
                setError("Ошибка отправки");
                triggerShake();
            }

            setSending(false);
        })
    }

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
        const {nickname, email, password, confirm } = form;

        if (!email.trim() || !password.trim() || (mode === "register" && !nickname.trim())) {
            setError("Заполните все поля");
            triggerShake();
            return;
        }

        // const users = getUsers();
        if (!isValidEmail(email)) {
            setError("Невалидный email");
            triggerShake();
            return;
        }

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

            // users[email] = { password };
            // saveUsers(users);
            register({
                password_hash: password.trim(),
                nickname: nickname.trim(),
                email: email.trim(),
            })
        } else {
            // const user = users[email];
            // if (!user || user.password !== password) {
            //     setError("Неверный логин или пароль");
            //     triggerShake();
            //     return;
            // }
            authenticate({
                password_hash: password.trim(),
                email: email.trim(),
            })
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

    return (
        <div className="auth-overlay">
            <div className={`auth-card${shake ? " shake" : ""}`}>

                {/* Header */}
                <div className="auth-header">
                    <div className="auth-logo">◆</div>
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
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Введите пароль"
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
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

                    <button className="auth-button" onClick={handleSubmit} disabled={sending}>
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
