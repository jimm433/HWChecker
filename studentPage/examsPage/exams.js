document.addEventListener('DOMContentLoaded', function() {
    // 從 localStorage 讀取用戶資訊
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    // 檢查是否已登入
    if (!userId || !userName || userRole !== 'student') {
        // 未登入或不是學生，重定向到登入頁面
        alert('請先登入');
        window.location.href = '../../index.html';
        return;
    }
    
    // 更新頁面上的學生資訊
    updateUserInfo(userName);
    
    // DOM 元素
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const examDetailModal = document.getElementById('exam-detail-modal');
    const resourceDetailModal = document.getElementById('resource-detail-modal');
    const closeButtons = document.querySelectorAll('.close');
    
    // 統計數據元素
    const totalExamsEl = document.getElementById('total-exams');
    const upcomingExamsEl = document.getElementById('upcoming-exams');
    const completedExamsEl = document.getElementById('completed-exams');
    const averageScoreEl = document.getElementById('average-score');
    
    // 考試列表容器
    const upcomingList = document.getElementById('upcoming-list');
    const completedList = document.getElementById('completed-list');
    const resourceList = document.getElementById('resource-list');
    
    // 初始化頁面
    initPage();
    
    // 初始化頁面
    function initPage() {
        // 設置事件監聽器
        setupEventListeners();
        
        // 載入考試數據
        loadExams();
        
        // 載入考試資源
        loadResources();
    }
    
    // 設置事件監聽器
    function setupEventListeners() {
        // 標籤切換事件
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });
        
        // 關閉模態窗口
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                examDetailModal.style.display = 'none';
                resourceDetailModal.style.display = 'none';
            });
        });
        
        // 點擊模態窗口外部關閉
        window.addEventListener('click', function(event) {
            if (event.target === examDetailModal) {
                examDetailModal.style.display = 'none';
            }
            if (event.target === resourceDetailModal) {
                resourceDetailModal.style.display = 'none';
            }
        });
        
