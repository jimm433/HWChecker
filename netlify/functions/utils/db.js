const { MongoClient, ServerApiVersion } = require('mongodb');

// 建議使用環境變數來存儲連接字串，以下為範例
// 在實際部署時，請在 Netlify 的環境變數設定中設定 MONGODB_URI
// const uri = process.env.MONGODB_URI;

// 現在暫時使用硬編碼的連接字串
const uri = "mongodb+srv://jimm433:S9mEMxrTBqgjHWUd@hwhelperdb.t7cf1.mongodb.net/?retryWrites=true&w=majority&appName=HWhelperDB";

// 全域變數用來保存連接實例
let client = null;
let dbConnection = null;

/**
 * 連接到 MongoDB 資料庫
 * @returns {Promise<Db>} 資料庫連接
 */
async function connectToDatabase() {
    // 如果已經有連接，則直接返回
    if (dbConnection) {
        console.log("使用現有的資料庫連接");
        return dbConnection;
    }

    try {
        console.log("嘗試連接到 MongoDB...");

        // 建立客戶端連接
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            // 添加連接池選項，提高效能
            maxPoolSize: 10,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
            // 設定連接超時
            connectTimeoutMS: 5000,
            socketTimeoutMS: 30000
        });

        // 連接到資料庫
        await client.connect();
        console.log("成功連接到 MongoDB");

        // 獲取資料庫實例
        dbConnection = client.db("school_system");

        // 添加錯誤處理和重新連接的事件監聽器
        client.on('error', (err) => {
            console.error('MongoDB 連接錯誤:', err);
            dbConnection = null;
        });

        client.on('close', () => {
            console.log('MongoDB 連接已關閉');
            dbConnection = null;
        });

        return dbConnection;
    } catch (error) {
        console.error("MongoDB 連接錯誤:", error);
        // 清除連接變數，下次可以重新嘗試連接
        client = null;
        dbConnection = null;
        throw new Error(`無法連接到 MongoDB: ${error.message}`);
    }
}

// 添加一個關閉連接的函數，用於清理資源
async function closeConnection() {
    if (client) {
        try {
            await client.close();
            console.log("MongoDB 連接已關閉");
            client = null;
            dbConnection = null;
        } catch (error) {
            console.error("關閉 MongoDB 連接時出錯:", error);
        }
    }
}

// 導出函數
module.exports = {
    connectToDatabase,
    closeConnection
};