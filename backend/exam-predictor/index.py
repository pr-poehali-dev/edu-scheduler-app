"""API для прогнозирования экзаменационных вопросов на основе материалов студента"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt
from openai import OpenAI


def get_db_connection():
    """Создаёт подключение к PostgreSQL базе данных"""
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn


def verify_token(token: str) -> dict:
    """Проверяет JWT токен и возвращает payload"""
    secret = os.environ['JWT_SECRET']
    try:
        return jwt.decode(token, secret, algorithms=['HS256'])
    except:
        return None


def analyze_materials_with_deepseek(materials: list, past_exams: str = None) -> dict:
    """Анализирует материалы студента и генерирует прогноз вопросов через DeepSeek"""
    deepseek_key = os.environ.get('DEEPSEEK_API_KEY')
    
    if not deepseek_key:
        raise ValueError("Требуется DEEPSEEK_API_KEY для анализа материалов")
    
    client = OpenAI(
        api_key=deepseek_key,
        base_url="https://api.deepseek.com"
    )
    
    # Собираем весь текст из материалов
    all_text = "\n\n".join([
        f"=== {m['title']} ({m['subject']}) ===\n{m['recognized_text'] or ''}\n{m['summary'] or ''}"
        for m in materials
    ])
    
    past_exams_section = f"\n\n=== ПРОШЛОГОДНИЕ БИЛЕТЫ ===\n{past_exams}" if past_exams else ""
    
    prompt = f"""Ты — AI-ассистент для подготовки к экзамену. Проанализируй учебные материалы студента и спрогнозируй вопросы на экзамене.

МАТЕРИАЛЫ СТУДЕНТА:
{all_text}
{past_exams_section}

ЗАДАЧА:
1. Определи ключевые темы и концепции из материалов
2. Если есть прошлогодние билеты — учти паттерны (какие темы повторяются, стиль вопросов)
3. Выдели, что преподаватель подчёркивал (повторяющиеся темы, акценты)
4. Сгенерируй 20 наиболее вероятных экзаменационных вопросов с вероятностью и готовыми ответами
5. Создай план подготовки на 3 дня

ВАЖНО:
- Вопросы должны быть реалистичными для экзамена (не слишком простые, не слишком сложные)
- Ответы краткие (2-4 предложения), но содержательные
- План подготовки — конкретные действия по дням

Верни JSON в формате:
{{
  "subject": "Название предмета",
  "key_topics": ["Тема 1", "Тема 2", ...],
  "questions": [
    {{
      "question": "Текст вопроса",
      "probability": 95,
      "answer": "Краткий ответ на вопрос",
      "topics": ["Тема 1", "Тема 2"],
      "difficulty": "medium"
    }},
    ...
  ],
  "study_plan": {{
    "day_1": {{
      "focus": "Темы высокого приоритета",
      "tasks": ["Задача 1", "Задача 2"],
      "topics": ["Тема 1", "Тема 2"]
    }},
    "day_2": {{...}},
    "day_3": {{...}}
  }},
  "exam_tips": ["Совет 1", "Совет 2", "Совет 3"]
}}
"""
    
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=4000,
        temperature=0.7,
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    return result


def handler(event: dict, context) -> dict:
    """Обработчик запросов для прогнозирования экзаменационных вопросов"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    auth_header = event.get('headers', {}).get('X-Authorization', '')
    token = auth_header.replace('Bearer ', '')
    
    if not token:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Требуется авторизация'})
        }
    
    payload = verify_token(token)
    if not payload:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Недействительный токен'})
        }
    
    user_id = payload['user_id']
    
    # POST /predict - Создать прогноз вопросов
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        subject = body.get('subject', '').strip()
        material_ids = body.get('material_ids', [])
        past_exams = body.get('past_exams', '').strip()
        
        if not subject or not material_ids:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Укажите предмет и выберите материалы'})
            }
        
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Получаем материалы студента
                cur.execute("""
                    SELECT id, title, subject, recognized_text, summary
                    FROM materials
                    WHERE user_id = %s AND id = ANY(%s)
                """, (user_id, material_ids))
                
                materials = cur.fetchall()
                
                if not materials:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Материалы не найдены'})
                    }
                
                # Анализируем материалы через DeepSeek
                prediction = analyze_materials_with_deepseek(
                    [dict(m) for m in materials],
                    past_exams if past_exams else None
                )
                
                # Сохраняем прогноз в БД
                cur.execute("""
                    INSERT INTO exam_predictions (user_id, subject, material_ids, predicted_questions, study_plan, past_exams_text)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (
                    user_id,
                    subject,
                    material_ids,
                    json.dumps(prediction),
                    json.dumps(prediction.get('study_plan', {})),
                    past_exams if past_exams else None
                ))
                
                saved = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({
                        'prediction_id': saved['id'],
                        'prediction': prediction,
                        'created_at': str(saved['created_at'])
                    }, default=str)
                }
        finally:
            conn.close()
    
    # GET /predictions - Получить все прогнозы пользователя
    elif method == 'GET':
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, subject, material_ids, predicted_questions, study_plan, created_at
                    FROM exam_predictions
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                """, (user_id,))
                
                predictions = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'predictions': [dict(p) for p in predictions]
                    }, default=str)
                }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }
