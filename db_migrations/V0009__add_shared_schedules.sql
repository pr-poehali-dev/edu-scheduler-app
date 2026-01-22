-- Таблица для расшаренных расписаний
CREATE TABLE IF NOT EXISTS t_p72971514_edu_scheduler_app.shared_schedules (
    id SERIAL PRIMARY KEY,
    owner_user_id INTEGER NOT NULL REFERENCES t_p72971514_edu_scheduler_app.users(id),
    share_code VARCHAR(10) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shared_schedules_owner ON t_p72971514_edu_scheduler_app.shared_schedules(owner_user_id);
CREATE INDEX idx_shared_schedules_code ON t_p72971514_edu_scheduler_app.shared_schedules(share_code);

-- Таблица для подписчиков расшаренного расписания
CREATE TABLE IF NOT EXISTS t_p72971514_edu_scheduler_app.schedule_subscribers (
    id SERIAL PRIMARY KEY,
    shared_schedule_id INTEGER NOT NULL REFERENCES t_p72971514_edu_scheduler_app.shared_schedules(id),
    user_id INTEGER NOT NULL REFERENCES t_p72971514_edu_scheduler_app.users(id),
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shared_schedule_id, user_id)
);

CREATE INDEX idx_schedule_subscribers_user ON t_p72971514_edu_scheduler_app.schedule_subscribers(user_id);
