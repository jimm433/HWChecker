const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://jimm433:S9mEMxrTBqgjHWUd@hwhelperdb.t7cf1.mongodb.net/?retryWrites=true&w=majority&appName=HWhelperDB";

// 處理 CORS 的函數
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async(event, context) => {
    // 處理 OPTIONS 預檢請求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    // 只處理 POST 請求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({ message: '方法不被允許' })
        };
    }

    try {
        // 解析請求體
        const { userId, password, role } = JSON.parse(event.body);

        console.log('收到登入請求:', { userId, role });

        // 創建 MongoDB 客戶端
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        try {
            // 連接到數據庫
            await client.connect();
            const db = client.db("school_system");

            // 根據角色選擇集合
            const collection = role === 'student' ?
                db.collection('students') :
                db.collection('teachers');

            const idField = role === 'student' ? 'student_id' : 'teacher_id';

            // 查詢用戶
            const user = await collection.findOne({
                [idField]: userId
            });

            if (!user) {
                return {
                    statusCode: 401,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: '帳號或密碼錯誤'
                    })
                };
            }

            // 比對密碼
            if (user.password !== password) {
                return {
                    statusCode: 401,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: '帳號或密碼錯誤'
                    })
                };
            }

            // 登入成功
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: '登入成功',
                    user: {
                        id: user[idField],
                        name: user.name,
                        role: role,
                        department: user.department
                    }
                })
            };
        } finally {
            // 確保關閉數據庫連接
            await client.close();
        }
    } catch (err) {
        console.error('登入錯誤:', err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: '伺服器錯誤',
                error: err.message
            })
        };
    }
};