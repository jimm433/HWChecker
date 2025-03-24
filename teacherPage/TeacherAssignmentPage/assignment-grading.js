document.addEventListener('DOMContentLoaded', function() {
    // 初始化 AI 客戶端
    const aiClient = new AIClient('/api/ai');
    
    // DOM元素
    const courseSelect = document.getElementById('course-select');
    const assignmentSelect = document.getElementById('assignment-select');
    const loadAssignmentsBtn = document.getElementById('load-assignments');
    const autoGradeToggle = document.getElementById('auto-grade-toggle');
    const gradingCriteriaSelect = document.getElementById('grading-criteria');
    const aiFeedbackLevelSelect = document.getElementById('ai-feedback-level');
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
    
    // 從 localStorage 讀取用戶資訊
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    // 檢查是否已登入
    if (!userId || !userName || userRole !== 'teacher') {
        // 未登入或不是教師，重定向到登入頁面
        alert('請先登入');
        window.location.href = '../../index.html';
        return;
    }

    // 更新頁面上的教師資訊
    updateUserInfo(userName);
    
    // 全局變數
    let currentAssignments = [];
    let currentAssignmentData = null;
    let isLoading = false;

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
    }

    // 載入課程資料
    function loadCourseData() {
        // 顯示載入狀態
        showLoading(true);
        
        // 從API獲取課程資料
        fetch('/api/teacher/courses')
            .then(response => {
                if (!response.ok) {
                    throw new Error('無法載入課程資料');
                }
                return response.json();
            })
            .then(courses => {
                fillCoursesDropdown(courses);
                showLoading(false);
            })
            .catch(error => {
                console.error('載入課程資料錯誤:', error);
                // 使用模擬數據
                const mockCourses = [
                    { id: 'programming', name: '程式設計' },
                    { id: 'datastructure', name: '資料結構' },
                    { id: 'algorithm', name: '演算法' },
                    { id: 'database', name: '資料庫系統' }
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
        // 顯示載入狀態
        showLoading(true);
        
        // 從API獲取課程的作業列表
        fetch(`/api/teacher/courses/${courseId}/assignments`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('無法載入作業列表');
                }
                return response.json();
            })
            .then(assignments => {
                fillAssignmentsDropdown(assignments);
                showLoading(false);
            })
            .catch(error => {
                console.error('載入作業列表錯誤:', error);
                // 使用模擬數據
                const mockAssignmentsMap = {
                    'programming': [
                        { id: 'prog-hw1', name: '程式設計作業1: 基礎語法' },
                        { id: 'prog-hw2', name: '程式設計作業2: 條件與循環' },
                        { id: 'prog-hw3', name: '程式設計作業3: 函數與模組化' }
                    ],
                    'datastructure': [
                        { id: 'ds-hw1', name: '資料結構作業1: 陣列與鏈結串列' },
                        { id: 'ds-hw2', name: '資料結構作業2: 堆疊與佇列' }
                    ],
                    'algorithm': [
                        { id: 'algo-hw1', name: '演算法作業1: 排序演算法' },
                        { id: 'algo-hw2', name: '演算法作業2: 搜尋演算法' }
                    ],
                    'database': [
                        { id: 'db-hw1', name: '資料庫作業1: SQL基礎查詢' },
                        { id: 'db-hw2', name: '資料庫作業2: 資料庫設計' }
                    ]
                };
                
                const assignments = mockAssignmentsMap[courseId] || [];
                fillAssignmentsDropdown(assignments);
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
        // 顯示載入中提示
        assignmentList.innerHTML = '<tr class="empty-row"><td colspan="7">載入中...</td></tr>';
        showLoading(true);

        // 從API獲取作業提交記錄
        fetch(`/api/teacher/courses/${courseId}/assignments/${assignmentId}/submissions`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('無法載入作業提交記錄');
                }
                return response.json();
            })
            .then(submissions => {
                // 保存當前作業數據
                currentAssignments = submissions;

                // 更新數量顯示
                assignmentCountEl.textContent = submissions.length;

                // 填充作業列表
                renderAssignmentList(submissions);
                showLoading(false);
            })
            .catch(error => {
                console.error('載入作業提交記錄錯誤:', error);
                // 使用模擬數據
                const mockSubmissions = generateMockSubmissions(courseId, assignmentId);
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
            case '未處理':
                return 'status-pending';
            case '處理中':
                return 'status-processing';
            case '已完成':
                return 'status-completed';
            case '失敗':
                return 'status-failed';
            default:
                return '';
        }
    }

    // 生成模擬作業提交數據 (開發環境使用)
    function generateMockSubmissions(courseId, assignmentId) {
        const courseNames = {
            'programming': '程式設計',
            'datastructure': '資料結構',
            'algorithm': '演算法',
            'database': '資料庫系統'
        };

        const assignmentNames = {
            'prog-hw1': '程式設計作業1: 基礎語法',
            'prog-hw2': '程式設計作業2: 條件與循環',
            'prog-hw3': '程式設計作業3: 函數與模組化',
            'ds-hw1': '資料結構作業1: 陣列與鏈結串列',
            'ds-hw2': '資料結構作業2: 堆疊與佇列',
            'algo-hw1': '演算法作業1: 排序演算法',
            'algo-hw2': '演算法作業2: 搜尋演算法',
            'db-hw1': '資料庫作業1: SQL基礎查詢',
            'db-hw2': '資料庫作業2: 資料庫設計'
        };

        const courseName = courseNames[courseId] || courseId;
        const assignmentName = assignmentNames[assignmentId] || assignmentId;

        // 學生名單
        const students = [
            { name: '陳小明', id: 'S10911001' },
            { name: '林雅婷', id: 'S10911002' },
            { name: '王大華', id: 'S10911003' },
            { name: '張美玲', id: 'S10911004' },
            { name: '李俊宏', id: 'S10911005' },
            { name: '黃雅琪', id: 'S10911006' },
            { name: '吳建志', id: 'S10911007' },
            { name: '劉詩涵', id: 'S10911008' }
        ];

        // 生成10-20份作業提交
        const count = Math.floor(Math.random() * 11) + 10;
        const submissions = [];

        for (let i = 0; i < count; i++) {
            const student = students[i % students.length];
            const aiStatus = ['未處理', '處理中', '已完成', '失敗'][Math.floor(Math.random() * 4)];
            let aiScore = null;

            if (aiStatus === '已完成') {
                aiScore = Math.floor(Math.random() * 31) + 70; // 70-100分之間
            }

            const teacherConfirmed = Math.random() > 0.7;

            // 生成3天內的隨機時間
            const now = new Date();
            const submitDate = new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000);
            const submitTime = submitDate.toLocaleString('zh-TW');

            submissions.push({
                id: `${assignmentId}-${student.id}`,
                studentName: student.name,
                studentId: student.id,
                courseName: courseName,
                courseId: courseId,
                assignmentName: assignmentName,
                assignmentId: assignmentId,
                submitTime: submitTime,
                aiStatus: aiStatus,
                aiScore: aiScore,
                teacherConfirmed: teacherConfirmed,
                // 模擬作業內容
                content: generateMockAssignmentContent(courseId, assignmentId),
                // 如果AI已評分，添加AI評分細節
                aiGrade: aiStatus === '已完成' ? generateMockAiGrading(aiScore) : null
            });
        }

        return submissions;
    }

    // 生成模擬作業內容 (開發環境使用)
    function generateMockAssignmentContent(courseId, assignmentId) {
        const contentTemplates = {
            'programming': `#include <stdio.h>

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
}`,
            'datastructure': `class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

class LinkedList {
    constructor() {
        this.head = null;
    }
    
    // 在鏈結串列尾端插入新節點
    append(data) {
        const newNode = new Node(data);
        
        if (!this.head) {
            this.head = newNode;
            return;
        }
        
        let current = this.head;
        while (current.next) {
            current = current.next;
        }
        
        current.next = newNode;
    }
    
    // 顯示鏈結串列的所有元素
    display() {
        let current = this.head;
        let elements = [];
        
        while (current) {
            elements.push(current.data);
            current = current.next;
        }
        
        return elements.join(' -> ');
    }
}

// 測試鏈結串列
const list = new LinkedList();
list.append(10);
list.append(20);
list.append(30);
console.log(list.display()); // 輸出: 10 -> 20 -> 30`,
            'algorithm': `function quickSort(arr, left = 0, right = arr.length - 1) {
    if (left < right) {
        const pivotIndex = partition(arr, left, right);
        quickSort(arr, left, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, right);
    }
    return arr;
}

function partition(arr, left, right) {
    const pivot = arr[right];
    let i = left - 1;
    
    for (let j = left; j < right; j++) {
        if (arr[j] <= pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    return i + 1;
}

// 測試快速排序
const arr = [34, 7, 23, 32, 5, 62];
console.log("排序前:", arr);
console.log("排序後:", quickSort(arr));`,
            'database': `-- 創建學生表格
CREATE TABLE Students (
    student_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    department VARCHAR(50),
    admission_year INT
);

-- 創建課程表格
CREATE TABLE Courses (
    course_id VARCHAR(10) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    credits INT,
    instructor VARCHAR(50)
);

-- 創建選課表格
CREATE TABLE Enrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(10),
    course_id VARCHAR(10),
    semester VARCHAR(20),
    grade FLOAT,
    FOREIGN KEY (student_id) REFERENCES Students(student_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

-- 查詢每位學生選的課程數量
SELECT s.student_id, s.name, COUNT(e.course_id) as course_count
FROM Students s
LEFT JOIN Enrollments e ON s.student_id = e.student_id
GROUP BY s.student_id, s.name
ORDER BY course_count DESC;`
        };

        return contentTemplates[courseId] || '// 作業內容';
    }

    // 生成模擬AI評分結果 (開發環境使用)
    function generateMockAiGrading(score) {
        const gradingItems = [
            { name: '程式正確性', score: Math.floor(Math.random() * 11) + 20, maxScore: 30, comment: '程式執行結果正確，但有些邊界條件處理不夠完善' },
            { name: '程式效率', score: Math.floor(Math.random() * 6) + 15, maxScore: 20, comment: '演算法選擇適當，但時間複雜度可以再優化' },
            { name: '程式碼風格', score: Math.floor(Math.random() * 6) + 15, maxScore: 20, comment: '變數命名適當，但程式碼註解不夠詳細' },
            { name: '程式架構', score: Math.floor(Math.random() * 6) + 15, maxScore: 20, comment: '程式模組化尚可，但函數抽象程度不夠' },
            { name: '報告完整性', score: Math.floor(Math.random() * 3) + 8, maxScore: 10, comment: '報告內容大致完整，但缺少測試數據分析' }
        ];

        const totalGradingScore = gradingItems.reduce((sum, item) => sum + item.score, 0);

        return {
            score: score,
            gradingItems: gradingItems,
            summary: `整體來說，此作業達到了課程要求的基本標準。程式能夠正確處理輸入並產生期望的輸出，但在程式效率和程式碼風格方面還有改進空間。建議同學未來可以注重以下幾點：
1. 處理更多的邊界條件和異常情況
2. 進一步優化演算法的時間和空間複雜度
3. 增加更詳細的註釋和文檔
4. 提高程式碼的可讀性和可維護性
5. 在報告中加入更多的測試數據和分析`,
            feedback: `程式能夠正確執行，但在以下幾方面可以進一步改進：

1. 程式正確性（${gradingItems[0].score}/${gradingItems[0].maxScore}分）：
   - 基本功能正確實現
   - 但缺少輸入驗證，例如檢查n是否為正整數
   - 未處理極端情況，如大數值可能導致的整數溢出

2. 程式效率（${gradingItems[1].score}/${gradingItems[1].maxScore}分）：
   - 當前實現的時間複雜度為O(n)
   - 可考慮使用數學公式sum = n*(n+1)/2，將時間複雜度降為O(1)

3. 程式碼風格（${gradingItems[2].score}/${gradingItems[2].maxScore}分）：
   - 變數命名清晰易懂
   - 程式碼結構良好
   - 但註釋不夠詳細，特別是演算法的思考過程

4. 程式架構（${gradingItems[3].score}/${gradingItems[3].maxScore}分）：
   - 基本的模組化設計
   - 功能應進一步抽象為獨立函數以提高可讀性和可重用性

5. 報告完整性（${gradingItems[4].score}/${gradingItems[4].maxScore}分）：
   - 報告中包含了基本的問題描述和解決方案
   - 缺少演算法分析和測試結果的詳細討論`
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
        
        // 高亮代碼（如果有使用程式碼高亮庫如highlight.js）
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
        isLoading = true;

        // 獲取評分標準和回饋詳細程度
        const criteriaLevel = gradingCriteriaSelect.value;
        const feedbackLevel = aiFeedbackLevelSelect.value;

        // 準備發送給AI批改的數據
        const gradingData = {
            submission: {
                id: submission.id,
                studentId: submission.studentId,
                courseId: submission.courseId,
                assignmentId: submission.assignmentId,
                content: submission.content
            },
            options: {
                criteriaLevel: criteriaLevel,
                feedbackLevel: feedbackLevel
            }
        };

        // 調用AI服務進行批改
        aiClient.gradeAssignment(gradingData.submission, gradingData.options)
            .then(response => {
                if (response.success) {
                    // 更新作業數據
                    submission.aiStatus = '已完成';
                    submission.aiScore = response.score;
                    submission.aiGrade = {
                        score: response.score,
                        gradingItems: response.gradingItems,
                        summary: response.summary,
                        feedback: response.feedback
                    };

                    // 更新UI
                    document.getElementById('ai-status-value').textContent = '已完成';
                    document.getElementById('ai-status-value').classList.remove('pulsing');
                    document.getElementById('ai-score').textContent = response.score;
                    document.getElementById('ai-comments').textContent = response.feedback;

                    // 更新評分項目表格
                    const aiGradingItemsTable = document.getElementById('ai-grading-items').querySelector('tbody');
                    aiGradingItemsTable.innerHTML = response.gradingItems.map(item => `
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
                    // AI批改失敗
                    submission.aiStatus = '失敗';
                    document.getElementById('ai-status-value').textContent = '失敗';
                    document.getElementById('ai-status-value').classList.remove('pulsing');
                    document.getElementById('ai-score').textContent = '-';
                    document.getElementById('ai-comments').textContent = '批改失敗: ' + (response.error || '未知錯誤');
                    document.getElementById('accept-ai-grade').disabled = true;
                }

                // 重新渲染作業列表
                renderAssignmentList(currentAssignments);
                isLoading = false;
            })
            .catch(error => {
                console.error('AI批改錯誤:', error);
                
                // 更新UI狀態
                submission.aiStatus = '失敗';
                document.getElementById('ai-status-value').textContent = '失敗';
                document.getElementById('ai-status-value').classList.remove('pulsing');
                document.getElementById('ai-comments').textContent = '批改失敗: ' + error.message;
                document.getElementById('accept-ai-grade').disabled = true;
                
                // 重新渲染作業列表
                renderAssignmentList(currentAssignments);
                isLoading = false;
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
            alert(`開始批次批改 ${pendingAssignments.length} 份作業，請稍候...`);
            showLoading(true);

            // 獲取評分標準和回饋詳細程度
            const criteriaLevel = gradingCriteriaSelect.value;
            const feedbackLevel = aiFeedbackLevelSelect.value;

            // 準備批次作業數據
            const assignments = pendingAssignments.map(submission => ({
                id: submission.id,
                studentId: submission.studentId,
                courseId: submission.courseId,
                assignmentId: submission.assignmentId,
                content: submission.content
            }));

            // 批次處理配置
            const options = {
                criteriaLevel: criteriaLevel,
                feedbackLevel: feedbackLevel
            };

            // 進度回調函數
            const onProgress = (completed, total, result) => {
                const percentage = Math.round((completed / total) * 100);
                console.log(`批次批改進度: ${percentage}% (${completed}/${total})`);
                
                // 這裡可以添加更新UI的代碼，例如更新進度條
            };

            // 調用AI服務進行批次批改
            aiClient.batchGradeAssignments(assignments, options, onProgress)
                .then(results => {
                    // 處理批次批改結果
                    let successCount = 0;
                    let failedCount = 0;

                    results.forEach(result => {
                        if (result.success) {
                            successCount++;
                            
                            // 更新對應作業的數據
                            const submission = currentAssignments.find(s => s.id === result.assignmentId);
                            if (submission) {
                                submission.aiStatus = '已完成';
                                submission.aiScore = result.score;
                                submission.aiGrade = {
                                    score: result.score,
                                    gradingItems: result.gradingItems,
                                    summary: result.summary,
                                    feedback: result.feedback
                                };
                            }
                        } else {
                            failedCount++;
                            
                            // 標記失敗的作業
                            const submission = currentAssignments.find(s => s.id === result.assignmentId);
                            if (submission) {
                                submission.aiStatus = '失敗';
                            }
                        }
                    });

                    // 完成後更新UI
                    alert(`批次批改完成！成功: ${successCount} 份，失敗: ${failedCount} 份`);
                    renderAssignmentList(currentAssignments);
                    showLoading(false);
                })
                .catch(error => {
                    console.error('批次批改錯誤:', error);
                    alert(`批次批改發生錯誤: ${error.message}`);
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
        showLoading(true);
        saveGradeBtn.disabled = true;
        saveGradeBtn.textContent = '儲存中...';

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

        // 發送到API
        fetch(`/api/teacher/grade-assignment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gradeData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('儲存評分失敗');
            }
            return response.json();
        })
        .then(result => {
            alert('批改結果已儲存！');
            modal.style.display = 'none';
            
            // 重新渲染作業列表
            renderAssignmentList(currentAssignments);
        })
        .catch(error => {
            console.error('儲存評分錯誤:', error);
            // 仍然在本地更新UI，但顯示警告
            alert(`無法與伺服器同步評分結果: ${error.message}。結果已暫存在本地。`);
            modal.style.display = 'none';
            
            // 重新渲染作業列表
            renderAssignmentList(currentAssignments);
        })
        .finally(() => {
            // 恢復按鈕狀態
            saveGradeBtn.disabled = false;
            saveGradeBtn.textContent = '儲存批改結果';
            showLoading(false);
        });
    }

    // 顯示/隱藏載入狀態
    function showLoading(show) {
        isLoading = show;
        
        // 可以在這裡添加顯示載入動畫或禁用按鈕的代碼
        const buttons = document.querySelectorAll('button:not(.close-modal)');
        buttons.forEach(button => {
            button.disabled = show && !button.classList.contains('view-assignment');
        });
        
        // 如果有載入指示器元素
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'block' : 'none';
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