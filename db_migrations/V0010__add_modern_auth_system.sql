-- Добавляем поля для новой системы авторизации
ALTER TABLE t_p72971514_edu_scheduler_app.users 
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vk_id VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(50) UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Таблица для SMS-кодов
CREATE TABLE IF NOT EXISTS t_p72971514_edu_scheduler_app.sms_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON t_p72971514_edu_scheduler_app.sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_sms_codes_expires ON t_p72971514_edu_scheduler_app.sms_codes(expires_at);

-- Таблица для OAuth токенов
CREATE TABLE IF NOT EXISTS t_p72971514_edu_scheduler_app.oauth_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p72971514_edu_scheduler_app.users(id),
  provider VARCHAR(50) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON t_p72971514_edu_scheduler_app.oauth_tokens(user_id);