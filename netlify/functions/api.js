const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

// 中間件
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// 簡單測試端點
app.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API 連接成功！',
        timestamp: new Date().toISOString()
    });
});

// 導出 serverless 處理器
module.exports.handler = serverless(app);