import json
import os
import jwt
import psycopg2
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA_NAME = os.environ.get('MAIN_DB_SCHEMA', 'public')
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY', '')

def get_user_id_from_token(token: str) -> int:
    """Извлечение user_id из JWT токена"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

def handler(event: dict, context) -> dict:
    """API для ИИ-ассистента: отвечает на вопросы по материалам пользователя"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': ''
        }
    
    token = event.get('headers', {}).get('X-Authorization', '').replace('Bearer ', '')
    user_id = get_user_id_from_token(token)
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    if method == 'POST':
        body = json.loads(event.get('body', '{}'))
        question = body.get('question', '').strip()
        material_ids = body.get('material_ids', [])
        
        if not question:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Question is required'})
            }
        
        conn = psycopg2.connect(DATABASE_URL)
        
        try:
            context_text = get_materials_context(conn, user_id, material_ids)
            answer = ask_deepseek(question, context_text)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'answer': answer,
                    'materials_used': len(material_ids) if material_ids else 'all'
                })
            }
        finally:
            conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }

def get_materials_context(conn, user_id: int, material_ids: list) -> str:
    """Получение текста материалов для контекста ИИ"""
    cursor = conn.cursor()
    
    if material_ids:
        placeholders = ','.join(['%s'] * len(material_ids))
        cursor.execute(f'''
            SELECT title, subject, recognized_text, summary
            FROM {SCHEMA_NAME}.materials
            WHERE user_id = %s AND id IN ({placeholders})
            ORDER BY created_at DESC
            LIMIT 10
        ''', [user_id] + material_ids)
    else:
        cursor.execute(f'''
            SELECT title, subject, recognized_text, summary
            FROM {SCHEMA_NAME}.materials
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 10
        ''', (user_id,))
    
    materials = cursor.fetchall()
    cursor.close()
    
    if not materials:
        return "У пользователя нет загруженных материалов."
    
    context_parts = []
    for title, subject, text, summary in materials:
        context_parts.append(f"Материал: {title}")
        if subject:
            context_parts.append(f"Предмет: {subject}")
        if summary:
            context_parts.append(f"Краткое содержание: {summary}")
        if text:
            context_parts.append(f"Текст: {text[:2000]}")
        context_parts.append("---")
    
    return "\n".join(context_parts)

def ask_deepseek(question: str, context: str) -> str:
    """Отправка запроса к DeepSeek API"""
    import requests
    
    if not DEEPSEEK_API_KEY:
        return "Ошибка: API ключ DeepSeek не настроен"
    
    system_prompt = f"""Ты — умный ассистент для студентов Studyfay. 
Помогаешь разобраться в учебных материалах, отвечаешь на вопросы простым языком.

Доступные материалы пользователя:
{context}

Отвечай кратко, по делу, используя информацию из материалов. 
Если информации нет в материалах — скажи об этом честно."""

    try:
        response = requests.post(
            'https://api.deepseek.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {DEEPSEEK_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'deepseek-chat',
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': question}
                ],
                'temperature': 0.7,
                'max_tokens': 1000
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return data['choices'][0]['message']['content']
        else:
            return f"Ошибка API: {response.status_code}"
    
    except Exception as e:
        return f"Ошибка при обращении к ИИ: {str(e)}"
