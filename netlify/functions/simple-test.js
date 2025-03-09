// 這是一個簡單的測試函數，不依賴於 MongoDB 連接
exports.handler = async function(event, context) {
    console.log('簡單測試函數被調用');

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // 允許任何來源
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        body: JSON.stringify({
            success: true,
            message: "API 測試成功!",
            timestamp: new Date().toISOString()
        })
    };
};