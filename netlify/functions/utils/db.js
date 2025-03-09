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

module.exports = { connectToDatabase };