from flask import Flask, request, jsonify, session
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv

# 載入環境變數
load_dotenv()

# 設置靜態文件目錄為項目根目錄
static_folder = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
app = Flask(__name__, static_url_path='', static_folder=static_folder)
CORS(app)  # 允許跨域請求

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

# 用戶註冊
@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        role = data.get('role', 'student')  # 預設為學生角色

        if not all([username, password, email]):
            return jsonify({
                'success': False, 
                'message': '請提供完整的用戶信息'
            }), 400

        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            users_collection = db["users"]

            # 檢查用戶是否已存在
            if users_collection.find_one({"username": username}):
                return jsonify({
                    'success': False, 
                    'message': '用戶名已存在'
                }), 400

            # 密碼加密
            hashed_password = generate_password_hash(password)

            # 創建用戶
            user_data = {
                "username": username,
                "password": hashed_password,
                "email": email,
                "role": role
            }
            result = users_collection.insert_one(user_data)

            return jsonify({
                'success': True, 
                'message': '用戶註冊成功',
                'userId': str(result.inserted_id)
            })
        finally:
            client.close()

    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'註冊失敗: {str(e)}'
        }), 500

# 用戶登入
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')

        if not all([username, password]):
            return jsonify({
                'success': False, 
                'message': '請提供用戶名和密碼'
            }), 400

        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            users_collection = db["users"]

            # 查找用戶
            user = users_collection.find_one({"username": username})
            if not user:
                return jsonify({
                    'success': False, 
                    'message': '用戶不存在'
                }), 401

            # 驗證密碼
            if not check_password_hash(user['password'], password):
                return jsonify({
                    'success': False, 
                    'message': '密碼錯誤'
                }), 401

            # 登入成功
            return jsonify({
                'success': True, 
                'message': '登入成功',
                'user': {
                    'userId': str(user['_id']),
                    'username': user['username'],
                    'role': user.get('role', 'student')
                }
            })
        finally:
            client.close()

    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'登入失敗: {str(e)}'
        }), 500

# 用戶登出
@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # 如果使用 session 登出
        session.clear()
        return jsonify({
            'success': True, 
            'message': '登出成功'
        })
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'登出失敗: {str(e)}'
        }), 500

# 重置密碼
@app.route('/api/reset-password', methods=['POST', 'OPTIONS'])
def reset_password():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        new_password = data.get('new_password')

        if not all([username, email, new_password]):
            return jsonify({
                'success': False, 
                'message': '請提供完整信息'
            }), 400

        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            users_collection = db["users"]

            # 查找用戶
            user = users_collection.find_one({
                "username": username,
                "email": email
            })

            if not user:
                return jsonify({
                    'success': False, 
                    'message': '用戶信息不匹配'
                }), 401

            # 重置密碼
            hashed_new_password = generate_password_hash(new_password)
            users_collection.update_one(
                {"username": username},
                {"$set": {"password": hashed_new_password}}
            )

            return jsonify({
                'success': True, 
                'message': '密碼重置成功'
            })
        finally:
            client.close()

    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'密碼重置失敗: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000)