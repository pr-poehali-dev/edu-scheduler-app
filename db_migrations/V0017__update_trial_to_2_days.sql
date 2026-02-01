-- Обновляем комментарии и сокращаем триал до 2 дней
COMMENT ON COLUMN users.trial_ends_at IS 'Дата окончания пробного периода (2 дня с регистрации)';

-- Обновляем существующих пользователей с активным триалом на 2 дня
UPDATE users 
SET trial_ends_at = created_at + INTERVAL '2 days'
WHERE trial_ends_at IS NOT NULL 
  AND is_trial_used = FALSE
  AND trial_ends_at > NOW();
