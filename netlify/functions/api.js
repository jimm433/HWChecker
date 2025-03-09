const express = require('express');
const serverless = require('serverless-http');
const { connectToDatabase } = require('./utils/db');
const cors = require('cors');

const app = express();

// 中間件
app.use(cors());
app.use(express.json());

// 測試數據庫連接
app.get('/test-db', async(req, res) => {
    try {
        const db = await connectToDatabase();
        await db.command({ ping: 1 });
        res.json({ success: true, message: '數據庫連接成功' });
    } catch (err) {
        console.error('數據庫連接失敗:', err);
        res.status(500).json({ success: false, message: '數據庫連接失敗' });
    }
});

// 登入 API
app.post('/login', async(req, res) => {
    try {
        const { userId, password, role } = req.body;
        const db = await connectToDatabase();

        // 根據角色選擇集合
        const collection = role === 'student' ? db.collection('students') : db.collection('teachers');
        const idField = role === 'student' ? 'student_id' : 'teacher_id';

        // 查詢用戶
        const user = await collection.findOne({
            [idField]: userId
        });

        if (!user) {
            return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
        }

        // 比對密碼
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
        }

        // 登入成功
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
        console.error('登入錯誤:', err);
        res.status(500).json({ success: false, message: '伺服器錯誤' });
    }
});

// 學生註冊 API
app.post('/register/student', async(req, res) => {
    try {
        const { studentId, name, password } = req.body;
        const db = await connectToDatabase();
        const studentsCollection = db.collection('students');

        // 檢查學生ID是否已經存在
        const existingStudent = await studentsCollection.findOne({ student_id: studentId });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: '此學號已被註冊'
            });
        }

        // 創建新學生
        await studentsCollection.insertOne({
            student_id: studentId,
            name,
            password,
            department: '資訊工程學系',
            year: 1
        });

        res.status(201).json({
            success: true,
            message: '註冊成功'
        });
    } catch (err) {
        console.error('註冊錯誤:', err);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤，請稍後再試'
        });
    }
});

// 導出處理函數
module.exports.handler = serverless(app);

// 添加初始測試數據
app.post('/init-db', async(req, res) => {
    try {
        const db = await connectToDatabase();

        // 創建集合
        if (!(await db.listCollections({ name: 'students' }).hasNext())) {
            await db.createCollection('students');
        }
        if (!(await db.listCollections({ name: 'teachers' }).hasNext())) {
            await db.createCollection('teachers');
        }

        // 添加測試教師
        const teachersCollection = db.collection('teachers');

        // 確認不重複添加數據
        const teacherExists = await teachersCollection.findOne({ teacher_id: 'teacher' });
        if (!teacherExists) {
            await teachersCollection.insertMany([
                { teacher_id: 'teacher', name: '王老師', password: 'teacher', department: '資訊工程學系' },
                { teacher_id: 'teacher1', name: '李教授', password: '123456', department: '資訊工程學系' },
                { teacher_id: 'admin', name: '系統管理員', password: 'admin', department: '資訊工程學系' }
            ]);
        }

        // 添加測試學生
        const studentsCollection = db.collection('students');
        const studentExists = await studentsCollection.findOne({ student_id: 'student' });
        if (!studentExists) {
            await studentsCollection.insertMany([
                { student_id: 'student', name: '張小明', password: 'student', department: '資訊工程學系', year: 2 },
                { student_id: 'student1', name: '王小華', password: '123456', department: '資訊工程學系', year: 2 },
                { student_id: 'test', name: '測試學生', password: 'test', department: '資訊工程學系', year: 3 }
            ]);
        }

        res.json({ success: true, message: '數據庫初始化成功' });
    } catch (err) {
        console.error('初始化錯誤:', err);
        res.status(500).json({ success: false, message: '數據庫初始化失敗', error: err.message });
    }
});