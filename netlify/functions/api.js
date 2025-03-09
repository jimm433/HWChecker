const express = require('express');
const serverless = require('serverless-http');
const { connectToDatabase } = require('./utils/db');
const cors = require('cors');

const app = express();

// 中間件設置
app.use(cors({
    origin: '*', // 允許所有來源
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 紀錄所有請求
app.use((req, res, next) => {
    console.log(`收到請求: ${req.method} ${req.path}`);
    next();
});

// 簡單測試端點，不連接數據庫
app.get('/test', (req, res) => {
    console.log('訪問測試端點');
    res.json({
        success: true,
        message: 'API 連接成功!',
        timestamp: new Date().toISOString()
    });
});

// 測試數據庫連接
app.get('/test-db', async(req, res) => {
    try {
        console.log('嘗試測試數據庫連接...');
        const db = await connectToDatabase();
        console.log('數據庫連接成功，執行 ping 命令');
        await db.command({ ping: 1 });
        console.log('數據庫 ping 成功');
        res.json({ success: true, message: '數據庫連接成功' });
    } catch (err) {
        console.error('數據庫連接測試失敗:', err);
        console.error('錯誤類型:', err.name);
        console.error('錯誤消息:', err.message);
        console.error('錯誤堆棧:', err.stack);
        res.status(500).json({
            success: false,
            message: '數據庫連接失敗',
            error: err.message
        });
    }
});

// 登入 API
app.post('/login', async(req, res) => {
    try {
        console.log('收到登入請求:', req.body);
        const { userId, password, role } = req.body;

        if (!userId || !password || !role) {
            console.log('缺少必要參數');
            return res.status(400).json({
                success: false,
                message: '缺少必要參數'
            });
        }

        console.log(`嘗試${role}登入，用戶ID: ${userId}`);
        console.log('嘗試連接數據庫...');
        const db = await connectToDatabase();
        console.log('數據庫連接成功');

        // 根據角色選擇集合
        const collection = role === 'student' ? db.collection('students') : db.collection('teachers');
        const idField = role === 'student' ? 'student_id' : 'teacher_id';

        console.log(`查詢集合 ${collection.collectionName}，尋找 ${idField}: ${userId}`);

        // 查詢用戶
        const user = await collection.findOne({
            [idField]: userId
        });

        if (!user) {
            console.log('找不到用戶');
            return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
        }

        console.log('找到用戶，檢查密碼');

        // 比對密碼
        if (user.password !== password) {
            console.log('密碼不匹配');
            return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
        }

        // 登入成功
        console.log('登入成功');
        res.json({
            success: true,
            message: '登入成功',
            user: {
                id: user[idField],
                name: user.name,
                role: role,
                department: user.department
            }
        });
    } catch (err) {
        console.error('登入過程中發生錯誤:', err);
        console.error('錯誤類型:', err.name);
        console.error('錯誤消息:', err.message);
        console.error('錯誤堆棧:', err.stack);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤',
            error: err.message
        });
    }
});

// 學生註冊 API
app.post('/register/student', async(req, res) => {
    try {
        console.log('收到註冊請求:', req.body);
        const { studentId, name, password } = req.body;

        // 基本輸入驗證
        if (!studentId || !name || !password) {
            console.log('缺少必要字段');
            return res.status(400).json({
                success: false,
                message: '必須提供學號、姓名和密碼'
            });
        }

        console.log('嘗試連接數據庫...');
        const db = await connectToDatabase();
        console.log('數據庫連接成功');

        const studentsCollection = db.collection('students');

        // 檢查學生ID是否已經存在
        console.log(`檢查學生ID ${studentId} 是否已存在`);
        const existingStudent = await studentsCollection.findOne({ student_id: studentId });

        if (existingStudent) {
            console.log('學生ID已存在');
            return res.status(400).json({
                success: false,
                message: '此學號已被註冊'
            });
        }

        console.log('學號可用，創建新學生');
        // 創建新學生
        await studentsCollection.insertOne({
            student_id: studentId,
            name,
            password,
            department: '資訊工程學系',
            year: 1
        });

        console.log('學生創建成功');
        res.status(201).json({
            success: true,
            message: '註冊成功'
        });
    } catch (err) {
        console.error('註冊過程中發生錯誤:', err);
        console.error('錯誤類型:', err.name);
        console.error('錯誤消息:', err.message);
        console.error('錯誤堆棧:', err.stack);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤，請稍後再試',
            error: err.message
        });
    }
});

// 添加初始測試數據 - 同時支持 GET 和 POST
app.get('/init-db', initDb);
app.post('/init-db', initDb);

// 抽取為獨立函數
async function initDb(req, res) {
    try {
        console.log('開始初始化數據庫...');
        const db = await connectToDatabase();
        console.log('數據庫連接成功');

        // 創建集合
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('students')) {
            console.log('創建 students 集合');
            await db.createCollection('students');
        } else {
            console.log('students 集合已存在');
        }

        if (!collectionNames.includes('teachers')) {
            console.log('創建 teachers 集合');
            await db.createCollection('teachers');
        } else {
            console.log('teachers 集合已存在');
        }

        // 添加測試教師
        const teachersCollection = db.collection('teachers');

        // 確認不重複添加數據
        console.log('檢查教師數據');
        const teacherExists = await teachersCollection.findOne({ teacher_id: 'teacher' });
        if (!teacherExists) {
            console.log('添加測試教師數據');
            await teachersCollection.insertMany([
                { teacher_id: 'teacher', name: '王老師', password: 'teacher', department: '資訊工程學系' },
                { teacher_id: 'teacher1', name: '李教授', password: '123456', department: '資訊工程學系' },
                { teacher_id: 'admin', name: '系統管理員', password: 'admin', department: '資訊工程學系' }
            ]);
            console.log('教師數據添加成功');
        } else {
            console.log('教師測試數據已存在');
        }

        // 添加測試學生
        const studentsCollection = db.collection('students');
        console.log('檢查學生數據');
        const studentExists = await studentsCollection.findOne({ student_id: 'student' });
        if (!studentExists) {
            console.log('添加測試學生數據');
            await studentsCollection.insertMany([
                { student_id: 'student', name: '張小明', password: 'student', department: '資訊工程學系', year: 2 },
                { student_id: 'student1', name: '王小華', password: '123456', department: '資訊工程學系', year: 2 },
                { student_id: 'test', name: '測試學生', password: 'test', department: '資訊工程學系', year: 3 }
            ]);
            console.log('學生數據添加成功');
        } else {
            console.log('學生測試數據已存在');
        }

        console.log('數據庫初始化完成');
        res.json({ success: true, message: '數據庫初始化成功' });
    } catch (err) {
        console.error('數據庫初始化失敗:', err);
        console.error('錯誤類型:', err.name);
        console.error('錯誤消息:', err.message);
        console.error('錯誤堆棧:', err.stack);
        res.status(500).json({
            success: false,
            message: '數據庫初始化失敗',
            error: err.message
        });
    }
}

// 導出處理函數
module.exports.handler = serverless(app);