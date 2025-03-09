const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://jimm433:S9mEMxrTBqgjHWUd@hwhelperdb.t7cf1.mongodb.net/?retryWrites=true&w=majority&appName=HWhelperDB";

// CORS 配置
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
            body: JSON.stringify({
                success: false,
                message: '方法不被允許'
            })
        };
    }

    try {
        // 解析請求體
        const { studentId, name, password } = JSON.parse(event.body);

        // 基本輸入驗證
        if (!studentId || !name || !password) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    message: '必須提供學號、姓名和密碼'
                })
            };
        }

        // 密碼長度驗證
        if (password.length < 6) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    message: '密碼長度至少需要6個字符'
                })
            };
        }

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
            const studentsCollection = db.collection('students');

            // 檢查學生ID是否已經存在
            const existingStudent = await studentsCollection.findOne({ student_id: studentId });

            if (existingStudent) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: false,
                        message: '此學號已被註冊'
                    })
                };
            }

            // 創建新學生
            await studentsCollection.insertOne({
                student_id: studentId,
                name,
                password,
                department: '資訊工程學系',
                year: 1
            });

            // 註冊成功
            return {
                statusCode: 201,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: true,
                    message: '註冊成功'
                })
            };
        } finally {
            // 確保關閉數據庫連接
            await client.close();
        }
    } catch (err) {
        console.error('註冊錯誤詳情:', err);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: '伺服器錯誤，請稍後再試',
                error: err.message
            })
        };
    }
};