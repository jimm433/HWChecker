import json
import os
import logging
from pymongo import MongoClient
from werkzeug.security import check_password_hash
from dotenv import load_dotenv

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 載入環境變量
load_dotenv()

# 獲取環境變數
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

# 檢查環境變數是否正確載入
if not MONGODB_URI:
    logger.error("環境變數 MONGODB_URI 未設置")
    raise RuntimeError("環境變數 MONGODB_URI 未設置")

if not OPENAI_API_KEY:
    logger.error("環境變數 OPENAI_API_KEY 未設置")
    raise RuntimeError("環境變數 OPENAI_API_KEY 未設置")

def connect_to_mongodb():
    mongodb_uri = os.getenv("MONGODB_URI")
    try:
        client = MongoClient(mongodb_uri)
        client.admin.command('ping')
        return client
    except Exception as e:
        logger.error(f"MongoDB連接錯誤: {e}")
        raise

def handler(event, context):
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

    # 只處理 POST 請求
    if event.get('httpMethod') != 'POST':
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

    try:
        # 解析請求體
        body = json.loads(event.get('body', '{}'))
        
        username = body.get('username', '').strip()
        password = body.get('password', '').strip()
        role = body.get('role', 'student')

        # 輸入驗證
        if not username or not password:
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
        logger.error(f'登入處理發生異常: {e}')
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False, 
                'message': f'伺服器內部錯誤: {str(e)}'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

# Netlify Functions 入口
def lambda_handler(event, context):
    return handler(event, context)