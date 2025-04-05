import json
import os
import logging
from pymongo import MongoClient
from werkzeug.security import check_password_hash
from dotenv import load_dotenv

# 配置日誌
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 載入環境變量
load_dotenv()

def connect_to_mongodb():
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        logger.error("未找到 MONGODB_URI 環境變量")
        raise ValueError("缺少 MongoDB 連接字符串")
    
    try:
        client = MongoClient(mongodb_uri)
        # 驗證連接
        client.admin.command('ping')
        logger.info("成功連接到 MongoDB")
        return client
    except Exception as e:
        logger.error(f"連接到 MongoDB 時發生錯誤: {e}")
        raise

def handler(event, context):
    try:
        # 處理 OPTIONS 請求
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': ''
            }

        # 僅處理 POST 請求
        if event.get('httpMethod') != 'POST':
            logger.warning(f"收到不支持的方法: {event.get('httpMethod')}")
            return {
                'statusCode': 405,
                'body': json.dumps({
                    'success': False, 
                    'message': '不支持的方法'
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }

        # 解析請求體
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            logger.error("JSON 解析失敗")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False, 
                    'message': '無效的 JSON 格式'
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        username = body.get('username', '').strip()
        password = body.get('password', '').strip()
        role = body.get('role', 'student')

        # 輸入驗證
        if not username or not password:
            logger.warning("登入嘗試缺少用戶名或密碼")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False, 
                    'message': '請提供用戶名和密碼'
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }

        # 連接 MongoDB
        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            users_collection = db["users"]

            # 查找用戶
            user = users_collection.find_one({"username": username, "role": role})
            if not user:
                logger.info(f"用戶不存在: {username}, 角色: {role}")
                return {
                    'statusCode': 401,
                    'body': json.dumps({
                        'success': False, 
                        'message': '用戶不存在或角色不符'
                    }),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }

            # 驗證密碼
            if not check_password_hash(user['password'], password):
                logger.warning(f"密碼驗證失敗: {username}")
                return {
                    'statusCode': 401,
                    'body': json.dumps({
                        'success': False, 
                        'message': '密碼錯誤'
                    }),
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                }

            # 登入成功
            logger.info(f"用戶登入成功: {username}")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True, 
                    'message': '登入成功',
                    'user': {
                        'userId': str(user['_id']),
                        'username': user['username'],
                        'role': user.get('role', 'student')
                    }
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        finally:
            client.close()

    except Exception as e:
        logger.error(f'登入處理發生異常: {e}', exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False, 
                'message': '伺服器內部錯誤'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }