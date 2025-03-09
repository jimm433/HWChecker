// server.js
const express = require('express');
const cors = require('cors');
const { testConnection, pool } = require('./db');

const app = express();
const PORT = 3000;

// 中間件設置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 測試資料庫連接的路由
app.get('/api/test-db', async(req, res) => {
    const isConnected = await testConnection();
    res.json({
        success: isConnected,
        message: isConnected ? '資料庫連接成功' : '資料庫連接失敗'
    });
});

// 簡單的登入 API
app.post('/api/login', async(req, res) => {
    try {
        const { userId, password, role } = req.body;

        // 根據角色選擇查詢表格
        const table = role === 'student' ? 'students' : 'teachers';
        const idField = role === 'student' ? 'student_id' : 'teacher_id';

        // 查詢用戶
        const [rows] = await pool.execute(
            `SELECT * FROM ${table} WHERE ${idField} = ?`, [userId]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: '帳號或密碼錯誤' });
        }

        const user = rows[0];

        // 為了簡化這個例子，我們先不做密碼加密比對
        // 實際系統中應該使用 bcrypt 進行密碼比對
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
app.post('/api/register/student', async(req, res) => {
    try {
        const { studentId, name, password } = req.body;

        // 檢查學生ID是否已經存在
        const [existingStudents] = await pool.execute(
            'SELECT * FROM students WHERE student_id = ?', [studentId]
        );

        if (existingStudents.length > 0) {
            return res.status(400).json({
                success: false,
                message: '此學號已被註冊'
            });
        }

        // 實際應用中應該對密碼進行加密
        // 這裡為了簡化，暫時不做加密
        // const hashedPassword = await bcrypt.hash(password, 10);

        // 新增學生記錄
        await pool.execute(
            'INSERT INTO students (student_id, name, password, department, year) VALUES (?, ?, ?, ?, ?)', [studentId, name, password, '資訊工程學系', 1]
        );

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

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器運行於 http://localhost:${PORT}`);
    testConnection(); // 啟動時測試資料庫連接
});