// 側邊欄選單導航
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const page = this.textContent.trim();
        
        // 先移除所有 active 類
        document.querySelectorAll('.menu-item').forEach(menuItem => {
            menuItem.classList.remove('active');
        });
        
        // 如果點擊的不是當前頁面，則導航到對應頁面
        if (page !== '考試') {
            switch (page) {
                case '儀表板':
                    window.location.href = '../student-dashboard.html';
                    break;
                case '作業':
                    window.location.href = '../assignmentsPage/assignments.html';
                    break;
                case '成績':
                    window.location.href = '../gradesPage/grades.html';
                    break;
                case '公告':
                    window.location.href = '../announcementsPage/announcements.html';
                    break;
            }
        } else {
            // 當前頁面，加上 active 類
            this.classList.add('active');
        }
    });
});
        
        // 登出功能
        document.querySelector('.logout').addEventListener('click', function() {
            if (confirm('確定要登出嗎？')) {
                // 清除 localStorage 中的用戶資訊
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
                
                window.location.href = '../../index.html';
            }
        });
    }
    
    // 切換標籤頁
    function switchTab(tabId) {
        // 更新標籤狀態
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // 更新內容顯示
        tabContents.forEach(content => {
            if (content.id === `${tabId}-content`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }
    
    // 載入考試數據
    function loadExams() {
        // 模擬 API 調用 - 在實際應用中，這裡會從後端獲取數據
        setTimeout(() => {
            // 模擬從 API 獲取的考試數據
            const exams = [
                {
                    id: 'exam001',
                    title: '程式設計期中考',
                    course: '程式設計',
                    datetime: '2025/04/15 10:00',
                    location: '資訊大樓 301 教室',
                    status: 'upcoming',
                    description: '考試範圍：第1-7章，包含變數、運算式、條件判斷、迴圈與函式。考試形式：筆試(選擇題40%、程式題60%)。',
                    duration: '90分鐘',
                    scope: '第1-7章 (變數、運算式、條件判斷、迴圈、函式)',
                    resources: [
                        {
                            id: 'resource001',
                            title: '期中考複習講義',
                            type: 'pdf'
                        },
                        {
                            id: 'resource002',
                            title: '期中考範例題',
                            type: 'doc'
                        }
                    ]
                },
                {
                    id: 'exam002',
                    title: '資料結構小考',
                    course: '資料結構',
                    datetime: '2025/03/20 14:00',
                    location: '資訊大樓 305 教室',
                    status: 'upcoming',
                    description: '小考範圍：陣列與鏈結串列。考試形式：筆試(選擇題30%、程式題70%)。',
                    duration: '60分鐘',
                    scope: '陣列與鏈結串列',
                    resources: [
                        {
                            id: 'resource003',
                            title: '小考複習講義',
                            type: 'pdf'
                        }
                    ]
                },
                {
                    id: 'exam003',
                    title: '計算機概論期中考',
                    course: '計算機概論',
                    datetime: '2025/02/20 09:00',
                    location: '資訊大樓 201 教室',
                    status: 'completed',
                    description: '考試範圍：第1-6章。考試形式：筆試(選擇題50%、問答題50%)。',
                    duration: '90分鐘',
                    scope: '第1-6章 (計算機發展歷史、數位系統、電腦組成)',
                    result: '85分',
                    feedback: '整體表現優良，但在電腦組成部分的理解還需加強。',
                    resources: []
                },
                {
                    id: 'exam004',
                    title: '程式設計期末考',
                    course: '程式設計',
                    datetime: '2024/12/20 13:30',
                    location: '資訊大樓 301 教室',
                    status: 'completed',
                    description: '考試範圍：第1-14章。考試形式：筆試(選擇題30%、程式題70%)。',
                    duration: '120分鐘',
                    scope: '第1-14章 (包含全部課程內容)',
                    result: '92分',
                    feedback: '程式設計能力優秀，邏輯思維清晰，能靈活運用課程所學解決問題。',
                    resources: []
                }
            ];
            
            // 更新統計數據
            updateStats(exams);
            
            // 渲染考試列表
            renderExams(exams);
        }, 500);
    }
    
    // 載入考試資源
    function loadResources() {
        // 模擬 API 調用
        setTimeout(() => {
            // 模擬從 API 獲取的資源數據
            const resources = [
                {
                    id: 'resource001',
                    title: '程式設計期中考複習講義',
                    course: '程式設計',
                    date: '2025/04/01',
                    type: 'pdf',
                    description: '涵蓋期中考範圍的複習資料，包含重點整理與練習題。',
                    fileName: '程式設計期中考複習講義.pdf'
                },
                {
                    id: 'resource002',
                    title: '程式設計期中考範例題',
                    course: '程式設計',
                    date: '2025/04/02',
                    type: 'doc',
                    description: '期中考可能出現的題型與解題方向。',
                    fileName: '程式設計期中考範例題.docx'
                },
                {
                    id: 'resource003',
                    title: '資料結構小考複習講義',
                    course: '資料結構',
                    date: '2025/03/10',
                    type: 'pdf',
                    description: '陣列與鏈結串列的概念整理與實作範例。',
                    fileName: '資料結構小考複習講義.pdf'
                },
                {
                    id: 'resource004',
                    title: '演算法課程複習影片',
                    course: '演算法',
                    date: '2025/03/15',
                    type: 'video',
                    description: '排序演算法的詳細解說與比較。',
                    fileName: '演算法複習影片.mp4'
                },
                {
                    id: 'resource005',
                    title: '期末考複習重點簡報',
                    course: '計算機概論',
                    date: '2024/12/10',
                    type: 'ppt',
                    description: '期末考範圍的重點整理與複習方向。',
                    fileName: '計算機概論期末複習.pptx'
                }
            ];
            
            // 渲染資源列表
            renderResources(resources);
        }, 600);
    }
    
    // 更新統計數據
    function updateStats(exams) {
        const total = exams.length;
        const upcoming = exams.filter(e => e.status === 'upcoming').length;
        const completed = exams.filter(e => e.status === 'completed').length;
        
        // 計算平均分數
        const completedExams = exams.filter(e => e.status === 'completed' && e.result);
        let averageScore = 0;
        
        if (completedExams.length > 0) {
            const totalScore = completedExams.reduce((sum, exam) => {
                // 從字串中提取數字
                const score = parseInt(exam.result);
                return sum + (isNaN(score) ? 0 : score);
            }, 0);
            
            averageScore = Math.round(totalScore / completedExams.length);
        }
        
        totalExamsEl.textContent = total;
        upcomingExamsEl.textContent = upcoming;
        completedExamsEl.textContent = completed;
        averageScoreEl.textContent = averageScore ? `${averageScore}分` : '-';
    }
    
    // 渲染考試列表
    function renderExams(exams) {
        // 清空列表
        upcomingList.innerHTML = '';
        completedList.innerHTML = '';
        
        // 分類考試並填充列表
        const upcomingExams = exams.filter(e => e.status === 'upcoming');
        const completedExams = exams.filter(e => e.status === 'completed');
        
        // 渲染即將舉行的考試
        if (upcomingExams.length === 0) {
            upcomingList.innerHTML = '<div class="empty-message">沒有即將舉行的考試</div>';
        } else {
            upcomingExams.forEach(exam => {
                const item = createExamItem(exam);
                upcomingList.appendChild(item);
            });
        }
        
        // 渲染已完成的考試
        if (completedExams.length === 0) {
            completedList.innerHTML = '<div class="empty-message">沒有已完成的考試記錄</div>';
        } else {
            completedExams.forEach(exam => {
                const item = createExamItem(exam);
                completedList.appendChild(item);
            });
        }
    }
    
    // 渲染考試資源
    function renderResources(resources) {
        // 清空列表
        resourceList.innerHTML = '';
        
        if (resources.length === 0) {
            resourceList.innerHTML = '<div class="empty-message">沒有可用的考試資源</div>';
            return;
        }
        
        // 建立資源列表
        resources.forEach(resource => {
            const item = createResourceItem(resource);
            resourceList.appendChild(item);
        });
    }
    
    // 創建考試列表項
    function createExamItem(exam) {
        const div = document.createElement('div');
        div.className = 'exam-item';
        
        // 檢查考試日期是否為今天
        const isToday = isExamToday(exam.datetime);
        
        // 根據狀態決定顯示的內容和操作
        let statusText = '';
        let statusClass = '';
        let actions = '';
        
        if (exam.status === 'upcoming') {
            statusText = isToday ? '今日考試' : '即將舉行';
            statusClass = isToday ? 'status-today' : 'status-upcoming';
            actions = `<button class="button button-small" onclick="openExamDetailModal('${exam.id}')">詳情</button>`;
        } else if (exam.status === 'completed') {
            statusText = `已完成: ${exam.result || '-'}`;
            statusClass = 'status-completed';
            actions = `<button class="button button-small" onclick="openExamDetailModal('${exam.id}')">查看結果</button>`;
        }
        
        // 計算倒數天數或顯示已完成日期
        let timeDisplay = '';
        if (exam.status === 'upcoming') {
            const daysRemaining = getDaysRemaining(exam.datetime);
            if (daysRemaining === 0) {
                timeDisplay = `<div class="countdown">今日 ${getTimeFromDatetime(exam.datetime)}</div>`;
            } else {
                timeDisplay = `<div>還有 ${daysRemaining} 天</div>`;
            }
        } else {
            timeDisplay = `<div>${formatDate(exam.datetime)}</div>`;
        }
        
        div.innerHTML = `
            <div class="exam-info">
                <div class="exam-title">${exam.title}</div>
                <div class="exam-meta">
                    <div>${exam.course}</div>
                    ${timeDisplay}
                    <div class="exam-status ${statusClass}">${statusText}</div>
                </div>
            </div>
            <div class="exam-actions">
                ${actions}
            </div>
        `;
        
        return div;
    }
    
    // 創建資源列表項
    function createResourceItem(resource) {
        const div = document.createElement('div');
        div.className = 'resource-item';
        
        // 根據資源類型設定圖標
        const iconClass = getResourceIconClass(resource.type);
        
        div.innerHTML = `
            <div class="resource-icon ${iconClass}">${getResourceIconText(resource.type)}</div>
            <div class="resource-info">
                <div class="resource-title">${resource.title}</div>
                <div class="resource-meta">
                    <div>${resource.course}</div>
                    <div>上傳日期: ${resource.date}</div>
                </div>
            </div>
            <div class="resource-actions">
                <button class="button button-small" onclick="openResourceDetailModal('${resource.id}')">查看</button>
                <button class="button button-small">下載</button>
            </div>
        `;
        
        return div;
    }
    
    // 打開考試詳情模態窗口
    window.openExamDetailModal = function(examId) {
        // 模擬從 API 獲取考試詳情
        let exam;
        
        if (examId === 'exam001') {
            exam = {
                id: 'exam001',
                title: '程式設計期中考',
                course: '程式設計',
                datetime: '2025/04/15 10:00',
                location: '資訊大樓 301 教室',
                status: 'upcoming',
                description: '考試範圍：第1-7章，包含變數、運算式、條件判斷、迴圈與函式。考試形式：筆試(選擇題40%、程式題60%)。',
                duration: '90分鐘',
                scope: '第1-7章 (變數、運算式、條件判斷、迴圈、函式)',
                resources: [
                    {
                        id: 'resource001',
                        title: '期中考複習講義',
                        type: 'pdf'
                    },
                    {
                        id: 'resource002',
                        title: '期中考範例題',
                        type: 'doc'
                    }
                ]
            };
        } else if (examId === 'exam003') {
            exam = {
                id: 'exam003',
                title: '計算機概論期中考',
                course: '計算機概論',
                datetime: '2025/02/20 09:00',
                location: '資訊大樓 201 教室',
                status: 'completed',
                description: '考試範圍：第1-6章。考試形式：筆試(選擇題50%、問答題50%)。',
                duration: '90分鐘',
                scope: '第1-6章 (計算機發展歷史、數位系統、電腦組成)',
                result: '85分',
                feedback: '整體表現優良，但在電腦組成部分的理解還需加強。',
                resources: []
            };
        } else {
            // 默認數據，實際應用中應從後端獲取
            exam = {
                id: examId,
                title: '考試詳情',
                course: '課程名稱',
                datetime: '2025/01/01 10:00',
                location: '教室位置',
                status: 'upcoming',
                description: '考試說明...',
                duration: '90分鐘',
                scope: '考試範圍...',
                resources: []
            };
        }
        
        // 填充模態窗口內容
        document.getElementById('detail-title').textContent = exam.title;
        document.getElementById('detail-course').textContent = exam.course;
        document.getElementById('detail-datetime').textContent = exam.datetime;
        document.getElementById('detail-location').textContent = exam.location;
        document.getElementById('detail-description').textContent = exam.description;
        document.getElementById('detail-duration').textContent = exam.duration;
        document.getElementById('detail-scope').textContent = exam.scope;
        
        // 隱藏或顯示考試結果部分
        const resultSections = document.querySelectorAll('.result-section');
        if (exam.status === 'completed') {
            resultSections.forEach(section => {
                section.style.display = 'block';
            });
            document.getElementById('detail-result').textContent = exam.result || '-';
            document.getElementById('detail-feedback').textContent = exam.feedback || '暫無評語';
        } else {
            resultSections.forEach(section => {
                section.style.display = 'none';
            });
        }
        
        // 填充相關資源
        const resourcesContainer = document.getElementById('detail-resources');
        resourcesContainer.innerHTML = '';
        
        if (exam.resources && exam.resources.length > 0) {
            document.querySelector('.exam-resource-section').style.display = 'block';
            
            exam.resources.forEach(resource => {
                const resourceLink = document.createElement('a');
                resourceLink.href = '#';
                resourceLink.className = 'resource-link';
                resourceLink.textContent = resource.title;
                resourceLink.onclick = function(e) {
                    e.preventDefault();
                    openResourceDetailModal(resource.id);
                };
                
                resourcesContainer.appendChild(resourceLink);
            });
        } else {
            document.querySelector('.exam-resource-section').style.display = 'none';
        }
        
        // 顯示模態窗口
        examDetailModal.style.display = 'block';
    };
    
    // 打開資源詳情模態窗口
    window.openResourceDetailModal = function(resourceId) {
        // 模擬從 API 獲取資源詳情
        const resource = {
            id: resourceId,
            title: '程式設計期中考複習講義',
            course: '程式設計',
            date: '2025/04/01',
            type: 'pdf',
            description: '涵蓋期中考範圍的複習資料，包含重點整理與練習題。',
            fileName: '程式設計期中考複習講義.pdf'
        };
        
        // 填充模態窗口內容
        document.getElementById('resource-title').textContent = resource.title;
        document.getElementById('resource-course').textContent = resource.course;
        document.getElementById('resource-date').textContent = resource.date;
        document.getElementById('resource-description').textContent = resource.description;
        
        // 設定檔案下載連結
        document.getElementById('resource-file-link').textContent = resource.fileName;
        // 實際應用中，這裡應該設定真實的下載連結
        document.getElementById('resource-file-link').href = '#';
        
        // 顯示模態窗口
        resourceDetailModal.style.display = 'block';
    };
    
    // 判斷考試日期是否為今天
    function isExamToday(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const examDate = new Date(dateString.replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2'));
        examDate.setHours(0, 0, 0, 0);
        
        return today.getTime() === examDate.getTime();
    }
    
    // 獲取考試距今的天數
    function getDaysRemaining(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const examDate = new Date(dateString.replace(/(\d+)\/(\d+)\/(\d+)/, '$3/$1/$2'));
        examDate.setHours(0, 0, 0, 0);
        
        const diffTime = examDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
    
    // 格式化日期顯示
    function formatDate(dateString) {
        return dateString.split(' ')[0];
    }
    
    // 從日期時間字串中獲取時間
    function getTimeFromDatetime(dateString) {
        return dateString.split(' ')[1];
    }
    
    // 獲取資源類型對應的圖標樣式
    function getResourceIconClass(type) {
        switch (type) {
            case 'pdf':
                return 'icon-pdf';
            case 'doc':
                return 'icon-doc';
            case 'ppt':
                return 'icon-ppt';
            case 'video':
                return 'icon-video';
            default:
                return 'icon-other';
        }
    }
    
    // 獲取資源類型對應的圖標文字
    function getResourceIconText(type) {
        switch (type) {
            case 'pdf':
                return 'PDF';
            case 'doc':
                return 'DOC';
            case 'ppt':
                return 'PPT';
            case 'video':
                return 'VID';
            default:
                return 'FILE';
        }
    }
    
    // 更新用戶資訊的函數
    function updateUserInfo(name) {
        // 更新側邊欄的學生資訊
        const studentInfo = document.querySelector('.student-info');
        if (studentInfo) {
            // 假設第一個 p 元素是學生姓名
            const nameParagraph = studentInfo.querySelector('p:first-child');
            if (nameParagraph) {
                nameParagraph.textContent = name;
            }
        }
    }
});