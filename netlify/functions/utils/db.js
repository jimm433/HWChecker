const { MongoClient } = require('mongodb');

// 使用環境變數取得連接字串
const uri = process.env.MONGODB_URI;

// 全域變數用於保存連接
let cachedClient = null;
let cachedDb = null;

/**
 * 連接到 MongoDB 數據庫
 * @returns {Promise<Db>} 數據庫連接
 */
async function connectToDatabase() {
    // 如果我們已有連接，返回緩存的連接
    if (cachedDb) {
        console.log("使用已存在的數據庫連接");
        return cachedDb;
    }

    try {
        console.log("嘗試連接到 MongoDB...");
        console.log("連接字串開頭: " + uri.substring(0, 20) + "...");

        // 如果沒有連接字串，拋出錯誤
        if (!uri) {
            throw new Error("未找到 MONGODB_URI 環境變數");
        }

        // 連接到 MongoDB
        const client = new MongoClient(uri);
        await client.connect();
        console.log("成功連接到 MongoDB");

        // 獲取數據庫
        const db = client.db("school_system");

        // 緩存連接
        cachedClient = client;
        cachedDb = db;

        return db;
    } catch (error) {
        console.error("MongoDB 連接錯誤:", error);
        throw error;
    }
}

module.exports = { connectToDatabase };