# Spotify Clone

Полнофункциональный клон Spotify — веб-приложение для стриминга музыки с каталогом релизов, плейлистами, социальными функциями и мгновенными сообщениями.

---

## Стек технологий

### Бэкенд
- **Node.js** + **Express 5** — серверная часть и REST API
- **PostgreSQL 16** — основная база данных
- **Redis** — кэширование, сессии стриминга, временные данные
- **Sequelize 7** (alpha) — ORM с декораторами (TypeScript-модели)
- **Socket.IO** — реалтайм-коммуникация (чат)
- **bcrypt** — хэширование паролей
- **jsonwebtoken (JWT)** — аутентификация через httpOnly cookie
- **Sharp** — обработка изображений (аватары)
- **music-metadata** — чтение метаданных аудиофайлов

### Фронтенд
- **React 19** + **React Router 7** — SPA с клиентским роутингом
- **Bootstrap 5** + **React-Bootstrap** — UI-компоненты
- **Lucide React** — иконки
- **Axios** — HTTP-клиент
- **Socket.IO Client** — подключение к WebSocket

### Инфраструктура
- **Docker** + **Docker Compose** — контейнеризация (PostgreSQL, Redis, Node API)
- **Node 22 Alpine** — базовый образ для сервера

---

## Структура проекта

```
spotify-clone/
├── client/                  # React-приложение (фронтенд)
│   ├── src/
│   │   ├── components/      # UI-компоненты и страницы
│   │   ├── classes/         # Player class
│   │   ├── hooks/           # Кастомные хуки
│   │   ├── services/        # Сервисный слой
│   │   └── css/             # Стили
│   └── package.json
├── controllers/             # Контроллеры (бизнес-логика)
├── models/                  # Модели Sequelize (TypeScript)
├── routers/                 # Маршруты Express API
├── helpers/                 # Вспомогательные утилиты
├── music/                   # Хранилище аудиофайлов и обложек
├── images/                  # Изображения
├── server.js                # Точка входа сервера
├── docker-compose.yaml
├── Dockerfile
└── .env
```

---

## Модели данных

| Модель | Описание |
|--------|----------|
| **User** | Пользователь (UUID, email, nickname, пароль, аватар) |
| **Artist** | Исполнитель (имя, аватар) |
| **Release** | Релиз (альбом/сингл/EP — тип, название, обложка, дата) |
| **Track** | Трек (ISRC, название, длительность, URI файла) |
| **Playlist** | Пользовательский плейлист |
| **Composition** | Композиция (связь с треками) |
| **Friendship** | Запросы дружбы между пользователями |
| **Chat / Message** | Чат и сообщения между пользователями |
| **StreamLog** | Журнал прослушиваний |

### Связи
- `User ↔ Track` — избранные треки (M2M: FavoriteTracks)
- `User ↔ Artist` — избранные исполнители (M2M: FavoriteArtists)
- `User ↔ Release` — избранные релизы (M2M: FavoriteReleases)
- `User ↔ Playlist` — избранные плейлисты (M2M: FavoritePlaylists)
- `User ↔ Playlist` — созданные плейлисты (1:M)
- `User ↔ Chat` — чаты пользователя (M2M: UserChats)
- `Release → Track` — треки релиза (1:M)
- `Artist ↔ Track` — исполнители трека (M2M: ArtistTrack)
- `Artist ↔ Release` — исполнители релиза (M2M: ArtistRelease)

---

## API Эндпоинты

### Авторизация
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/users/reg` | Регистрация |
| POST | `/api/users/auth` | Вход |
| POST | `/api/users/logout` | Выход |
| GET | `/api/users/me` | Текущий пользователь |
| PUT | `/api/users/me` | Редактирование профиля |

### Треки
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/tracks?token=` | Потоковая передача аудио (Range requests) |
| POST | `/api/tracks/token` | Получение токена стриминга |
| POST | `/api/tracks/position` | Сохранение позиции воспроизведения |
| POST | `/api/tracks/heartbeat` | Отчёт о прослушивании |

