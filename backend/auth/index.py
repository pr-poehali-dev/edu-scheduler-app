"""API для аутентификации пользователей: регистрация, вход, проверка токена"""

import json
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor


def get_db_connection():
    """Создаёт подключение к PostgreSQL базе данных"""
    dsn = os.environ['DATABASE_URL']
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    conn = psycopg2.connect(dsn, options=f'-c search_path={schema}')
    return conn


def generate_token(user_id: int, email: str) -> str:
    """Генерирует JWT токен для пользователя"""
    secret = os.environ['JWT_SECRET']
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, secret, algorithm='HS256')


def verify_token(token: str) -> dict:
    """Проверяет JWT токен и возвращает payload"""
    secret = os.environ['JWT_SECRET']
    try:
        return jwt.decode(token, secret, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def handler(event: dict, context) -> dict:
    """Обработчик запросов аутентификации"""
    method = event.get('httpMethod', 'GET')
    
    # CORS preflight
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
    
    # POST /register - Регистрация
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        if action == 'register':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            full_name = body.get('full_name', '').strip()
            university = body.get('university', '').strip()
            faculty = body.get('faculty', '').strip()
            course = body.get('course', '').strip()
            
            if not email or not password or not full_name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email, пароль и имя обязательны'})
                }
            
            if len(password) < 6:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пароль должен быть минимум 6 символов'})
                }
            
            # Хэшируем пароль
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            conn = get_db_connection()
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Проверяем, существует ли пользователь
                    cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                    if cur.fetchone():
                        return {
                            'statusCode': 409,
                            'headers': headers,
                            'body': json.dumps({'error': 'Пользователь с таким email уже существует'})
                        }
                    
                    # Создаём пользователя
                    cur.execute("""
                        INSERT INTO users (email, password_hash, full_name, university, faculty, course)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id, email, full_name, university, faculty, course, created_at
                    """, (email, password_hash, full_name, university, faculty, course))
                    
                    user = cur.fetchone()
                    conn.commit()
                    
                    # Генерируем токен
                    token = generate_token(user['id'], user['email'])
                    
                    return {
                        'statusCode': 201,
                        'headers': headers,
                        'body': json.dumps({
                            'token': token,
                            'user': {
                                'id': user['id'],
                                'email': user['email'],
                                'full_name': user['full_name'],
                                'university': user['university'],
                                'faculty': user['faculty'],
                                'course': user['course']
                            }
                        })
                    }
            finally:
                conn.close()
        
        # POST /login - Вход
        elif action == 'login':
            email = body.get('email', '').strip().lower()
            password = body.get('password', '')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email и пароль обязательны'})
                }
            
            conn = get_db_connection()
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, email, password_hash, full_name, university, faculty, course
                        FROM users WHERE email = %s
                    """, (email,))
                    
                    user = cur.fetchone()
                    
                    if not user:
                        return {
                            'statusCode': 401,
                            'headers': headers,
                            'body': json.dumps({'error': 'Неверный email или пароль'})
                        }
                    
                    # Проверяем пароль
                    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                        return {
                            'statusCode': 401,
                            'headers': headers,
                            'body': json.dumps({'error': 'Неверный email или пароль'})
                        }
                    
                    # Генерируем токен
                    token = generate_token(user['id'], user['email'])
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'token': token,
                            'user': {
                                'id': user['id'],
                                'email': user['email'],
                                'full_name': user['full_name'],
                                'university': user['university'],
                                'faculty': user['faculty'],
                                'course': user['course']
                            }
                        })
                    }
            finally:
                conn.close()
    
    # GET /verify - Проверка токена
    elif method == 'GET':
        auth_header = event.get('headers', {}).get('X-Authorization', '')
        token = auth_header.replace('Bearer ', '')
        
        if not token:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Токен не предоставлен'})
            }
        
        payload = verify_token(token)
        
        if not payload:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Недействительный токен'})
            }
        
        # Получаем данные пользователя из БД
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id, email, full_name, university, faculty, course
                    FROM users WHERE id = %s
                """, (payload['user_id'],))
                
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Пользователь не найден'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'user': {
                            'id': user['id'],
                            'email': user['email'],
                            'full_name': user['full_name'],
                            'university': user['university'],
                            'faculty': user['faculty'],
                            'course': user['course']
                        }
                    })
                }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }