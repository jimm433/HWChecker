const { connectToDatabase } = require('./utils/db');
require('dotenv').config();

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event, context) => {
    // 處理 OPTIONS 預檢請求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }

    // 確保只處理 POST 請求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: '方法不被允許'
            })
        };
    }

    try {
        // 解析請求體
        const gradeData = JSON.parse(event.body);
        
        // 連接數據庫
        const db = await connectToDatabase();
        const assignmentsCollection = db.collection('assignments');

        // 保存批改結果
        const result = await assignmentsCollection.updateOne(
            { 
                studentId: gradeData.studentId, 
                courseId: gradeData.courseId, 
                assignmentId: gradeData.assignmentId 
            },
            { 
                $set: { 
                    teacherScore: gradeData.score,
                    teacherComments: gradeData.comments,
                    aiScoreAccepted: gradeData.aiScoreAccepted,
                    status: 'graded'
                } 
            },
            { upsert: true }
        );

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                data: result
            })
        };
    } catch (error) {
        console.error('保存作業批改失敗:', error);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: error.message || '伺服器內部錯誤'
            })
        };
    }
};