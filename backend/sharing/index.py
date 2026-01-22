import json
import os
import jwt
import psycopg2
import random
import string
from datetime import datetime

DATABASE_URL = os.environ.get('DATABASE_URL')
SCHEMA_NAME = os.environ.get('MAIN_DB_SCHEMA', 'public')
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')

def get_user_id_from_token(token: str) -> int:
    """Извлечение user_id из JWT токена"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['user_id']
    except:
        return None

def generate_share_code():
    """Генерация уникального 6-значного кода"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def handler(event: dict, context) -> dict:
    """API для расшаривания расписания с группой"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    
    conn = psycopg2.connect(DATABASE_URL)
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create':
                return create_shared_schedule(conn, user_id, body)
            elif action == 'subscribe':
                return subscribe_to_schedule(conn, user_id, body.get('share_code'))
            elif action == 'unsubscribe':
                return unsubscribe_from_schedule(conn, user_id, body.get('shared_schedule_id'))
        
        elif method == 'GET':
            action = event.get('queryStringParameters', {}).get('action')
            share_code = event.get('queryStringParameters', {}).get('share_code')
            
            if action == 'my_shares':
                return get_my_shared_schedules(conn, user_id)
            elif action == 'my_subscriptions':
                return get_my_subscriptions(conn, user_id)
            elif action == 'view' and share_code:
                return view_shared_schedule(conn, share_code)
        
        elif method == 'DELETE':
            shared_id = event.get('queryStringParameters', {}).get('id')
            return delete_shared_schedule(conn, user_id, int(shared_id))
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'})
        }
    
    finally:
        conn.close()

def create_shared_schedule(conn, user_id: int, body: dict) -> dict:
    """Создание расшаренного расписания"""
    title = body.get('title', 'Моё расписание')
    description = body.get('description', '')
    
    share_code = generate_share_code()
    
    cursor = conn.cursor()
    cursor.execute(f'''
        INSERT INTO {SCHEMA_NAME}.shared_schedules 
        (owner_user_id, share_code, title, description)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    ''', (user_id, share_code, title, description))
    
    shared_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'shared_schedule_id': shared_id,
            'share_code': share_code,
            'message': f'Расписание создано! Код: {share_code}'
        })
    }

def subscribe_to_schedule(conn, user_id: int, share_code: str) -> dict:
    """Подписка на расшаренное расписание"""
    if not share_code:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Share code is required'})
        }
    
    cursor = conn.cursor()
    
    cursor.execute(f'''
        SELECT id, owner_user_id, title FROM {SCHEMA_NAME}.shared_schedules
        WHERE share_code = %s AND is_active = TRUE
    ''', (share_code,))
    
    result = cursor.fetchone()
    if not result:
        cursor.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Shared schedule not found'})
        }
    
    shared_id, owner_id, title = result
    
    if owner_id == user_id:
        cursor.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'You cannot subscribe to your own schedule'})
        }
    
    cursor.execute(f'''
        INSERT INTO {SCHEMA_NAME}.schedule_subscribers (shared_schedule_id, user_id)
        VALUES (%s, %s)
        ON CONFLICT (shared_schedule_id, user_id) DO NOTHING
    ''', (shared_id, user_id))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'message': f'Вы подписались на "{title}"'
        })
    }

def unsubscribe_from_schedule(conn, user_id: int, shared_schedule_id: int) -> dict:
    """Отписка от расшаренного расписания"""
    cursor = conn.cursor()
    
    cursor.execute(f'''
        DELETE FROM {SCHEMA_NAME}.schedule_subscribers
        WHERE shared_schedule_id = %s AND user_id = %s
    ''', (shared_schedule_id, user_id))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'message': 'Вы отписались от расписания'})
    }

def get_my_shared_schedules(conn, user_id: int) -> dict:
    """Получение моих расшаренных расписаний"""
    cursor = conn.cursor()
    
    cursor.execute(f'''
        SELECT 
            ss.id,
            ss.share_code,
            ss.title,
            ss.description,
            ss.created_at,
            COUNT(sub.id) as subscribers_count
        FROM {SCHEMA_NAME}.shared_schedules ss
        LEFT JOIN {SCHEMA_NAME}.schedule_subscribers sub ON ss.id = sub.shared_schedule_id
        WHERE ss.owner_user_id = %s AND ss.is_active = TRUE
        GROUP BY ss.id
        ORDER BY ss.created_at DESC
    ''', (user_id,))
    
    shares = []
    for row in cursor.fetchall():
        shares.append({
            'id': row[0],
            'share_code': row[1],
            'title': row[2],
            'description': row[3],
            'created_at': row[4].isoformat() if row[4] else None,
            'subscribers_count': row[5]
        })
    
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'shares': shares})
    }

def get_my_subscriptions(conn, user_id: int) -> dict:
    """Получение расписаний, на которые я подписан"""
    cursor = conn.cursor()
    
    cursor.execute(f'''
        SELECT 
            ss.id,
            ss.share_code,
            ss.title,
            ss.description,
            u.full_name as owner_name,
            sub.subscribed_at
        FROM {SCHEMA_NAME}.schedule_subscribers sub
        JOIN {SCHEMA_NAME}.shared_schedules ss ON sub.shared_schedule_id = ss.id
        JOIN {SCHEMA_NAME}.users u ON ss.owner_user_id = u.id
        WHERE sub.user_id = %s AND ss.is_active = TRUE
        ORDER BY sub.subscribed_at DESC
    ''', (user_id,))
    
    subscriptions = []
    for row in cursor.fetchall():
        subscriptions.append({
            'id': row[0],
            'share_code': row[1],
            'title': row[2],
            'description': row[3],
            'owner_name': row[4],
            'subscribed_at': row[5].isoformat() if row[5] else None
        })
    
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'subscriptions': subscriptions})
    }

def view_shared_schedule(conn, share_code: str) -> dict:
    """Просмотр расписания по коду (для подписчиков)"""
    cursor = conn.cursor()
    
    cursor.execute(f'''
        SELECT 
            ss.id,
            ss.title,
            ss.description,
            u.full_name as owner_name
        FROM {SCHEMA_NAME}.shared_schedules ss
        JOIN {SCHEMA_NAME}.users u ON ss.owner_user_id = u.id
        WHERE ss.share_code = %s AND ss.is_active = TRUE
    ''', (share_code,))
    
    result = cursor.fetchone()
    if not result:
        cursor.close()
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Schedule not found'})
        }
    
    schedule_info = {
        'id': result[0],
        'title': result[1],
        'description': result[2],
        'owner_name': result[3]
    }
    
    cursor.execute(f'''
        SELECT 
            s.id,
            s.subject,
            s.type,
            s.start_time,
            s.end_time,
            s.day_of_week,
            s.room,
            s.teacher
        FROM {SCHEMA_NAME}.schedule s
        JOIN {SCHEMA_NAME}.shared_schedules ss ON ss.owner_user_id = s.user_id
        WHERE ss.share_code = %s
        ORDER BY s.day_of_week, s.start_time
    ''', (share_code,))
    
    lessons = []
    for row in cursor.fetchall():
        lessons.append({
            'id': row[0],
            'subject': row[1],
            'type': row[2],
            'start_time': row[3].strftime('%H:%M') if row[3] else None,
            'end_time': row[4].strftime('%H:%M') if row[4] else None,
            'day_of_week': row[5],
            'room': row[6],
            'teacher': row[7]
        })
    
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'schedule_info': schedule_info,
            'lessons': lessons
        })
    }

def delete_shared_schedule(conn, user_id: int, shared_id: int) -> dict:
    """Удаление расшаренного расписания"""
    cursor = conn.cursor()
    
    cursor.execute(f'''
        UPDATE {SCHEMA_NAME}.shared_schedules
        SET is_active = FALSE
        WHERE id = %s AND owner_user_id = %s
    ''', (shared_id, user_id))
    
    conn.commit()
    cursor.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'message': 'Расшаривание отключено'})
    }