### Релизы и исполнители
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/releases/:id` | Детали релиза |
| GET | `/api/artists/:id` | Детали исполнителя |
| GET | `/api/artists/:id/releases` | Релизы исполнителя |
| GET | `/api/artists/:id/tracks` | Треки исполнителя |

### Плейлисты
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/playlists/:id` | Детали плейлиста |
| POST | `/api/playlists` | Создание плейлиста |
| POST | `/api/playlists/:id/tracks` | Добавление трека |
| DELETE | `/api/playlists/:id/tracks/:trackId` | Удаление трека |

### Избранное
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/users/me/tracks` | Избранные треки |
| POST | `/api/users/me/tracks/:trackId` | Добавить трек в избранное |
| DELETE | `/api/users/me/tracks/:trackId` | Убрать трек из избранного |
| GET | `/api/users/me/releases` | Избранные релизы |
| GET | `/api/users/me/artists` | Избранные исполнители |
| GET | `/api/users/me/playlists` | Избранные плейлисты |

### Социальное
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/users/search` | Поиск пользователей |
| POST | `/api/users/friends/:receiverId` | Отправить запрос дружбы |
| PUT | `/api/users/friends/accept/:senderId` | Принять запрос |
| DELETE | `/api/users/friends/reject/:senderId` | Отклонить запрос |
| DELETE | `/api/users/friends/cancel/:receiverId` | Отменить запрос |
| GET | `/api/users/me/chats` | Список чатов |
| GET | `/api/users/:id` | Профиль пользователя |

### Поиск
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/users/search?query=` | Трёхуровневый поиск (треки, артисты, релизы) с pg_trgm |

---

## Ключевые особенности

### Стриминг музыки
- Потоковая передача через **Range requests** (HTTP 206 Partial Content)
- Токенизированный доступ — для каждого воспроизведения создаётся одноразовый токен с TTL
- Хэширование fingerprint (IP + User-Agent + userId) для привязки сессии
- Отслеживание позиции воспроизведения — сохранение и восстановление последней позиции
- Подсчёт прослушиваний — зачёт при прослушивании ≥30 секунд или ≥70% длительности
- Защита от дублирования — cooldown и distributed lock через Redis

### Поиск
- Нормализация строк (транслитерация, нижний регистр)
- **pg_trgm** — триграммное сходство PostgreSQL для нечёткого поиска
- Параллельный поиск по трём сущностям: треки, артисты, релизы

### Пользователи и авторизация
- Регистрация / вход с валидацией
- JWT в httpOnly cookie (7 дней)
- Хэширование паролей bcrypt (12 раундов)
- Профиль пользователя с аватаром (загрузка и обрезка через Sharp)

### Плейлисты
- Создание пользовательских плейлистов
- Избранные плейлисты

### Друзья и сообщения
- Отправка / принятие / отклонение / отмена запросов дружбы
- Личные сообщения с поддержкой цитирования
- Выбор трека для отправки в чат (TrackPickerModal)

### Избранное
- Избранные треки, артисты, релизы и плейлисты
- Кэширование списков избранного в Redis (TTL 1 час)
- Индикация наличия в избранном при просмотре чужих профилей

---

## Переменные окружения (.env)

```env
IP_APP=http://localhost:3000
SERVER_PORT=8080
CLIENT_PORT=3000

DB_HOST=db
DB_NAME=database
DB_USER=root-db
DB_PASSWORD=your_password

SECRET_KEY=your_jwt_secret

REDIS_URL=redis://redis:6379
```

---

## Запуск

### Через Docker Compose

```bash
docker compose up --build
```

Сервер доступен на `http://localhost:8080`.

### Локальная разработка

**Сервер:**

```bash
npm install
npx tsx server.js
```

**Клиент:**

```bash
cd client
npm install
npm start
```

Клиент доступен на `http://localhost:3000`.