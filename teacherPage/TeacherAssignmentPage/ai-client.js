/**
 * AI Client Module
 * 處理與AI服務API的通信
 */

class AIClient {
    constructor(baseUrl, apiKey = null) {
        this.baseUrl = baseUrl || '/api/ai';
        this.apiKey = apiKey;
        this.requestQueue = [];
        this.processing = false;
    }

    /**
     * 設置API密鑰
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * 設置基本URL
     */
    setBaseUrl(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * 建立請求頭
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        return headers;
    }

    /**
     * 發送API請求
     */
    async sendRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`正在發送 ${method} 請求到: ${url}`);
        
        const options = {
            method,
            headers: this.getHeaders(),
            credentials: 'include'
        };
    
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
            console.log('請求數據:', data);
        }
    
        try {
            console.log('完整請求配置:', options);
            const response = await fetch(url, options);
            
            console.log(`收到響應，狀態碼: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API請求失敗: ${response.status} ${response.statusText} - ${errorText}`);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
    
            const responseData = await response.json();
            console.log('響應數據:', responseData);
            return responseData;
        } catch (error) {
            console.error('API請求錯誤:', error);
            throw error;
        }
    }

    /**
     * 提交作業進行AI批改
     * @param {Object} assignment - 作業資料，應包含id、studentId、content等
     * @param {Object} options - 批改選項，如嚴格程度、評分標準等
     * @returns {Promise} - 返回批改結果的Promise
     */
    async gradeAssignment(assignment, options = {}) {
        const endpoint = '/grade';
        const data = {
            assignment,
            options
        };

        return this.sendRequest(endpoint, 'POST', data);
    }

    /**
     * 批次批改多個作業
     * @param {Array} assignments - 作業列表
     * @param {Object} options - 批改選項
     * @param {Function} onProgress - 進度回調函數
     * @returns {Promise} - 返回所有批改結果的Promise
     */
    async batchGradeAssignments(assignments, options = {}, onProgress = null) {
        const endpoint = '/batch-grade';
        const data = {
            assignments,
            options
        };

        // 如果需要進度回調，可以使用WebSocket或定期輪詢狀態
        // 這裡使用簡單的方式直接發送批次請求
        const response = await this.sendRequest(endpoint, 'POST', data);
        
        if (response.batchId) {
            // 返回批次ID，客戶端可以使用此ID查詢批次進度
            return response;
        } else {
            // 或者直接返回結果（如果API設計為同步返回）
            return response.results;
        }
    }

    /**
     * 檢查批次批改進度
     * @param {string} batchId - 批次ID
     * @returns {Promise} - 返回批次進度的Promise
     */
    async checkBatchProgress(batchId) {
        const endpoint = `/batch-progress/${batchId}`;
        return this.sendRequest(endpoint);
    }

    /**
     * 檢查作業批改狀態
     * @param {string} assignmentId - 作業ID
     * @returns {Promise} - 返回批改狀態的Promise
     */
    async checkGradingStatus(assignmentId) {
        const endpoint = `/status/${assignmentId}`;
        return this.sendRequest(endpoint);
    }

    /**
     * 獲取AI評分建議
     * @param {string} assignmentType - 作業類型
     * @param {string} course - 課程名稱
     * @returns {Promise} - 返回評分建議的Promise
     */
    async getGradingSuggestion(assignmentType, course) {
        const endpoint = `/suggestion?type=${encodeURIComponent(assignmentType)}&course=${encodeURIComponent(course)}`;
        return this.sendRequest(endpoint);
    }

    /**
     * 更新AI模型設置
     * @param {Object} settings - AI模型設置
     * @returns {Promise} - 返回更新結果的Promise
     */
    async updateModelSettings(settings) {
        const endpoint = '/settings';
        return this.sendRequest(endpoint, 'PUT', settings);
    }

    /**
     * 獲取AI模型設置
     * @returns {Promise} - 返回AI模型設置的Promise
     */
    async getModelSettings() {
        const endpoint = '/settings';
        return this.sendRequest(endpoint);
    }

    /**
     * 取消批改任務
     * @param {string} assignmentId - 作業ID
     * @returns {Promise} - 返回取消結果的Promise
     */
    async cancelGrading(assignmentId) {
        const endpoint = `/cancel/${assignmentId}`;
        return this.sendRequest(endpoint, 'POST');
    }
}

// 導出AI客戶端類
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIClient;
} else {
    window.AIClient = AIClient;
}

