// db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// 使用你提供的資料庫信息建立連接池
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'abc123',
    database: 'school_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 測試資料庫連接
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('資料庫連接成功!');
        connection.release();
        return true;
    } catch (err) {
        console.error('資料庫連接失敗:', err);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};