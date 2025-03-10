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
    const gradeDetailModal = document.getElementById('grade-detail-modal');
    const closeModalButton = document.querySelector('.modal-header .close');
    const semesterSelect = document.getElementById('semester-select');
    
    // 初始化頁面
    initPage();
    
    // 初始化頁面
    function initPage() {
        // 設置事件監聽器
        setupEventListeners();
        
        // 載入成績數據
        loadGrades();
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
        closeModalButton.addEventListener('click', function() {
            gradeDetailModal.style.display = 'none';
        });
        
        // 點擊模態窗口外部關閉
        window.addEventListener('click', function(event) {
            if (event.target === gradeDetailModal) {
                gradeDetailModal.style.display = 'none';
            }
        });
        
        // 學期選擇事件
        semesterSelect.addEventListener('change', function() {
            const semester = this.value;
            loadHistoricalGrades(semester);
        });
        
        // 點擊成績行查看詳情
        document.querySelectorAll('.grades-table tbody tr').forEach(row => {
            row.addEventListener('click', function() {
                const courseCode = this.querySelector('td:first-child').textContent;
                const courseName = this.querySelector('td:nth-child(2)').textContent;
                showGradeDetail(courseCode, courseName);
            });
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
                if (page !== '成績') {
                    switch (page) {
                        case '儀表板':
                            window.location.href = '../student-dashboard.html';
                            break;
                        case '作業':
                            window.location.href = '../assignmentsPage/assignments.html';
                            break;
                        case '考試':
                            window.location.href = '../examsPage/exams.html';
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
    
    // 載入成績數據
    function loadGrades() {
        // 這裡可以添加從後端API獲取成績數據的代碼
        // 目前使用靜態數據
        
        // 更新成績統計數據
        updateGradeStats();
        
        // 增強成績表格的交互功能
        enhanceGradeTables();
        
        // 載入歷史成績
        loadHistoricalGrades('112-1');
    }
    
    // 更新成績統計數據
    function updateGradeStats() {
        // 在實際應用中，這些數據應該從API獲取
        document.getElementById('semester-average').textContent = '88.5';
        document.getElementById('total-average').textContent = '85.2';
        document.getElementById('credits-completed').textContent = '75';
        document.getElementById('credits-remaining').textContent = '55';
    }
    
    // 增強成績表格的交互功能
    function enhanceGradeTables() {
        // 為成績單元格添加顏色標識
        document.querySelectorAll('.grades-table tbody tr').forEach(row => {
            const scoreCell = row.querySelector('td:last-child');
            const score = parseFloat(scoreCell.textContent);
            
            if (score >= 90) {
                scoreCell.classList.add('grade-excellent');
            } else if (score >= 80) {
                scoreCell.classList.add('grade-good');
            } else if (score >= 70) {
                scoreCell.classList.add('grade-moderate');
            } else if (score >= 60) {
                scoreCell.classList.add('grade-pass');
            } else {
                scoreCell.classList.add('grade-fail');
            }
        });
    }
    
    // 載入歷史成績
    function loadHistoricalGrades(semester) {
        // 清空歷史成績表格
        const historyGradesTable = document.getElementById('history-grades');
        
        // 這裡可以添加從後端API獲取指定學期成績的代碼
        // 目前使用靜態數據
        
        // 模擬不同學期顯示不同的數據
        if (semester === '112-1') {
            historyGradesTable.innerHTML = `
                <tr>
                    <td>CSC102</td>
                    <td>計算機概論</td>
                    <td>3</td>
                    <td>林志明</td>
                    <td class="grade-excellent">92</td>
                </tr>
                <tr>
                    <td>CSC104</td>
                    <td>離散數學</td>
                    <td>3</td>
                    <td>王廷叡</td>
                    <td class="grade-good">85</td>
                </tr>
                <tr>
                    <td>CSC106</td>
                    <td>數位系統設計</td>
                    <td>3</td>
                    <td>張建國</td>
                    <td class="grade-moderate">78</td>
                </tr>
                <tr>
                    <td>CSC108</td>
                    <td>線性代數</td>
                    <td>3</td>
                    <td>李美華</td>
                    <td class="grade-good">83</td>
                </tr>
            `;
        } else if (semester === '111-2') {
            historyGradesTable.innerHTML = `
                <tr>
                    <td>CSC002</td>
                    <td>程式設計概論</td>
                    <td>3</td>
                    <td>王廷叡</td>
                    <td class="grade-excellent">90</td>
                </tr>
                <tr>
                    <td>CSC004</td>
                    <td>資料科學導論</td>
                    <td>3</td>
                    <td>李美華</td>
                    <td class="grade-excellent">93</td>
                </tr>
                <tr>
                    <td>CSC006</td>
                    <td>網頁程式設計</td>
                    <td>3</td>
                    <td>張建國</td>
                    <td class="grade-good">88</td>
                </tr>
            `;
        } else if (semester === '111-1') {
            historyGradesTable.innerHTML = `
                <tr>
                    <td>CSC001</td>
                    <td>電腦入門</td>
                    <td>2</td>
                    <td>王廷叡</td>
                    <td class="grade-excellent">95</td>
                </tr>
                <tr>
                    <td>CSC003</td>
                    <td>計算機數學</td>
                    <td>3</td>
                    <td>林志明</td>
                    <td class="grade-good">86</td>
                </tr>
                <tr>
                    <td>CSC005</td>
                    <td>電腦網路</td>
                    <td>3</td>
                    <td>張建國</td>
                    <td class="grade-moderate">75</td>
                </tr>
                <tr>
                    <td>CSC007</td>
                    <td>演算法概論</td>
                    <td>3</td>
                    <td>李美華</td>
                    <td class="grade-good">82</td>
                </tr>
            `;
        }
        
        // 為新載入的表格行添加點擊事件
        document.querySelectorAll('#history-grades tr').forEach(row => {
            row.addEventListener('click', function() {
                const courseCode = this.querySelector('td:first-child').textContent;
                const courseName = this.querySelector('td:nth-child(2)').textContent;
                showGradeDetail(courseCode, courseName);
            });
        });
    }
    
    // 顯示成績詳情
    function showGradeDetail(courseCode, courseName) {
        // 這裡可以添加從後端API獲取成績詳情的代碼
        // 目前使用靜態數據
        
        // 模擬不同課程顯示不同的詳情
        let gradeData = {
            courseCode: courseCode,
            courseName: courseName,
            semester: '112-2',
            credits: 3,
            teacher: '王廷叡',
            regularScore: 90,
            midtermScore: 85,
            finalScore: 92,
            totalScore: 90,
            comments: '表現優異，在課堂上能積極參與討論，作業完成度高，程式碼品質佳。期末專案展現了良好的問題解決能力與創新思維。建議可以更加注重程式效率的優化。'
        };
        
        // 根據課程代碼設置不同的模擬數據
        if (courseCode === 'CSC201') {
            gradeData = {
                courseCode: 'CSC201',
                courseName: '資料結構',
                semester: '112-2',
                credits: 3,
                teacher: '李美華',
                regularScore: 88,
                midtermScore: 92,
                finalScore: 85,
                totalScore: 88,
                comments: '資料結構的理解深入，能夠運用合適的資料結構解決問題。在期中考中表現特別優異，顯示對基礎概念掌握紮實。建議多練習複雜資料結構的實作，加強演算法效率分析能力。'
            };
        } else if (courseCode === 'CSC303') {
            gradeData = {
                courseCode: 'CSC303',
                courseName: '演算法',
                semester: '112-2',
                credits: 3,
                teacher: '張建國',
                regularScore: 82,
                midtermScore: 88,
                finalScore: 90,
                totalScore: 87,
                comments: '演算法思維清晰，解題方法多元。期末考表現優於期中考，顯示持續進步。平時作業完成品質佳，但繳交時間時有延遲，建議改進時間管理能力。對複雜演算法的優化還有進步空間。'
            };
        } else if (courseCode === 'CSC305') {
            gradeData = {
                courseCode: 'CSC305',
                courseName: '資料庫系統',
                semester: '112-2',
                credits: 3,
                teacher: '陳文芳',
                regularScore: 85,
                midtermScore: 90,
                finalScore: 92,
                totalScore: 89,
                comments: '對資料庫設計概念掌握良好，SQL查詢能力強。期末專案展現了優秀的數據庫設計與優化能力。建議多學習進階的資料庫管理與效能調校技術，以應對大型系統的需求。'
            };
        }
        
        // 填充模態窗口內容
        document.getElementById('detail-course-name').textContent = gradeData.courseName;
        document.getElementById('detail-course-code').textContent = gradeData.courseCode;
        document.getElementById('detail-semester').textContent = gradeData.semester;
        document.getElementById('detail-credits').textContent = gradeData.credits;
        document.getElementById('detail-teacher').textContent = gradeData.teacher;
        document.getElementById('detail-regular').textContent = gradeData.regularScore;
        document.getElementById('detail-midterm').textContent = gradeData.midtermScore;
        document.getElementById('detail-final').textContent = gradeData.finalScore;
        document.getElementById('detail-total').textContent = gradeData.totalScore;
        document.getElementById('detail-comments').textContent = gradeData.comments;
        
        // 顯示模態窗口
        gradeDetailModal.style.display = 'block';
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