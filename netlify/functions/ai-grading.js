// ai-grading.js - 專門用於AI批改功能的服務文件

const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
require('dotenv').config();

// 創建Express應用
const app = express();
const router = express.Router();

// 啟用CORS和JSON解析
app.use(cors());
app.use(express.json());

// GPT批改端點
router.post('/gpt', async (req, res) => {
  try {
    // 獲取請求數據
    const { assignmentData, gradingOptions } = req.body;
    
    // 驗證請求數據
    if (!assignmentData || !assignmentData.content) {
      return res.status(400).json({ success: false, message: '缺少作業內容' });
    }
    
    // 調用OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `你是一個專業的程式設計教師助手，負責批改學生的程式作業。
            請基於以下標準進行評分：
            ${JSON.stringify(gradingOptions?.criteria || getDefaultCriteria())}
            嚴格程度: ${gradingOptions?.strictness || 'normal'}
            詳細程度: ${gradingOptions?.detailLevel || 'normal'}
            請提供詳細的評分，包括總分和每個標準的得分，以及具體的評語和改進建議。`
          },
          {
            role: "user",
            content: `請評分以下作業：
            課程：${assignmentData.courseName || '未指定課程'}
            作業標題：${assignmentData.assignmentName || '未指定作業名稱'}
            學生代碼：
            \`\`\`
            ${assignmentData.content}
            \`\`\`
            請提供詳盡的評分結果，包括總分(滿分100)、各評分項目的得分、優點、缺點和改進建議。`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || '請求GPT API失敗');
    }

    // 處理GPT回應
    const processedResult = processGPTResponse(result);
    
    // 回傳結果
    res.json({
      success: true,
      result: processedResult
    });
    
  } catch (error) {
    console.error('GPT評分失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '處理請求時發生錯誤'
    });
  }
});

// Claude API端點
router.post('/claude', async (req, res) => {
  try {
    // 獲取請求數據
    const { assignmentData, gradingOptions } = req.body;
    
    // 驗證請求數據
    if (!assignmentData || !assignmentData.content) {
      return res.status(400).json({ success: false, message: '缺少作業內容' });
    }
    
    // 調用Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1500,
        temperature: 0.3,
        system: `你是一個專業的程式設計教師助手，負責批改學生的程式作業。
        請基於以下標準進行評分：
        ${JSON.stringify(gradingOptions?.criteria || getDefaultCriteria())}
        嚴格程度: ${gradingOptions?.strictness || 'normal'}
        詳細程度: ${gradingOptions?.detailLevel || 'normal'}
        請提供詳細的評分，包括總分和每個標準的得分，以及具體的評語和改進建議。`,
        messages: [
          {
            role: "user",
            content: `請評分以下作業：
            課程：${assignmentData.courseName || '未指定課程'}
            作業標題：${assignmentData.assignmentName || '未指定作業名稱'}
            學生代碼：
            \`\`\`
            ${assignmentData.content}
            \`\`\`
            請提供詳盡的評分結果，包括總分(滿分100)、各評分項目的得分、優點、缺點和改進建議。在回應的開始，請提供一個JSON格式的評分數據，格式如下：
            \`\`\`json
            {
              "score": 85,
              "gradingItems": [
                {"name": "程式正確性", "score": 25, "maxScore": 30, "comment": "..."},
                {"name": "程式效率", "score": 16, "maxScore": 20, "comment": "..."},
                {"name": "程式碼風格", "score": 18, "maxScore": 20, "comment": "..."},
                {"name": "程式架構", "score": 16, "maxScore": 20, "comment": "..."},
                {"name": "報告完整性", "score": 8, "maxScore": 10, "comment": "..."}
              ],
              "summary": "整體評語摘要...",
              "detailedFeedback": "詳細評語..."
            }
            \`\`\`
            之後請提供詳細的文字評語。`
          }
        ]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error?.message || '請求Claude API失敗');
    }

    // 處理Claude回應
    const processedResult = processClaudeResponse(result);
    
    // 回傳結果
    res.json({
      success: true,
      result: processedResult
    });
    
  } catch (error) {
    console.error('Claude評分失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '處理請求時發生錯誤'
    });
  }
});

// 批次批改端點
router.post('/batch', async (req, res) => {
  try {
    const { submissions, aiProvider, gradingOptions } = req.body;
    
    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
      return res.status(400).json({ success: false, message: '缺少有效的作業提交列表' });
    }
    
    // 選擇處理函數
    const processFn = aiProvider === 'claude' ? processSubmissionWithClaude : processSubmissionWithGPT;
    
    // 批次處理結果
    const results = [];
    const errors = [];
    
    // 逐一處理每個提交
    for (const submission of submissions) {
      try {
        const result = await processFn(submission, gradingOptions);
        results.push({
          id: submission.id,
          success: true,
          result: result
        });
      } catch (error) {
        console.error(`批改作業 ${submission.id} 失敗:`, error);
        errors.push({
          id: submission.id,
          message: error.message
        });
      }
    }
    
    // 返回批次處理結果
    res.json({
      success: true,
      completed: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });
    
  } catch (error) {
    console.error('批次批改失敗:', error);
    res.status(500).json({
      success: false,
      message: error.message || '處理批次請求時發生錯誤'
    });
  }
});

