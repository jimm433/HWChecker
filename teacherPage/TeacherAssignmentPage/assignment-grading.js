document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const courseSelect = document.getElementById('course-select');
    const assignmentSelect = document.getElementById('assignment-select');
    const loadAssignmentsBtn = document.getElementById('load-assignments');
    const autoGradeToggle = document.getElementById('auto-grade-toggle');
    const batchGradeBtn = document.getElementById('batch-grade');
    const refreshListBtn = document.getElementById('refresh-list');
    const assignmentList = document.getElementById('assignment-list');
    const assignmentCountEl = document.getElementById('assignment-count');
    const modal = document.getElementById('grading-modal');
    const closeModal = document.querySelector('.close-modal');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const triggerAiGradeBtn = document.getElementById('trigger-ai-grade');
    const acceptAiGradeCheckbox = document.getElementById('accept-ai-grade');
    const saveGradeBtn = document.getElementById('save-grade');
    const cancelGradeBtn = document.getElementById('cancel-grade');
    
    // 檢查環境
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    
    // 全局變數
    let currentAssignments = [];
    let currentAssignmentData = null;
    let isLoading = false;

    // 驗證用戶會話
    function validateUserSession() {
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        const userRole = localStorage.getItem('userRole');
        
        if (!userId || !userName || userRole !== 'teacher') {
            return false;
        }
        
        return { userId, userName, userRole };
    }
    
    // 用戶會話驗證
    const user = validateUserSession();
    if (!user) {
        alert('您的登入已過期或無效，請重新登入。');
        try {
            window.location.href = '../../index.html';
        } catch (e) {
            console.error('導航失敗:', e);
            document.body.innerHTML = `
                <div style="text-align: center; margin-top: 100px;">
                    <h1>會話已過期</h1>
                    <p>您的登入已失效，請<a href="../../index.html">點擊這裡</a>重新登入。</p>
                </div>
            `;
        }
        return;
    }

    // 更新頁面上的教師資訊
    updateUserInfo(user.userName);

    // 初始設置
    initializeApp();

    // 初始化應用程式
    function initializeApp() {
        setupEventListeners();
        loadCourseData();
    }

    // 設置事件監聽器
    function setupEventListeners() {
        // 課程選擇變更時
        courseSelect.addEventListener('change', function() {
            const courseId = this.value;
            if (courseId) {
                loadAssignmentsForCourse(courseId);
                assignmentSelect.disabled = false;
            } else {
                assignmentSelect.innerHTML = '<option value="">請先選擇課程</option>';
                assignmentSelect.disabled = true;
            }
        });

        // 載入作業按鈕點擊
        loadAssignmentsBtn.addEventListener('click', function() {
            const courseId = courseSelect.value;
            const assignmentId = assignmentSelect.value;
            if (courseId && assignmentId) {
                loadAssignmentSubmissions(courseId, assignmentId);
            } else {
                alert('請選擇課程和作業');
            }
        });

        // 自動批改切換
        autoGradeToggle.addEventListener('change', function() {
            batchGradeBtn.disabled = !this.checked;
        });

        // 批次批改按鈕
        batchGradeBtn.addEventListener('click', function() {
            if (currentAssignments.length > 0) {
                batchGradeAssignments();
            }
        });

        // 刷新列表按鈕
        refreshListBtn.addEventListener('click', function() {
            const courseId = courseSelect.value;
            const assignmentId = assignmentSelect.value;
            if (courseId && assignmentId) {
                loadAssignmentSubmissions(courseId, assignmentId);
            }
        });

        // 關閉模態視窗
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });

        // 點擊模態視窗外部關閉
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        // 標籤切換
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                // 切換標籤活動狀態
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                // 切換內容顯示
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`${tabId}-content`).classList.add('active');
            });
        });

        // 啟動AI批改
        triggerAiGradeBtn.addEventListener('click', function() {
            if (currentAssignmentData && !isLoading) {
                aiGradeAssignment(currentAssignmentData);
            }
        });

        // 採用AI評分切換
        acceptAiGradeCheckbox.addEventListener('change', function() {
            if (this.checked && currentAssignmentData && currentAssignmentData.aiGrade) {
                document.getElementById('teacher-score').value = currentAssignmentData.aiGrade.score;
                document.getElementById('teacher-comments').value = currentAssignmentData.aiGrade.summary;
            }
        });

        // 儲存批改結果
        saveGradeBtn.addEventListener('click', function() {
            if (currentAssignmentData) {
                saveGradeResult();
            }
        });

        // 取消批改
        cancelGradeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // 設置導航監聽器
        setupNavigationListeners();
    }
    
    // 設置導航監聽器
    function setupNavigationListeners() {
        // 側邊欄選單項目點擊事件
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                const page = this.textContent.trim();
                switch (page) {
                    case '儀表板':
                        window.location.href = '../teacher-dashboard.html';
                        break;
                    case '課程管理':
                        window.location.href = '../CourseManagementPage/course-management.html';
                        break;
                    case '學生成績':
                        alert('學生成績頁面正在建設中');
                        break;
                    case '作業批改':
                        // 已在當前頁面
                        break;
                    case '考試管理':
                        window.location.href = '../ExamManagement/exam-management.html';
                        break;
                    case '教材上傳':
                        alert('教材上傳頁面正在建設中');
                        break;
                    case '公告管理':
                        alert('公告管理頁面正在建設中');
                        break;
                }
            });
        });
        
        // 登出功能
        document.querySelector('.logout').addEventListener('click', function() {
            if (confirm('確定要登出嗎？')) {
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');
                window.location.href = '../../index.html';
            }
        });
    }

    // 載入課程資料
    function loadCourseData() {
        showLoading(true);
        
        if (isDevelopment) {
            const mockCourses = [
                { id: 'programming', name: '程式設計' },
                { id: 'datastructure', name: '資料結構' },
                { id: 'algorithm', name: '演算法' },
                { id: 'database', name: '資料庫系統' }
            ];
            fillCoursesDropdown(mockCourses);
            showLoading(false);
            return;
        }
        
        fetch('/.netlify/functions/api/teacher/courses')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`伺服器回應錯誤: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(courses => {
                fillCoursesDropdown(courses);
                showLoading(false);
            })
            .catch(error => {
                console.error('載入課程資料錯誤:', error);
                alert(`載入課程資料失敗: ${error.message}。將使用模擬數據。`);
                
                const mockCourses = [
                    { id: 'programming', name: '程式設計' },
                    { id: 'datastructure', name: '資料結構' }
                ];
                fillCoursesDropdown(mockCourses);
                showLoading(false);
            });
    }
    
    // 填充課程下拉選單
    function fillCoursesDropdown(courses) {
        courseSelect.innerHTML = '<option value="">請選擇課程</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseSelect.appendChild(option);
        });
    }

    // 載入課程的作業
    function loadAssignmentsForCourse(courseId) {
        showLoading(true);
        
        if (isDevelopment) {
            const mockAssignments = [
                { id: 'hw1', name: '作業1: 基礎語法' },
                { id: 'hw2', name: '作業2: 條件與循環' }
            ];
            fillAssignmentsDropdown(mockAssignments);
            showLoading(false);
            return;
        }
        
        fetch(`/.netlify/functions/api/teacher/courses/${courseId}/assignments`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`伺服器回應錯誤: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(assignments => {
                fillAssignmentsDropdown(assignments);
                showLoading(false);
            })
            .catch(error => {
                console.error('載入作業列表錯誤:', error);
                alert(`載入作業列表失敗: ${error.message}。將使用模擬數據。`);
                
                const mockAssignments = [
                    { id: 'hw1', name: '作業1: 基礎語法' },
                    { id: 'hw2', name: '作業2: 條件與循環' }
                ];
                fillAssignmentsDropdown(mockAssignments);
                showLoading(false);
            });
    }
    
    // 填充作業下拉選單
    function fillAssignmentsDropdown(assignments) {
        assignmentSelect.innerHTML = assignments.length ?
            assignments.map(a => `<option value="${a.id}">${a.name}</option>`).join('') :
            '<option value="">此課程無作業</option>';
            
        assignmentSelect.disabled = assignments.length === 0;
    }

    // 載入作業提交記錄
    function loadAssignmentSubmissions(courseId, assignmentId) {
        assignmentList.innerHTML = '<tr class="empty-row"><td colspan="7">載入中...</td></tr>';
        showLoading(true);

        if (isDevelopment) {
            const mockSubmissions = generateMockSubmissions();
            currentAssignments = mockSubmissions;
            assignmentCountEl.textContent = mockSubmissions.length;
            renderAssignmentList(mockSubmissions);
            showLoading(false);
            return;
        }

        fetch(`/.netlify/functions/api/teacher/courses/${courseId}/assignments/${assignmentId}/submissions`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`伺服器回應錯誤: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(submissions => {
                currentAssignments = submissions;
                assignmentCountEl.textContent = submissions.length;
                renderAssignmentList(submissions);
                showLoading(false);
            })
            .catch(error => {
                console.error('載入作業提交記錄錯誤:', error);
                alert(`載入作業提交記錄失敗: ${error.message}。將使用模擬數據。`);
                
                const mockSubmissions = generateMockSubmissions();
                currentAssignments = mockSubmissions;
                assignmentCountEl.textContent = mockSubmissions.length;
                renderAssignmentList(mockSubmissions);
                showLoading(false);
            });
    }

    // 渲染作業列表
    function renderAssignmentList(submissions) {
        if (submissions.length === 0) {
            assignmentList.innerHTML = '<tr class="empty-row"><td colspan="7">目前沒有待批改的作業</td></tr>';
            return;
        }

        assignmentList.innerHTML = submissions.map(submission => {
            const aiStatusClass = getAiStatusClass(submission.aiStatus);
            const aiScoreDisplay = submission.aiScore ? `${submission.aiScore}分` : '-';
            const confirmedStatus = submission.teacherConfirmed ?
                '<span style="color: green;">已確認</span>' :
                '<span style="color: #e74c3c;">未確認</span>';

            return `
                <tr data-id="${submission.id}">
                    <td>${submission.studentName}</td>
                    <td>${submission.studentId}</td>
                    <td>${submission.submitTime}</td>
                    <td class="${aiStatusClass}">${submission.aiStatus}</td>
                    <td>${aiScoreDisplay}</td>
                    <td>${confirmedStatus}</td>
                    <td>
                        <button class="button-small view-assignment">查看</button>
                        <button class="button-small grade-assignment">批改</button>
                    </td>
                </tr>
            `;
        }).join('');

        // 添加查看和批改按鈕的事件監聽器
        document.querySelectorAll('.view-assignment').forEach(btn => {
            btn.addEventListener('click', function() {
                const submissionId = this.closest('tr').getAttribute('data-id');
                openAssignmentModal(submissionId, 'submission');
            });
        });

        document.querySelectorAll('.grade-assignment').forEach(btn => {
            btn.addEventListener('click', function() {
                const submissionId = this.closest('tr').getAttribute('data-id');
                openAssignmentModal(submissionId, 'teacher-grade');
            });
        });
    }

    // 獲取AI狀態的CSS類
    function getAiStatusClass(status) {
        switch (status) {
            case '未處理': return 'status-pending';
            case '處理中': return 'status-processing';
            case '已完成': return 'status-completed';
            case '失敗': return 'status-failed';
            default: return '';
        }
    }

    // 生成模擬作業提交數據 (開發環境使用)
    function generateMockSubmissions() {
        // 簡化的模擬數據
        const students = [
            { name: '陳小明', id: 'S10911001' },
            { name: '林雅婷', id: 'S10911002' },
            { name: '王大華', id: 'S10911003' }
        ];
        
        const aiStatuses = ['未處理', '處理中', '已完成', '失敗'];
        const submissions = [];

        for (let i = 0; i < 5; i++) {
            const student = students[i % students.length];
            const aiStatus = aiStatuses[Math.floor(Math.random() * 4)];
            let aiScore = null;

            if (aiStatus === '已完成') {
                aiScore = Math.floor(Math.random() * 31) + 70; // 70-100分之間
            }

            const teacherConfirmed = Math.random() > 0.7;
            const now = new Date();
            const submitDate = new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000);
            const submitTime = submitDate.toLocaleString('zh-TW');

            submissions.push({
                id: `hw-${student.id}-${i}`,
                studentName: student.name,
                studentId: student.id,
                courseName: '程式設計',
                courseId: 'programming',
                assignmentName: '作業1: 基礎語法',
                assignmentId: 'hw1',
                submitTime: submitTime,
                aiStatus: aiStatus,
                aiScore: aiScore,
                teacherConfirmed: teacherConfirmed,
                content: generateMockContent(),
                aiGrade: aiStatus === '已完成' ? generateMockAiGrading(aiScore) : null
            });
        }

        return submissions;
    }

    // 生成模擬作業內容
    function generateMockContent() {
        return `#include <stdio.h>

int main() {
    // 變數宣告
    int n, i;
    int sum = 0;
    
    // 輸入一個正整數n
    printf("請輸入一個正整數: ");
    scanf("%d", &n);
    
    // 計算1+2+...+n的和
    for(i = 1; i <= n; i++) {
        sum += i;
    }
    
    // 輸出結果
    printf("1到%d的和為: %d\\n", n, sum);
    
    return 0;
}`;
    }

    // 生成模擬AI評分結果
    function generateMockAiGrading(score) {
        const gradingItems = [
            { name: '程式正確性', score: 25, maxScore: 30, comment: '程式執行結果正確，但有些邊界條件處理不夠完善' },
            { name: '程式效率', score: 18, maxScore: 20, comment: '演算法選擇適當，但時間複雜度可以再優化' },
            { name: '程式碼風格', score: 16, maxScore: 20, comment: '變數命名適當，但程式碼註解不夠詳細' },
            { name: '程式架構', score: 18, maxScore: 20, comment: '程式模組化尚可，但函數抽象程度不夠' },
            { name: '報告完整性', score: 8, maxScore: 10, comment: '報告內容大致完整，但缺少測試數據分析' }
        ];

        return {
            score: score,
            gradingItems: gradingItems,
            summary: `整體來說，此作業達到了課程要求的基本標準。程式能夠正確處理輸入並產生期望的輸出，但在程式效率和程式碼風格方面還有改進空間。`,
            feedback: `程式能夠正確執行，但建議改進：\n1. 增加輸入驗證\n2. 使用數學公式優化計算\n3. 增加更詳細的註釋\n4. 進一步模組化代碼`
        };
    }

    // 打開作業批改模態視窗
    function openAssignmentModal(submissionId, activeTab = 'submission') {
        // 查找對應的作業數據
        const submission = currentAssignments.find(s => s.id === submissionId);
        if (!submission) {
            alert('找不到作業資料');
            return;
        }

        // 保存當前作業數據
        currentAssignmentData = submission;

        // 填充作業數據到模態視窗
        document.getElementById('modal-student-name').textContent = submission.studentName;
        document.getElementById('modal-student-id').textContent = submission.studentId;
        document.getElementById('modal-course-name').textContent = submission.courseName;
        document.getElementById('modal-assignment-name').textContent = submission.assignmentName;
        document.getElementById('modal-submit-time').textContent = submission.submitTime;

        // 填充代碼查看器
        document.querySelector('#student-code code').textContent = submission.content;
        
        // 如果有程式碼高亮庫，則應用高亮
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightBlock(block);
            });
        }

        // 填充AI批改狀態
        document.getElementById('ai-status-value').textContent = submission.aiStatus;
        if (submission.aiStatus === '處理中') {
            document.getElementById('ai-status-value').classList.add('pulsing');
            document.getElementById('trigger-ai-grade').disabled = true;
        } else {
            document.getElementById('ai-status-value').classList.remove('pulsing');
            document.getElementById('trigger-ai-grade').disabled = submission.aiStatus === '已完成';
        }

        // 填充附加檔案列表
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        if (submission.files && submission.files.length > 0) {
            submission.files.forEach(file => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = file.url || '#';
                link.textContent = file.name || '未命名檔案';
                link.target = '_blank';
                li.appendChild(link);
                fileList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = '沒有附加檔案';
            fileList.appendChild(li);
        }

        // 如果有AI評分結果，則填充評分詳情
        if (submission.aiGrade) {
            document.getElementById('ai-score').textContent = submission.aiGrade.score;
            document.getElementById('ai-comments').textContent = submission.aiGrade.feedback;

            // 填充評分項目表格
            const aiGradingItemsTable = document.getElementById('ai-grading-items').querySelector('tbody');
            aiGradingItemsTable.innerHTML = submission.aiGrade.gradingItems.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.score}</td>
                    <td>${item.maxScore}</td>
                    <td>${item.comment}</td>
                </tr>
            `).join('');

            // 啟用"採用AI評分"選項
            document.getElementById('accept-ai-grade').disabled = false;
        } else {
            document.getElementById('ai-score').textContent = '-';
            document.getElementById('ai-comments').textContent = '尚未進行AI批改';
            document.getElementById('ai-grading-items').querySelector('tbody').innerHTML = '';
            document.getElementById('accept-ai-grade').disabled = true;
        }

        // 重置教師批改表單
        document.getElementById('teacher-score').value = submission.teacherScore || '';
        document.getElementById('teacher-comments').value = submission.teacherComments || '';
        document.getElementById('accept-ai-grade').checked = false;

        // 切換到指定的標籤
        document.querySelector(`.tab[data-tab="${activeTab}"]`).click();

        // 顯示模態視窗
        modal.style.display = 'block';
    }

    // AI批改作業
    function aiGradeAssignment(submission) {
        // 更新UI狀態
        document.getElementById('ai-status-value').textContent = '處理中';
        document.getElementById('ai-status-value').classList.add('pulsing');
        document.getElementById('trigger-ai-grade').disabled = true;
        showLoading(true, 'AI批改中...');

        // 準備請求數據
        const requestData = {
            submissionId: submission.id,
            studentId: submission.studentId,
            content: submission.content,
            gradingOptions: {
                strictness: document.getElementById('grading-criteria').value,
                detailLevel: document.getElementById('ai-feedback-level').value
            }
        };

        if (isDevelopment) {
            // 模擬延遲
            setTimeout(() => {
                const score = Math.floor(Math.random() * 31) + 70;
                const aiGrade = generateMockAiGrading(score);
                
                // 更新作業數據
                submission.aiStatus = '已完成';
                submission.aiScore = score;
                submission.aiGrade = aiGrade;
                
                // 更新UI
                document.getElementById('ai-status-value').textContent = '已完成';
                document.getElementById('ai-status-value').classList.remove('pulsing');
                document.getElementById('ai-score').textContent = score;
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
                
                // 刷新作業列表
                renderAssignmentList(currentAssignments);
                
                showLoading(false);
            }, 2000);
            return;
        }

        // 調用 Netlify Function API
        fetch('/.netlify/functions/api/ai-grading', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API請求失敗: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('AI批改結果:', data);
                
                // 更新作業數據
                submission.aiStatus = '已完成';
                submission.aiScore = data.result.score;
                submission.aiGrade = data.result;
                
                // 更新UI
                document.getElementById('ai-status-value').textContent = '已完成';
                document.getElementById('ai-status-value').classList.remove('pulsing');
                document.getElementById('ai-score').textContent = data.result.score;
                document.getElementById('ai-comments').textContent = data.result.feedback;

                // 更新評分項目表格
                const aiGradingItemsTable = document.getElementById('ai-grading-items').querySelector('tbody');
                aiGradingItemsTable.innerHTML = data.result.gradingItems.map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.score}</td>
                        <td>${item.maxScore}</td>
                        <td>${item.comment}</td>
                    </tr>
                `).join('');
                
                // 啟用"採用AI評分"選項
                document.getElementById('accept-ai-grade').disabled = false;
                
                // 刷新作業列表
                renderAssignmentList(currentAssignments);
            } else {
                throw new Error(data.message || 'AI批改失敗');
            }
        })
        .catch(error => {
            console.error('AI批改發生錯誤:', error);
            
            // 更新UI顯示錯誤狀態
            document.getElementById('ai-status-value').textContent = '失敗';
            document.getElementById('ai-status-value').classList.remove('pulsing');
            document.getElementById('ai-status-value').classList.add('status-failed');
            document.getElementById('trigger-ai-grade').disabled = false;
            
            // 更新作業狀態
            submission.aiStatus = '失敗';
            renderAssignmentList(currentAssignments);
            
            // 顯示錯誤訊息
            alert(`AI批改發生錯誤: ${error.message}`);
        })
        .finally(() => {
            showLoading(false);
        });
    }

    // 批次批改作業
    function batchGradeAssignments() {
        // 找出所有未處理的作業
        const pendingAssignments = currentAssignments.filter(s => s.aiStatus === '未處理');

        if (pendingAssignments.length === 0) {
            alert('沒有待處理的作業');
            return;
        }

        const confirmMessage = `確定要批次批改 ${pendingAssignments.length} 份作業嗎？
此操作將使用AI批改所有未處理的作業。`;

        if (confirm(confirmMessage)) {
            // 顯示處理中的訊息
            showLoading(true, '批次批改中...');

            // 更新UI顯示處理中狀態
            pendingAssignments.forEach(submission => {
                submission.aiStatus = '處理中';
            });
            renderAssignmentList(currentAssignments);

            if (isDevelopment) {
                // 模擬批次處理
                setTimeout(() => {
                    pendingAssignments.forEach(submission => {
                        const score = Math.floor(Math.random() * 31) + 70; // 70-100分之間
                        submission.aiStatus = '已完成';
                        submission.aiScore = score;
                        submission.aiGrade = generateMockAiGrading(score);
                    });
                    
                    // 刷新作業列表
                    renderAssignmentList(currentAssignments);
                    showLoading(false);
                    
                    alert(`批次批改完成！已處理 ${pendingAssignments.length} 份作業。`);
                }, 3000);
                return;
            }

            // 準備請求數據
            const requestData = {
                submissions: pendingAssignments.map(s => ({
                    id: s.id,
                    studentId: s.studentId,
                    content: s.content
                })),
                gradingOptions: {
                    strictness: document.getElementById('grading-criteria').value,
                    detailLevel: document.getElementById('ai-feedback-level').value
                }
            };

            // 調用 Netlify Function API
            fetch('/.netlify/functions/api/batch-grading', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API請求失敗: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log('批次批改結果:', data);
                    
                    // 更新作業數據
                    data.results.forEach(result => {
                        const assignment = currentAssignments.find(a => a.id === result.id);
                        if (assignment) {
                            assignment.aiStatus = '已完成';
                            assignment.aiScore = result.score;
                            assignment.aiGrade = result.grading;
                        }
                    });
                    
                    // 顯示完成訊息
                    alert(`批次批改完成！已處理 ${data.completedCount} 份作業。${data.failedCount ? `有 ${data.failedCount} 份失敗。` : ''}`);
                } else {
                    throw new Error(data.message || '批次批改失敗');
                }
            })
            .catch(error => {
                console.error('批次批改發生錯誤:', error);
                alert(`批次批改發生錯誤: ${error.message}`);
                
                // 重置作業狀態
                pendingAssignments.forEach(submission => {
                    submission.aiStatus = '未處理';
                });
            })
            .finally(() => {
                // 刷新作業列表
                renderAssignmentList(currentAssignments);
                showLoading(false);
            });
        }
    }

    // 儲存批改結果
    function saveGradeResult() {
        const teacherScore = document.getElementById('teacher-score').value;
        const teacherComments = document.getElementById('teacher-comments').value;

        // 驗證分數輸入
        if (!teacherScore) {
            alert('請輸入評分分數');
            return;
        }

        if (isNaN(teacherScore) || teacherScore < 0 || teacherScore > 100) {
            alert('分數必須是0-100之間的數字');
            return;
        }

        // 顯示儲存中狀態
        showLoading(true, '儲存中...');
        saveGradeBtn.disabled = true;

        // 更新當前作業數據
        currentAssignmentData.teacherScore = parseInt(teacherScore);
        currentAssignmentData.teacherComments = teacherComments;
        currentAssignmentData.teacherConfirmed = true;

        // 準備要發送的數據
        const gradeData = {
            submissionId: currentAssignmentData.id,
            studentId: currentAssignmentData.studentId,
            courseId: currentAssignmentData.courseId,
            assignmentId: currentAssignmentData.assignmentId,
            score: parseInt(teacherScore),
            comments: teacherComments,
            aiScoreAccepted: document.getElementById('accept-ai-grade').checked
        };

        if (isDevelopment) {
            // 模擬延遲
            setTimeout(() => {
                alert('批改結果已儲存！');
                modal.style.display = 'none';
                renderAssignmentList(currentAssignments);
                saveGradeBtn.disabled = false;
                showLoading(false);
            }, 1000);
            return;
        }

        // 發送到API
        fetch('/.netlify/functions/api/grade-assignment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gradeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`伺服器回應錯誤: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                alert('批改結果已儲存！');
                modal.style.display = 'none';
            } else {
                throw new Error(result.message || '儲存失敗');
            }
        })
        .catch(error => {
            console.error('儲存評分錯誤:', error);
            alert(`無法儲存評分結果: ${error.message}。結果已暫存在本地。`);
            modal.style.display = 'none';
        })
        .finally(() => {
            // 重新渲染作業列表
            renderAssignmentList(currentAssignments);
            saveGradeBtn.disabled = false;
            showLoading(false);
        });
    }

    // 顯示/隱藏載入狀態
    function showLoading(show, message = '處理中...') {
        isLoading = show;
        
        // 禁用或啟用所有操作按鈕
        const buttons = document.querySelectorAll('button:not(.close-modal)');
        buttons.forEach(button => {
            if (!button.classList.contains('view-assignment')) {
                button.disabled = show;
            }
        });
        
        // 如果沒有加載指示器，添加一個
        let loadingIndicator = document.getElementById('loading-indicator');
        if (!loadingIndicator && show) {
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-indicator';
            loadingIndicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            loadingIndicator.innerHTML = `
                <div style="text-align: center;">
                    <div class="spinner" style="
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        margin: 0 auto 15px;
                        animation: spin 2s linear infinite;
                    "></div>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(loadingIndicator);
            
            // 添加旋轉動畫的樣式
            if (!document.getElementById('spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        } else if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
            if (show) {
                loadingIndicator.querySelector('p').textContent = message;
            }
        }
    }

    // 更新用戶資訊的函數
    function updateUserInfo(name) {
        // 更新側邊欄的教師資訊
        const teacherInfo = document.querySelector('.teacher-info');
        if (teacherInfo) {
            // 假設第一個 p 元素是教師姓名
            const nameParagraph = teacherInfo.querySelector('p:first-child');
            if (nameParagraph) {
                nameParagraph.textContent = `${name} 教授`;
            }
        }
    }

    // 在側邊欄中保持"作業批改"選項為活動狀態
    document.querySelectorAll('.menu-item').forEach(item => {
        if (item.textContent.trim() === '作業批改') {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
});