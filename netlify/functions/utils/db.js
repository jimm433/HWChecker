const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://jimm433:S9mEMxrTBqgjHWUd@hwhelperdb.t7cf1.mongodb.net/?retryWrites=true&w=majority&appName=HWhelperDB";

let client = null;
let dbConnection = null;

async function connectToDatabase() {
    if (dbConnection) {
        return dbConnection;
    }

    try {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        await client.connect();
        console.log("成功連接到 MongoDB");
        dbConnection = client.db("school_system");
        return dbConnection;
    } catch (error) {
        console.error("MongoDB 連接錯誤:", error);
        throw error;
    }
}

module.exports = { connectToDatabase };