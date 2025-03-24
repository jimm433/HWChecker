const { OpenAI } = require('openai');
const mammoth = require('mammoth');
const PDFParser = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class AIGradingService {
    constructor() {
        // 初始化 OpenAI 客戶端
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // 支持的文件類型
        this.supportedFileTypes = ['.pdf', '.docx', '.txt'];
    }

    // 文件內容提取
    async extractFileContent(filePath) {
        const fileExtension = path.extname(filePath).toLowerCase();

        try {
            switch (fileExtension) {
                case '.pdf':
                    const pdfBuffer = await fs.readFile(filePath);
                    const pdfData = await PDFParser(pdfBuffer);
                    return pdfData.text;

                case '.docx':
                    const docxBuffer = await fs.readFile(filePath);
                    const result = await mammoth.extractRawText({ buffer: docxBuffer });
                    return result.value;

                case '.txt':
                    return await fs.readFile(filePath, 'utf-8');

                default:
                    throw new Error('不支持的文件類型');
            }
        } catch (error) {
            console.error('文件內容提取錯誤:', error);
            throw error;
        }
    }

    // 生成評分提示
    generateGradingPrompt(questionContent, studentContent, options = {}) {
        const strictness = options.strictness || 'normal';
        const detailLevel = options.detailLevel || 'normal';

        const gradingCriteria = [
            { name: '程式正確性', weight: 30, description: '程式能否正確執行並產生期望的輸出' },
            { name: '程式效率', weight: 20, description: '演算法的時間和空間複雜度' },
            { name: '程式碼風格', weight: 20, description: '代碼的可讀性、註解和命名規範' },
            { name: '程式架構', weight: 20, description: '程式的模組化設計和代碼組織' },
            { name: '報告完整性', weight: 10, description: '文檔和說明的完整性' }
        ];

        const strictnessDescriptions = {
            lenient: '寬鬆評分，著重於學生的學習過程和基本邏輯',
            normal: '標準評分，平衡技術細節和整體表現',
            strict: '嚴格評分，對每個細節都有較高要求'
        };

        return `你是一位專業的程式碼批改助教，請根據以下題目與答案進行全面、細緻的評分：

【評分模式】: ${strictnessDescriptions[strictness]}
【詳細程度】: ${detailLevel}

題目內容：
---
${questionContent || '未提供題目'}
---

學生答案：
---
${studentContent}
---

評分準則：
${gradingCriteria.map(c => `- ${c.name} (${c.weight}%): ${c.description}`).join('\n')}

評分要求：
1. 提供每個評分標準的具體評論
2. 指出常見錯誤與具體修正建議
3. 標明每個標準的得分與扣分原因
4. 最終給出總分 (0-100分)

回覆格式：
【各評分標準詳細評論】
- 具體評分點
- 扣分原因 / 改進建議

【總體評語】
- 優點總結
- 需要改進的關鍵點

總分：xx/100
`;
    }

    // AI批改主方法
    async gradeAssignment(assignmentData, options = {}) {
        try {
            // 創建對話線程
            const thread = await this.client.beta.threads.create();

            // 準備批改提示
            const gradingPrompt = this.generateGradingPrompt(
                assignmentData.questionContent, 
                assignmentData.content, 
                options
            );

            // 創建消息
            await this.client.beta.threads.messages.create({
                thread_id: thread.id,
                role: "user",
                content: gradingPrompt
            });

            // 執行 AI 批改
            const run = await this.client.beta.threads.runs.create({
                thread_id: thread.id,
                assistant_id: process.env.OPENAI_ASSISTANT_ID || 'asst_default'
            });

            // 等待批改完成
            let runStatus;
            do {
                runStatus = await this.client.beta.threads.runs.retrieve({
                    thread_id: thread.id,
                    run_id: run.id
                });
                await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒輪詢一次
            } while (runStatus.status !== 'completed');

            // 獲取批改結果
            const messages = await this.client.beta.threads.messages.list({
                thread_id: thread.id
            });

            const gradingResult = messages.data[0].content[0].text.value;

            // 解析結果中的分數
            const scoreMatch = gradingResult.match(/總分[：:]\s*(\d+)/);
            const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

            // 解析評分項目
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
                score,
                feedback: gradingResult,
                gradingItems
            };

        } catch (error) {
            console.error('AI批改失敗:', error);
            throw error;
        }
    }

    // 批次批改方法
    async batchGradeAssignments(submissions, options = {}) {
        const results = [];

        for (const submission of submissions) {
            try {
                const result = await this.gradeAssignment(submission, options);
                
                results.push({
                    id: submission.id,
                    ...result
                });
            } catch (error) {
                console.error(`批改 ${submission.id} 失敗:`, error);
                results.push({
                    id: submission.id,
                    error: error.message
                });
            }
        }

        return results;
    }

    // 生成評分建議
    async getGradingSuggestion(assignmentType, course) {
        try {
            const suggestionPrompt = `
為${course}課程的${assignmentType}生成一個詳細的評分建議：

1. 定義評分標準
2. 列出常見評分點
3. 提供評分細節
4. 建議扣分範圍
5. 給出改進建議模板
`;

            const response = await this.client.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: suggestionPrompt }]
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('生成評分建議失敗:', error);
            throw error;
        }
    }
}

module.exports = AIGradingService;