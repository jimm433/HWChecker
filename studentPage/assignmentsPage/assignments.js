document.addEventListener('DOMContentLoaded', function() {
    // 從 localStorage 讀取用戶資訊
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    // 檢查是否已登入
    if (!userId || !userName || userRole !== 'student') {
        // 未登入或不是學生，重定向到登入頁面
        alert('請先登入');
        window.location.href = '../index.html';
        return;
    }
    
    // 更新頁面上的學生資訊
    updateUserInfo(userName);
    
    // DOM 元素
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const submitModal = document.getElementById('submit-modal');
    const detailModal = document.getElementById('detail-modal');
    const closeButtons = document.querySelectorAll('.close');
    const assignmentForm = document.getElementById('assignment-form');
    
    // 統計數據元素
    const totalAssignmentsEl = document.getElementById('total-assignments');
    const pendingAssignmentsEl = document.getElementById('pending-assignments');
    const submittedAssignmentsEl = document.getElementById('submitted-assignments');
    const gradedAssignmentsEl = document.getElementById('graded-assignments');
    
    // 作業列表容器
    const pendingList = document.getElementById('pending-list');
    const submittedList = document.getElementById('submitted-list');
    const gradedList = document.getElementById('graded-list');
    
    // 初始化頁面
    initPage();
    
    // 初始化頁面
    function initPage() {
        // 設置事件監聽器
        setupEventListeners();
        
        // 載入作業數據
        loadAssignments();
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
                submitModal.style.display = 'none';
                detailModal.style.display = 'none';
            });
        });
        
        // 點擊模態窗口外部關閉
        window.addEventListener('click', function(event) {
            if (event.target === submitModal) {
                submitModal.style.display = 'none';
            }
            if (event.target === detailModal) {
                detailModal.style.display = 'none';
            }
        });
        
        // 作業提交表單
        assignmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAssignment();
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
                if (page !== '作業') {
                    switch (page) {
                        case '考試':
                            window.location.href = 'exams.html';
                            break;
                        case '成績':
                            window.location.href = 'grades.html';
                            break;
                        case '公告':
                            window.location.href = 'announcements.html';
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
                
                window.location.href = '../index.html';
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
    
    // 載入作業數據
    function loadAssignments() {
        // 模擬 API 調用 - 在實際應用中，這裡會從後端獲取數據
        // 使用 setTimeout 模擬網絡延遲
        setTimeout(() => {
            // 模擬從 API 獲取的作業數據
            const assignments = [
                {
                    id: 'hw001',
                    title: '程式設計基礎語法練習',
                    course: '程式設計',
                    deadline: '2025/03/01 23:59',
                    status: 'pending',
                    description: '完成教科書第三章練習題 1-10，並繳交程式碼與執行結果截圖。'
                },
                {
                    id: 'hw002',
                    title: '陣列與鏈結串列實作',
                    course: '資料結構',
                    deadline: '2025/03/05 23:59',
                    status: 'pending',
                    description: '實作一個簡單的陣列與鏈結串列，並比較兩者的存取效能差異。'
                },
                {
                    id: 'hw003',
                    title: '排序演算法比較',
                    course: '演算法',
                    deadline: '2025/03/10 23:59',
                    status: 'submitted',
                    submittedDate: '2025/03/06 14:32',
                    fileName: 'sorting_algorithm_comparison.zip'
                },
                {
                    id: 'hw004',
                    title: 'SQL 基礎查詢練習',
                    course: '資料庫系統',
                    deadline: '2025/02/28 23:59',
                    status: 'graded',
                    submittedDate: '2025/02/25 16:45',
                    fileName: 'sql_basics.zip',
                    score: 92,
                    feedback: '查詢語法正確，但可以考慮如何優化複雜查詢的效能。整體來說很好的工作！'
                }
            ];
            
            // 更新統計數據
            updateStats(assignments);
            
            // 渲染作業列表
            renderAssignments(assignments);
        }, 500);
    }
    
    // 更新統計數據
    function updateStats(assignments) {
        const total = assignments.length;
        const pending = assignments.filter(a => a.status === 'pending').length;
        const submitted = assignments.filter(a => a.status === 'submitted').length;
        const graded = assignments.filter(a => a.status === 'graded').length;
        
        totalAssignmentsEl.textContent = total;
        pendingAssignmentsEl.textContent = pending;
        submittedAssignmentsEl.textContent = submitted;
        gradedAssignmentsEl.textContent = graded;
    }
    
    // 渲染作業列表
    function renderAssignments(assignments) {
        // 清空列表
        pendingList.innerHTML = '';
        submittedList.innerHTML = '';
        gradedList.innerHTML = '';
        
        // 分類作業並填充列表
        const pendingAssignments = assignments.filter(a => a.status === 'pending');
        const submittedAssignments = assignments.filter(a => a.status === 'submitted');
        const gradedAssignments = assignments.filter(a => a.status === 'graded');
        
        // 渲染待繳作業
        if (pendingAssignments.length === 0) {
            pendingList.innerHTML = '<div class="empty-message">沒有待繳的作業</div>';
        } else {
            pendingAssignments.forEach(assignment => {
                const item = createAssignmentItem(assignment);
                pendingList.appendChild(item);
            });
        }
        
        // 渲染已繳作業
        if (submittedAssignments.length === 0) {
            submittedList.innerHTML = '<div class="empty-message">沒有已繳交的作業</div>';
        } else {
            submittedAssignments.forEach(assignment => {
                const item = createAssignmentItem(assignment);
                submittedList.appendChild(item);
            });
        }
        
        // 渲染已批改作業
        if (gradedAssignments.length === 0) {
            gradedList.innerHTML = '<div class="empty-message">沒有已批改的作業</div>';
        } else {
            gradedAssignments.forEach(assignment => {
                const item = createAssignmentItem(assignment);
                gradedList.appendChild(item);
            });
        }
    }
    
    // 創建作業列表項
    function createAssignmentItem(assignment) {
        const div = document.createElement('div');
        div.className = 'assignment-item';
        
        // 根據狀態決定顯示的內容和操作
        let statusText = '';
        let statusClass = '';
        let actions = '';
        
        if (assignment.status === 'pending') {
            statusText = '待繳交';
            statusClass = 'status-pending';
            actions = `<button class="button button-small" onclick="openSubmitModal('${assignment.id}')">繳交</button>`;
        } else if (assignment.status === 'submitted') {
            statusText = '已繳交';
            statusClass = 'status-submitted';
            actions = `<button class="button button-small" onclick="openDetailModal('${assignment.id}')">查看</button>`;
        } else if (assignment.status === 'graded') {
            statusText = `已批改: ${assignment.score}分`;
            statusClass = 'status-graded';
            actions = `<button class="button button-small" onclick="openDetailModal('${assignment.id}')">查看評語</button>`;
        }
        
        div.innerHTML = `
            <div class="assignment-info">
                <div class="assignment-title">${assignment.title}</div>
                <div class="assignment-meta">
                    <div class="assignment-course">${assignment.course}</div>
                    <div class="assignment-deadline">截止: ${assignment.deadline}</div>
                    <div class="assignment-status ${statusClass}">${statusText}</div>
                </div>
            </div>
            <div class="assignment-actions">
                ${actions}
            </div>
        `;
        
        return div;
    }
    
    // 打開提交作業模態窗口
    window.openSubmitModal = function(assignmentId) {
        // 模擬從 API 獲取作業詳情
        // 實際應用中，應該調用後端 API 獲取
        const assignment = {
            id: 'hw001',
            title: '程式設計基礎語法練習',
            course: '程式設計',
            deadline: '2025/03/01 23:59',
            description: '完成教科書第三章練習題 1-10，並繳交程式碼與執行結果截圖。'
        };
        
        // 填充模態窗口
        document.getElementById('assignment-id').value = assignment.id;
        document.getElementById('assignment-title').textContent = assignment.title;
        document.getElementById('assignment-course').textContent = assignment.course;
        document.getElementById('assignment-deadline').textContent = assignment.deadline;
        document.getElementById('assignment-description').textContent = assignment.description;
        
        // 清空之前的輸入
        document.getElementById('assignment-file').value = '';
        document.getElementById('assignment-comment').value = '';
        
        // 顯示模態窗口
        submitModal.style.display = 'block';
    };
    
    // 打開作業詳情模態窗口
    window.openDetailModal = function(assignmentId) {
        // 模擬從 API 獲取作業詳情
        // 實際應用中，應該調用後端 API 獲取
        let assignment;
        
        if (assignmentId === 'hw003') {
            assignment = {
                id: 'hw003',
                title: '排序演算法比較',
                course: '演算法',
                deadline: '2025/03/10 23:59',
                status: 'submitted',
                submittedDate: '2025/03/06 14:32',
                fileName: 'sorting_algorithm_comparison.zip'
            };
        } else {
            assignment = {
                id: 'hw004',
                title: 'SQL 基礎查詢練習',
                course: '資料庫系統',
                deadline: '2025/02/28 23:59',
                status: 'graded',
                submittedDate: '2025/02/25 16:45',
                fileName: 'sql_basics.zip',
                score: 92,
                feedback: '查詢語法正確，但可以考慮如何優化複雜查詢的效能。整體來說很好的工作！'
            };
        }
        
        // 填充模態窗口
        document.getElementById('detail-title').textContent = assignment.title;
        document.getElementById('detail-course').textContent = assignment.course;
        document.getElementById('detail-deadline').textContent = assignment.deadline;
        document.getElementById('detail-submitted-date').textContent = assignment.submittedDate;
        
        // 根據狀態顯示不同內容
        if (assignment.status === 'submitted') {
            document.getElementById('detail-status').textContent = '已繳交，待批改';
            document.getElementById('detail-feedback').textContent = '暫無評語';
            document.getElementById('detail-score').textContent = '待評分';
        } else if (assignment.status === 'graded') {
            document.getElementById('detail-status').textContent = '已批改';
            document.getElementById('detail-feedback').textContent = assignment.feedback;
            document.getElementById('detail-score').textContent = `${assignment.score}分`;
        }
        
        // 設定檔案下載連結
        document.getElementById('detail-file-link').textContent = assignment.fileName;
        // 實際應用中，這裡應該設定真實的下載連結
        document.getElementById('detail-file-link').href = '#';
        
        // 顯示模態窗口
        detailModal.style.display = 'block';
    };
    
    // 提交作業
    function submitAssignment() {
        const assignmentId = document.getElementById('assignment-id').value;
        const file = document.getElementById('assignment-file').files[0];
        const comment = document.getElementById('assignment-comment').value;
        
        if (!file) {
            alert('請上傳作業檔案');
            return;
        }
        
        // 顯示提交中的訊息
        const submitButton = assignmentForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = '提交中...';
        
        // 模擬 API 調用 - 在實際應用中，這裡會使用 FormData 向後端提交檔案
        setTimeout(() => {
            // 模擬成功提交
            alert('作業提交成功！');
            
            // 關閉模態窗口
            submitModal.style.display = 'none';
            
            // 重設按鈕狀態
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            
            // 重新載入作業列表
            loadAssignments();
        }, 1500);
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