const { OpenAI } = require('openai');
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
        // 初始化 OpenAI 客戶端
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // 解析請求數據
        const requestData = JSON.parse(event.body);
        const { submissionId, studentId, content, gradingOptions } = requestData;

        console.log('收到批改請求:', { submissionId, studentId });

        // 生成評分提示
        const gradingPrompt = `
你是一位專業的程式碼批改助教，請對以下代碼進行全面評分：

【評分標準】
1. 程式正確性 (30%): 程式是否能正確解決問題
2. 程式效率 (20%): 算法效率和時間/空間複雜度
3. 程式碼風格 (20%): 代碼可讀性、命名規範
4. 程式架構 (20%): 模組化設計和程式組織
5. 報告完整性 (10%): 註解、說明的完整性

學生代碼：
---
${content}
---

評分要求：
1. 分析每個評分標準的表現
2. 指出優點和需要改進的地方
3. 給出具體、建設性的意見
4. 最終給出總分 (0-100分)

回覆格式：
【評分標準詳細評論】
- 具體評分點
- 扣分原因 / 改進建議

【總體評語】
- 優點總結
- 關鍵改進點

總分：xx/100
`;

        // 調用 OpenAI API 進行批改
        const response = await openai.chat.completions.create({
            model: "gpt-4-1106-preview",
            messages: [
                { role: "system", content: "你是一個專業的程式碼批改助教" },
                { role: "user", content: gradingPrompt }
            ],
            max_tokens: 1000
        });

        const gradingResult = response.choices[0].message.content;
        console.log('批改結果:', gradingResult);

        // 解析分數和評分項目
        const scoreMatch = gradingResult.match(/總分[：:]\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

        const gradingItems = [
            { name: '程式正確性', maxScore: 30 },
            { name: '程式效率', maxScore: 20 },
            { name: '程式碼風格', maxScore: 20 },
            { name: '程式架構', maxScore: 20 },
            { name: '報告完整性', maxScore: 10 }
        ].map(item => {
            const regex = new RegExp(`${item.name}[：:]\s*(-?\d+)`);
            const match = gradingResult.match(regex);
            const itemScore = match ? parseInt(match[1]) : 0;

            return {
                ...item,
                score: itemScore
            };
        });

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                result: {
                    submissionId,
                    score,
                    gradingItems,
                    feedback: gradingResult
                }
            })
        };

    } catch (error) {
        console.error('AI批改錯誤:', error);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                message: error.message || 'AI批改發生未知錯誤'
            })
        };
    }
};