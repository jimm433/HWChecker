from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json
from dotenv import load_dotenv
import traceback

# 載入環境變數
load_dotenv()

# 設置靜態文件目錄為項目根目錄
static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
app = Flask(__name__, static_url_path='', static_folder=static_folder)
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB 連接
MONGODB_URI = os.getenv("MONGODB_URI")

def connect_to_mongodb():
    try:
        client = MongoClient(MONGODB_URI)
        client.admin.command('ping')
        print("成功連接到 MongoDB")
        return client
    except Exception as e:
        print(f"連接到 MongoDB 時發生錯誤: {e}")
        raise e

def login_handler(event, context):
    try:
        # 解析 JSON 請求體
        body = json.loads(event.get('body', '{}'))
        
        username = body.get('username')
        password = body.get('password')

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

        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            users_collection = db["users"]

            # 查找用戶
            user = users_collection.find_one({"username": username})
            if not user:
                return {
                    'statusCode': 401,
                    'body': json.dumps({
                        'success': False, 
                        'message': '用戶不存在'
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
        print(f'登入失敗: {e}')
        print(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False, 
                'message': f'登入失敗: {str(e)}'
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }

# 處理 OPTIONS 請求的處理器
def options_handler(event, context):
    return {
        'statusCode': 200,
        'body': '',
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    }

# 主處理函數
def handler(event, context):
    # 檢查請求方法
    http_method = event.get('httpMethod', '')
    
    if http_method == 'OPTIONS':
        return options_handler(event, context)
    elif http_method == 'POST':
        return login_handler(event, context)
    else:
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