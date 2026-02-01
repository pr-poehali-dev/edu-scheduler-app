-- Добавление пробного периода для новых пользователей
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_trial_used BOOLEAN DEFAULT FALSE;

-- Даем 7 дней триала всем новым пользователям (которые зарегистрировались недавно и еще не использовали триал)
UPDATE users 
SET trial_ends_at = created_at + INTERVAL '7 days',
    is_trial_used = FALSE
WHERE subscription_type IS NULL 
  AND trial_ends_at IS NULL
  AND created_at > NOW() - INTERVAL '30 days';

COMMENT ON COLUMN users.trial_ends_at IS 'Дата окончания пробного периода (7 дней с регистрации)';
COMMENT ON COLUMN users.is_trial_used IS 'Был ли использован пробный период';