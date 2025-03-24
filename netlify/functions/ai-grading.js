// 增強版AI批改函數
const { OpenAI } = require('openai');
const mammoth = require('mammoth');
const PDFParser = require('pdf-parse');
const fs = require('fs').promises;

class EnhancedAIGrading {
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

    // 高級AI批改方法
    async gradingWithOpenAI(assignmentData, gradingOptions) {
        try {
            // 創建對話線程
            const thread = await this.client.beta.threads.create();

            // 準備批改提示
            const gradingPrompt = `
你是一個專業的程式碼批改助教，請根據以下「題目內容」與「學生答案」進行全面評分與回饋：

題目內容：
---
${assignmentData.questionContent}
---

學生答案：
---
${assignmentData.studentContent}
---

評分標準：
- 程式正確性 (30%)
- 程式效率 (20%)
- 程式碼風格 (20%)
- 程式架構 (20%)
- 報告完整性 (10%)

請提供：
1. 對每個評分標準的具體評論
2. 常見錯誤與修正建議
3. 具體的分數與扣分原因
4. 最後給出總分 (0-100分)

回覆格式：
【評分標準】
- 具體評論
- 扣分原因

【總體評語】
- 優點
- 需要改進的地方

總分：xx/100
`;

            // 創建消息
            await this.client.beta.threads.messages.create({
                thread_id: thread.id,
                role: "user",
                content: gradingPrompt
            });

            // 執行 AI 批改
            const run = await this.client.beta.threads.runs.create({
                thread_id: thread.id,
                assistant_id: process.env.OPENAI_ASSISTANT_ID // 配置文件中預先設置
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

            return {
                score: score,
                feedback: gradingResult,
                gradingItems: this.parseGradingItems(gradingResult)
            };

        } catch (error) {
            console.error('AI批改失敗:', error);
            throw error;
        }
    }

    // 輔助方法：解析評分項目
    parseGradingItems(gradingResult) {
        const items = [
            { name: '程式正確性', maxScore: 30 },
            { name: '程式效率', maxScore: 20 },
            { name: '程式碼風格', maxScore: 20 },
            { name: '程式架構', maxScore: 20 },
            { name: '報告完整性', maxScore: 10 }
        ];

        return items.map(item => {
            const regex = new RegExp(`${item.name}[：:]\s*(-?\d+)`);
            const match = gradingResult.match(regex);
            const score = match ? parseInt(match[1]) : 0;

            return {
                ...item,
                score: score
            };
        });
    }

    // 批次批改方法
    async batchGrading(submissions, gradingOptions) {
        const results = [];

        for (const submission of submissions) {
            try {
                // 提取題目與答案內容
                const questionContent = await this.extractFileContent(submission.questionFilePath);
                const studentContent = await this.extractFileContent(submission.answerFilePath);

                const gradingData = {
                    questionContent,
                    studentContent
                };

                const result = await this.gradingWithOpenAI(gradingData, gradingOptions);
                
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
}

module.exports = EnhancedAIGrading;