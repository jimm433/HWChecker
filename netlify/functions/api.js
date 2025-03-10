const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
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
        const requestBody = JSON.parse(event.body);

        // 確定是登入還是註冊請求
        if (requestBody.studentId && requestBody.name && requestBody.password) {
            // 這是註冊請求
            const { studentId, name, password } = requestBody;

            console.log('接收到註冊請求:', { studentId, name });

            // 基本輸入驗證
            if (!studentId || !name || !password) {
                console.log('輸入驗證失敗：缺少必要欄位');
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
                console.log('密碼長度不足');
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
                console.log('成功連接到 MongoDB');

                const db = client.db("school_system");
                const studentsCollection = db.collection('students');

                // 檢查學生ID是否已經存在
                const existingStudent = await studentsCollection.findOne({ student_id: studentId });

                if (existingStudent) {
                    console.log('學號已存在:', studentId);
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
                const result = await studentsCollection.insertOne({
                    student_id: studentId,
                    name,
                    password,
                    department: '資訊工程學系',
                    year: 1
                });

                console.log('成功插入學生資料:', result);

                // 註冊成功
                return {
                    statusCode: 201,
                    headers: corsHeaders,
                    body: JSON.stringify({
                        success: true,
                        message: '註冊成功',
                        insertedId: result.insertedId
                    })
                };
            } finally {
                // 確保關閉數據庫連接
                await client.close();
                console.log('已關閉 MongoDB 連接');
            }
        } else if (requestBody.userId && requestBody.password && requestBody.role) {
            // 這是登入請求
            const { userId, password, role } = requestBody;

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
        } else {
            // 未知的請求類型
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    success: false,
                    message: '無效的請求'
                })
            };
        }
    } catch (err) {
        console.error('請求處理錯誤:', err);
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