// 處理GPT回應的函數
function processGPTResponse(apiResponse) {
  const content = apiResponse.choices[0].message.content;
  
  // 解析內容以提取關鍵信息
  const scoreMatch = content.match(/總分[：:]\s*(\d+)/);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  
  // 解析評分項目
  const gradingItems = [];
  const itemRegex = /([^:：]+)[：:]\s*(\d+)\s*\/\s*(\d+)[^，。,.]*(.*?)(?=\n|$)/g;
  let match;
  
  while ((match = itemRegex.exec(content)) !== null) {
    gradingItems.push({
      name: match[1].trim(),
      score: parseInt(match[2]),
      maxScore: parseInt(match[3]),
      comment: match[4].trim()
    });
  }
  
  // 提取摘要
  const summaryMatch = content.match(/摘要[:：]?\s*([\s\S]*?)(?=\n\n|\n#|$)/i) || 
                     content.match(/總評[:：]?\s*([\s\S]*?)(?=\n\n|\n#|$)/i) ||
                     content.match(/總結[:：]?\s*([\s\S]*?)(?=\n\n|\n#|$)/i);
  
  const summary = summaryMatch && summaryMatch[1] ? 
    summaryMatch[1].trim() : content.substring(0, 200) + '...';
  
  return {
    score: score,
    gradingItems: gradingItems,
    summary: summary,
    feedback: content
  };
}

// 處理Claude回應的函數
function processClaudeResponse(apiResponse) {
  const content = apiResponse.content[0].text;
  
  // 嘗試從回應中提取JSON
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      const gradingData = JSON.parse(jsonMatch[1]);
      
      // 如果JSON解析成功，直接返回解析後的數據
      return {
        score: gradingData.score,
        gradingItems: gradingData.gradingItems,
        summary: gradingData.summary,
        feedback: gradingData.detailedFeedback || content
      };
    } catch (e) {
      console.warn('無法解析Claude回應中的JSON，將使用備用解析方法', e);
    }
  }
  
  // 備用解析方法：使用與GPT相同的解析邏輯
  return processGPTResponse({
    choices: [{ message: { content: content } }]
  });
}

// 使用GPT處理單個提交
async function processSubmissionWithGPT(submission, gradingOptions) {
  // 調用OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `你是一個專業的程式設計教師助手，負責批改學生的程式作業。
          請基於以下標準進行評分：
          ${JSON.stringify(gradingOptions?.criteria || getDefaultCriteria())}
          嚴格程度: ${gradingOptions?.strictness || 'normal'}
          詳細程度: ${gradingOptions?.detailLevel || 'normal'}
          請提供詳細的評分，包括總分和每個標準的得分，以及具體的評語和改進建議。`
        },
        {
          role: "user",
          content: `請評分以下作業：
          課程：${submission.courseName || '未指定課程'}
          作業標題：${submission.assignmentName || '未指定作業名稱'}
          學生代碼：
          \`\`\`
          ${submission.content}
          \`\`\`
          請提供詳盡的評分結果，包括總分(滿分100)、各評分項目的得分、優點、缺點和改進建議。`
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error?.message || '請求GPT API失敗');
  }

  // 處理GPT回應
  return processGPTResponse(result);
}

// 使用Claude處理單個提交
async function processSubmissionWithClaude(submission, gradingOptions) {
  // 調用Anthropic API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: "claude-3-opus-20240229",
      max_tokens: 1500,
      temperature: 0.3,
      system: `你是一個專業的程式設計教師助手，負責批改學生的程式作業。
      請基於以下標準進行評分：
      ${JSON.stringify(gradingOptions?.criteria || getDefaultCriteria())}
      嚴格程度: ${gradingOptions?.strictness || 'normal'}
      詳細程度: ${gradingOptions?.detailLevel || 'normal'}
      請提供詳細的評分，包括總分和每個標準的得分，以及具體的評語和改進建議。`,
      messages: [
        {
          role: "user",
          content: `請評分以下作業：
          課程：${submission.courseName || '未指定課程'}
          作業標題：${submission.assignmentName || '未指定作業名稱'}
          學生代碼：
          \`\`\`
          ${submission.content}
          \`\`\`
          請提供詳盡的評分結果，包括JSON格式的評分數據。`
        }
      ]
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error?.message || '請求Claude API失敗');
  }

  // 處理Claude回應
  return processClaudeResponse(result);
}

// 獲取默認評分標準
function getDefaultCriteria() {
  return [
    { name: '程式正確性', weight: 30, description: '程式能否正確執行並產生期望的輸出' },
    { name: '程式效率', weight: 20, description: '演算法的時間和空間複雜度' },
    { name: '程式碼風格', weight: 20, description: '代碼的可讀性、註解和命名規範' },
    { name: '程式架構', weight: 20, description: '程式的模組化設計和代碼組織' },
    { name: '報告完整性', weight: 10, description: '文檔和說明的完整性' }
  ];
}

// 設置API路由
app.use('/.netlify/functions/ai-grading', router);

// 設置服務器端口
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`AI批改服務運行於 http://localhost:${PORT}`);
  });
}

// 為Netlify函數導出handler
module.exports.handler = serverless(app);