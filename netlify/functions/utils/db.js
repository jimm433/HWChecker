const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://jimm433:S9mEMxrTBqgjHWUd@hwhelperdb.t7cf1.mongodb.net/?retryWrites=true&w=majority&appName=HWhelperDB";

let client = null;
let dbConnection = null;

async function connectToDatabase() {
    if (dbConnection) {
        return dbConnection;
    }

    client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    });

    await client.connect();
    dbConnection = client.db("school_system"); // 指定你的數據庫名稱

    return dbConnection;
}

app.post('/register/student', async(req, res) => {
    try {
        console.log('收到註冊請求:', req.body);
        // 其餘代碼...
    } catch (err) {
        console.error('註冊錯誤詳情:', err);
        res.status(500).json({
            success: false,
            message: '伺服器錯誤，請稍後再試',
            error: err.message // 添加這行以提供更多錯誤信息
        });
    }
});

module.exports = { connectToDatabase };