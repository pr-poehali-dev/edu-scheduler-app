-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    university VARCHAR(255),
    faculty VARCHAR(255),
    course VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по email
CREATE INDEX idx_users_email ON users(email);

-- Комментарии к таблице
COMMENT ON TABLE users IS 'Таблица пользователей приложения Studyfay';
COMMENT ON COLUMN users.email IS 'Email пользователя (уникальный)';
COMMENT ON COLUMN users.password_hash IS 'Хэш пароля (bcrypt)';
COMMENT ON COLUMN users.full_name IS 'Полное имя пользователя';
COMMENT ON COLUMN users.university IS 'Название университета';
COMMENT ON COLUMN users.faculty IS 'Факультет';
COMMENT ON COLUMN users.course IS 'Курс и группа';