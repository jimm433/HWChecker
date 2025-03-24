// 前端AI服務封裝 - 放在assignment-grading.js文件中或創建一個新的ai-client.js

// AI提供商類型
const AI_PROVIDER = {
    GPT: 'gpt',
    CLAUDE: 'claude'
  };
  
  /**
   * AI批改服務類
   */
  class AIGradingService {
    constructor() {
      // API端點
      this.apiBaseUrl = '/.netlify/functions/ai-grading';
      
      // 本地開發環境檢測
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        this.apiBaseUrl = 'http://localhost:3000/.netlify/functions/ai-grading';
      }
    }
  
    /**
     * 使用GPT批改作業
     * @param {Object} assignmentData 作業數據
     * @param {Object} gradingOptions 評分選項
     * @returns {Promise<Object>} 批改結果
     */
    async gradeWithGPT(assignmentData, gradingOptions) {
      return this.gradeAssignment(AI_PROVIDER.GPT, assignmentData, gradingOptions);
    }
  
    /**
     * 使用Claude批改作業
     * @param {Object} assignmentData 作業數據
     * @param {Object} gradingOptions 評分選項
     * @returns {Promise<Object>} 批改結果
     */
    async gradeWithClaude(assignmentData, gradingOptions) {
      return this.gradeAssignment(AI_PROVIDER.CLAUDE, assignmentData, gradingOptions);
    }
  
    /**
     * 批改作業
     * @param {string} provider AI提供商
     * @param {Object} assignmentData 作業數據
     * @param {Object} gradingOptions 評分選項
     * @returns {Promise<Object>} 批改結果
     */
    async gradeAssignment(provider, assignmentData, gradingOptions) {
      try {
        // 請求端點
        const endpoint = `${this.apiBaseUrl}/${provider}`;
        
        // 發送請求
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 如果有認證需求，可以在此添加
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            assignmentData,
            gradingOptions
          })
        });
  
        // 解析回應
        const result = await response.json();
        
        // 檢查是否成功
        if (!result.success) {
          throw new Error(result.message || `${provider}批改失敗`);
        }
        
        return result.result;
      } catch (error) {
        console.error(`${provider}批改失敗:`, error);
        throw error;
      }
    }
  
    /**
     * 批次批改作業
     * @param {Array<Object>} submissions 作業提交列表
     * @param {string} provider AI提供商
     * @param {Object} gradingOptions 評分選項
     * @returns {Promise<Object>} 批次批改結果
     */
    async batchGradeAssignments(submissions, provider, gradingOptions) {
      try {
        // 請求端點
        const endpoint = `${this.apiBaseUrl}/batch`;
        
        // 發送請求
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 如果有認證需求，可以在此添加
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            submissions,
            aiProvider: provider,
            gradingOptions
          })
        });
  
        // 解析回應
        const result = await response.json();
        
        // 檢查是否成功
        if (!result.success) {
          throw new Error(result.message || '批次批改失敗');
        }
        
        return result;
      } catch (error) {
        console.error('批次批改失敗:', error);
        throw error;
      }
    }
  }
  
  // 創建AI批改服務實例
  const aiGradingService = new AIGradingService();
  
  /**
   * AI批改單個作業
   * 您可以將此函數集成到您的assignment-grading.js文件中
   */
  async function aiGradeAssignment(submission) {
    if (isAiGrading) {
      alert('AI批改正在進行中，請稍候...');
      return;
    }
    
    // 更新UI狀態
    document.getElementById('ai-status-value').textContent = '處理中';
    document.getElementById('ai-status-value').classList.add('pulsing');
    document.getElementById('trigger-ai-grade').disabled = true;
    isAiGrading = true;
    
    try {
      // 獲取選定的AI提供商
      const aiProvider = document.getElementById('ai-provider-select').value;
      
      // 獲取評分標準設置
      const gradingCriteria = document.getElementById('grading-criteria').value;
      const feedbackLevel = document.getElementById('ai-feedback-level').value;
      
      // 準備評分選項
      const gradingOptions = {
        strictness: gradingCriteria,
        detailLevel: feedbackLevel
      };
      
      // 準備作業數據
      const assignmentData = {
        courseName: submission.courseName,
        assignmentName: submission.assignmentName,
        content: submission.content,
        studentId: submission.studentId,
        studentName: submission.studentName
      };
      
      // 調用AI服務獲取評分
      let aiGrade;
      if (aiProvider === AI_PROVIDER.GPT) {
        aiGrade = await aiGradingService.gradeWithGPT(assignmentData, gradingOptions);
      } else {
        aiGrade = await aiGradingService.gradeWithClaude(assignmentData, gradingOptions);
      }
      
      // 更新作業數據
      submission.aiStatus = '已完成';
      submission.aiScore = aiGrade.score;
      submission.aiGrade = aiGrade;
      
      // 更新UI
      document.getElementById('ai-status-value').textContent = '已完成';
      document.getElementById('ai-status-value').classList.remove('pulsing');
      document.getElementById('ai-score').textContent = aiGrade.score;
      document.getElementById('ai-comments').textContent = aiGrade.feedback;
      
      // 更新評分項目表格
      const aiGradingItemsTable = document.getElementById('ai-grading-items').querySelector('tbody');
      aiGradingItemsTable.innerHTML = aiGrade.gradingItems.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.score}</td>
          <td>${item.maxScore}</td>
          <td>${item.comment}</td>
        </tr>
      `).join('');
      
      // 啟用"採用AI評分"選項
      document.getElementById('accept-ai-grade').disabled = false;
      
      // 重新渲染作業列表
      renderAssignmentList(currentAssignments);
      
      // 顯示成功提示
      console.log(`${aiProvider === AI_PROVIDER.GPT ? 'GPT' : 'Claude'} 評分完成，分數: ${aiGrade.score}`);
      
    } catch (error) {
      console.error('AI批改失敗:', error);
      
      // 更新UI狀態為失敗
      submission.aiStatus = '失敗';
      document.getElementById('ai-status-value').textContent = '失敗';
      document.getElementById('ai-status-value').classList.remove('pulsing');
      
      // 提示錯誤
      alert(`AI批改失敗: ${error.message}`);
      
    } finally {
      isAiGrading = false;
      document.getElementById('trigger-ai-grade').disabled = false;
    }
  }
  
  /**
   * 批次批改作業
   * 您可以將此函數集成到您的assignment-grading.js文件中
   */
  async function batchGradeAssignments() {
    // 找出所有未處理的作業
    const pendingAssignments = currentAssignments.filter(s => s.aiStatus === '未處理');
    
    if (pendingAssignments.length === 0) {
      alert('沒有待處理的作業');
      return;
    }
    
    const confirmMessage = `確定要批次批改 ${pendingAssignments.length} 份作業嗎？
  此操作將使用AI批改所有未處理的作業。`;
    
    if (confirm(confirmMessage)) {
      // 獲取選定的AI提供商
      const aiProvider = document.getElementById('ai-provider-select').value;
      
      // 顯示處理中的訊息
      alert(`開始批次批改 ${pendingAssignments.length} 份作業，請稍候...`);
      
      // 獲取評分標準設置
      const gradingCriteria = document.getElementById('grading-criteria').value;
      const feedbackLevel = document.getElementById('ai-feedback-level').value;
      
      // 準備評分選項
      const gradingOptions = {
        strictness: gradingCriteria,
        detailLevel: feedbackLevel
      };
      
      // 準備作業數據
      const submissions = pendingAssignments.map(submission => ({
        id: submission.id,
        courseName: submission.courseName,
        assignmentName: submission.assignmentName,
        content: submission.content,
        studentId: submission.studentId,
        studentName: submission.studentName
      }));
      
      try {
        // 更新UI狀態
        pendingAssignments.forEach(submission => {
          submission.aiStatus = '處理中';
        });
        renderAssignmentList(currentAssignments);
        
        // 調用批次批改API
        const batchResult = await aiGradingService.batchGradeAssignments(
          submissions, 
          aiProvider, 
          gradingOptions
        );
        
        // 更新批改結果
        batchResult.results.forEach(result => {
          const submission = pendingAssignments.find(s => s.id === result.id);
          if (submission) {
            submission.aiStatus = '已完成';
            submission.aiScore = result.result.score;
            submission.aiGrade = result.result;
          }
        });
        
        // 更新失敗的項目
        batchResult.errors.forEach(error => {
          const submission = pendingAssignments.find(s => s.id === error.id);
          if (submission) {
            submission.aiStatus = '失敗';
          }
        });
        
        // 更新UI
        renderAssignmentList(currentAssignments);
        
        // 完成所有處理後通知
        alert(`批次批改完成！成功處理 ${batchResult.completed} 份作業，失敗 ${batchResult.failed} 份。`);
        
      } catch (error) {
        console.error('批次批改請求失敗:', error);
        
        // 更新UI狀態為失敗
        pendingAssignments.forEach(submission => {
          submission.aiStatus = '失敗';
        });
        renderAssignmentList(currentAssignments);
        
        // 提示錯誤
        alert(`批次批改失敗: ${error.message}`);
      }
    }
  }
  
  // 將以上代碼整合到您的assignment-grading.js文件中
  // 或者創建一個單獨的文件並在HTML中引入