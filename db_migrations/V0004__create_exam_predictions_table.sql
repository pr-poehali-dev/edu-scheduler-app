-- Таблица для хранения прогнозов экзаменационных вопросов
CREATE TABLE exam_predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    subject VARCHAR(200) NOT NULL,
    material_ids INTEGER[] NOT NULL,
    predicted_questions JSONB NOT NULL,
    study_plan JSONB,
    past_exams_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_predictions_user_id ON exam_predictions(user_id);
CREATE INDEX idx_exam_predictions_subject ON exam_predictions(subject);
CREATE INDEX idx_exam_predictions_created_at ON exam_predictions(created_at DESC);