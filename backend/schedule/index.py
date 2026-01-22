"""API для работы с расписанием и задачами студента"""

import json
import os
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt


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


def handler(event: dict, context) -> dict:
    """Обработчик запросов для расписания и задач"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    path = event.get('queryStringParameters', {}).get('path', '')
    
    conn = get_db_connection()
    
    try:
        # GET /schedule - Получить расписание
        if method == 'GET' and path == 'schedule':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, subject, type, start_time, end_time, day_of_week, room, teacher, color
                    FROM schedule
                    WHERE user_id = %s
                    ORDER BY day_of_week, start_time
                """, (user_id,))
                
                schedule = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'schedule': [dict(s) for s in schedule]}, default=str)
                }
        
        # POST /schedule - Добавить занятие
        elif method == 'POST' and path == 'schedule':
            body = json.loads(event.get('body', '{}'))
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO schedule (user_id, subject, type, start_time, end_time, day_of_week, room, teacher, color)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id, subject, type, start_time, end_time, day_of_week, room, teacher, color
                """, (
                    user_id,
                    body.get('subject'),
                    body.get('type'),
                    body.get('start_time'),
                    body.get('end_time'),
                    body.get('day_of_week'),
                    body.get('room'),
                    body.get('teacher'),
                    body.get('color', 'bg-purple-500')
                ))
                
                lesson = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({'lesson': dict(lesson)}, default=str)
                }
        
        # DELETE /schedule - Удалить занятие
        elif method == 'DELETE' and path == 'schedule':
            lesson_id = event.get('queryStringParameters', {}).get('id')
            
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM schedule
                    WHERE id = %s AND user_id = %s
                """, (lesson_id, user_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Занятие удалено'})
                }
        
        # GET /tasks - Получить задачи
        elif method == 'GET' and path == 'tasks':
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, title, description, subject, deadline, priority, completed, created_at
                    FROM tasks
                    WHERE user_id = %s
                    ORDER BY completed ASC, deadline ASC NULLS LAST, created_at DESC
                """, (user_id,))
                
                tasks = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'tasks': [dict(t) for t in tasks]}, default=str)
                }
        
        # POST /tasks - Создать задачу
        elif method == 'POST' and path == 'tasks':
            body = json.loads(event.get('body', '{}'))
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    INSERT INTO tasks (user_id, title, description, subject, deadline, priority)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, title, description, subject, deadline, priority, completed, created_at
                """, (
                    user_id,
                    body.get('title'),
                    body.get('description'),
                    body.get('subject'),
                    body.get('deadline'),
                    body.get('priority', 'medium')
                ))
                
                task = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 201,
                    'headers': headers,
                    'body': json.dumps({'task': dict(task)}, default=str)
                }
        
        # PUT /tasks - Обновить задачу
        elif method == 'PUT' and path == 'tasks':
            body = json.loads(event.get('body', '{}'))
            task_id = body.get('id')
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    UPDATE tasks
                    SET title = %s, description = %s, subject = %s, deadline = %s, 
                        priority = %s, completed = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND user_id = %s
                    RETURNING id, title, description, subject, deadline, priority, completed, created_at
                """, (
                    body.get('title'),
                    body.get('description'),
                    body.get('subject'),
                    body.get('deadline'),
                    body.get('priority'),
                    body.get('completed'),
                    task_id,
                    user_id
                ))
                
                task = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'task': dict(task)}, default=str)
                }
        
        # DELETE /tasks - Удалить задачу
        elif method == 'DELETE' and path == 'tasks':
            task_id = event.get('queryStringParameters', {}).get('id')
            
            with conn.cursor() as cur:
                cur.execute("""
                    DELETE FROM tasks
                    WHERE id = %s AND user_id = %s
                """, (task_id, user_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'Задача удалена'})
                }
        
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({'error': 'Маршрут не найден'})
        }
        
    finally:
        conn.close()
