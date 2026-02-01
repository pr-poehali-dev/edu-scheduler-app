-- Добавляем колонку для персонального лимита токенов (покупка допов)
ALTER TABLE t_p72971514_edu_scheduler_app.users 
ADD COLUMN IF NOT EXISTS ai_tokens_limit INTEGER DEFAULT 50000;

COMMENT ON COLUMN t_p72971514_edu_scheduler_app.users.ai_tokens_limit IS 'Персональный лимит токенов в месяц (50000 по умолчанию + докупленные пакеты)';