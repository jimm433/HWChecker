document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const courseList = document.getElementById('course-list');
    const courseItems = document.querySelectorAll('.course-item');
    const searchCourseInput = document.getElementById('search-course');
    const searchStudentInput = document.getElementById('search-student');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // 模態視窗元素
    const courseModal = document.getElementById('course-modal');
    const studentModal = document.getElementById('student-modal');
    const courseModalTitle = document.getElementById('course-modal-title');
    const courseForm = document.getElementById('course-form');
    const addStudentForm = document.getElementById('add-student-form');

    // 按鈕元素
    const addCourseBtn = document.getElementById('add-course-btn');
    const editCourseBtn = document.getElementById('edit-course-btn');
    const deleteCourseBtn = document.getElementById('delete-course-btn');
    const addStudentBtn = document.getElementById('add-student-btn');
    const exportStudentListBtn = document.getElementById('export-student-list-btn');
    const cancelCourseBtn = document.getElementById('cancel-course-btn');
    const cancelAddStudentBtn = document.getElementById('cancel-add-student-btn');
    const uploadMaterialBtn = document.getElementById('upload-material-btn');
    const createAssignmentBtn = document.getElementById('create-assignment-btn');

    // 關閉模態視窗按鈕
    const closeModalButtons = document.querySelectorAll('.close-modal');

    // 資料篩選元素
    const materialTypeFilter = document.getElementById('material-type-filter');
    const assignmentStatusFilter = document.getElementById('assignment-status-filter');

    // 當前選中的課程ID
    let currentCourseId = 'programming';

    // 課程數據 (模擬資料)
    const coursesData = {
        'programming': {
            id: 'programming',
            name: '程式設計',
            code: 'CSC101',
            semester: '112-2',
            time: '星期一 9:00-12:00',
            location: '資訊大樓301教室',
            credits: 3,
            studentCount: 38,
            description: '本課程介紹程式設計的基本概念與技巧，包含變數、運算式、流程控制、函數、陣列、指標、結構與檔案處理等主題。學生將使用C語言進行程式設計實作，培養邏輯思考與問題解決能力。課程除了理論講授外，還包含多個實作練習與專題開發，幫助學生熟練程式設計技巧並應用於實際問題。'
        },
        'datastructure': {
            id: 'datastructure',
            name: '資料結構',
            code: 'CSC201',
            semester: '112-2',
            time: '星期三 13:30-16:30',
            location: '資訊大樓302教室',
            credits: 3,
            studentCount: 42,
            description: '本課程介紹常用的資料結構與相關演算法，包含陣列、鏈結串列、堆疊、佇列、樹、圖形以及各種搜尋與排序技術。學生將學習如何分析演算法效率，以及在實際問題中選擇適當的資料結構。課程著重理論與實務的結合，學生將透過程式實作練習，培養解決複雜問題的能力。'
        },
        'algorithm': {
            id: 'algorithm',
            name: '演算法',
            code: 'CSC303',
            semester: '112-2',
            time: '星期四 15:00-18:00',
            location: '資訊大樓303教室',
            credits: 3,
            studentCount: 35,
            description: '本課程深入探討各種演算法設計與分析技術，涵蓋貪婪法、分治法、動態規劃、回溯法、分支限界法等。課程將討論各類經典問題的最佳解法，並分析演算法的時間與空間複雜度。學生將學習如何設計高效能的演算法，並應用於解決實際問題。'
        },
        'database': {
            id: 'database',
            name: '資料庫系統',
            code: 'CSC305',
            semester: '112-2',
            time: '星期五 10:00-13:00',
            location: '資訊大樓304教室',
            credits: 3,
            studentCount: 41,
            description: '本課程介紹資料庫系統的基本概念與技術，包含關聯式資料庫模型、SQL語言、資料庫設計理論、正規化、交易處理、並行控制與復原技術等。學生將學習如何設計資料庫結構、撰寫SQL查詢語句，以及開發資料庫應用程式。課程包含多個實作練習，讓學生熟悉資料庫系統的操作與管理。'
        }
    };

    // 初始化
    initializeApp();

    // 初始化應用
    function initializeApp() {
        // 載入預設課程詳情
        loadCourseDetails(currentCourseId);

        // 設置事件監聽器
        setupEventListeners();
    }

    // 設置事件監聽器
    function setupEventListeners() {
        // 課程項目點擊事件
        courseItems.forEach(item => {
            item.addEventListener('click', function() {
                const courseId = this.getAttribute('data-id');
                selectCourse(courseId);
            });
        });

        // 搜尋課程輸入事件
        searchCourseInput.addEventListener('input', function() {
            filterCourses(this.value);
        });

        // 搜尋學生輸入事件
        searchStudentInput.addEventListener('input', function() {
            filterStudents(this.value);
        });

        // 標籤切換事件
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        // 新增課程按鈕事件
        addCourseBtn.addEventListener('click', function() {
            openCourseModal('add');
        });

        // 編輯課程按鈕事件
        editCourseBtn.addEventListener('click', function() {
            openCourseModal('edit');
        });

        // 刪除課程按鈕事件
        deleteCourseBtn.addEventListener('click', function() {
            confirmDeleteCourse();
        });

        // 新增學生按鈕事件
        addStudentBtn.addEventListener('click', function() {
            openStudentModal();
        });

        // 匯出學生名單按鈕事件
        exportStudentListBtn.addEventListener('click', function() {
            exportStudentList();
        });

        // 上傳教材按鈕事件
        uploadMaterialBtn.addEventListener('click', function() {
            alert('上傳教材功能尚未實作');
        });

        // 建立作業按鈕事件
        createAssignmentBtn.addEventListener('click', function() {
            alert('建立作業功能尚未實作');
        });

        // 教材類型篩選事件
        materialTypeFilter.addEventListener('change', function() {
            filterMaterials(this.value);
        });

        // 作業狀態篩選事件
        assignmentStatusFilter.addEventListener('change', function() {
            filterAssignments(this.value);
        });

        // 課程表單提交事件
        courseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveCourseData();
        });

        // 新增學生表單提交事件
        addStudentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addStudentToList();
        });

        // 取消課程編輯按鈕事件
        cancelCourseBtn.addEventListener('click', function() {
            closeCourseModal();
        });

        // 取消新增學生按鈕事件
        cancelAddStudentBtn.addEventListener('click', function() {
            closeStudentModal();
        });

        // 關閉模態視窗按鈕事件
        closeModalButtons.forEach(button => {
            button.addEventListener('click', function() {
                // 找到最近的模態視窗元素
                const modal = this.closest('.modal');
                if (modal === courseModal) {
                    closeCourseModal();
                } else if (modal === studentModal) {
                    closeStudentModal();
                }
            });
        });

        // 點擊模態視窗外部關閉
        window.addEventListener('click', function(event) {
            if (event.target === courseModal) {
                closeCourseModal();
            } else if (event.target === studentModal) {
                closeStudentModal();
            }
        });

        // 學生列表中的操作按鈕事件
        document.querySelectorAll('#student-list button').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim();
                const studentId = this.closest('tr').querySelector('td:first-child').textContent;

                if (action === '查看') {
                    alert(`查看學生 ${studentId} 資料`);
                } else if (action === '移除') {
                    if (confirm(`確定要從課程中移除學生 ${studentId} 嗎？`)) {
                        this.closest('tr').remove();
                    }
                }
            });
        });

        // 教材列表中的操作按鈕事件
        document.querySelectorAll('.material-actions button').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim();
                const materialName = this.closest('.material-item').querySelector('.material-name').textContent;

                if (action === '下載') {
                    alert(`下載教材: ${materialName}`);
                } else if (action === '刪除') {
                    if (confirm(`確定要刪除教材 "${materialName}" 嗎？`)) {
                        this.closest('.material-item').remove();
                    }
                }
            });
        });

        // 作業列表中的操作按鈕事件
        document.querySelectorAll('.assignment-actions button').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim();
                const assignmentName = this.closest('.assignment-item').querySelector('.assignment-name').textContent;

                if (action === '查看') {
                    alert(`查看作業: ${assignmentName}`);
                } else if (action === '編輯') {
                    alert(`編輯作業: ${assignmentName}`);
                } else if (action === '刪除') {
                    if (confirm(`確定要刪除作業 "${assignmentName}" 嗎？`)) {
                        this.closest('.assignment-item').remove();
                    }
                }
            });
        });
    }

    // 選擇課程
    function selectCourse(courseId) {
        // 更新當前選中的課程ID
        currentCourseId = courseId;

        // 更新UI顯示
        courseItems.forEach(item => {
            if (item.getAttribute('data-id') === courseId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 載入課程詳情
        loadCourseDetails(courseId);
    }

    // 載入課程詳情
    function loadCourseDetails(courseId) {
        const courseData = coursesData[courseId];

        if (!courseData) {
            console.error('找不到課程資料:', courseId);
            return;
        }

        // 填充課程詳情標題
        document.getElementById('detail-course-name').textContent = courseData.name;
        document.getElementById('detail-course-code').textContent = courseData.code;
        document.getElementById('detail-course-semester').textContent = courseData.semester;

        // 填充基本資訊標籤內容
        document.getElementById('info-course-name').textContent = courseData.name;
        document.getElementById('info-course-code').textContent = courseData.code;
        document.getElementById('info-course-semester').textContent = courseData.semester;
        document.getElementById('info-course-time').textContent = courseData.time;
        document.getElementById('info-course-location').textContent = courseData.location;
        document.getElementById('info-course-credits').textContent = courseData.credits;
        document.getElementById('info-course-students').textContent = `${courseData.studentCount} 位學生`;
        document.getElementById('info-course-description').textContent = courseData.description;
    }

    // 篩選課程列表
    function filterCourses(searchText) {
        const searchLower = searchText.toLowerCase();

        courseItems.forEach(item => {
            const courseName = item.querySelector('.course-name').textContent.toLowerCase();
            const courseCode = item.querySelector('.course-code').textContent.toLowerCase();

            if (courseName.includes(searchLower) || courseCode.includes(searchLower)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // 篩選學生列表
    function filterStudents(searchText) {
        const searchLower = searchText.toLowerCase();
        const rows = document.querySelectorAll('#student-list tr');

        rows.forEach(row => {
            const studentId = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
            const studentName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const department = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

            if (studentId.includes(searchLower) || studentName.includes(searchLower) || department.includes(searchLower)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    // 篩選教材列表
    function filterMaterials(type) {
        const materialItems = document.querySelectorAll('.material-item');

        materialItems.forEach(item => {
            const materialType = item.querySelector('.material-type').textContent;

            if (type === 'all' || materialType.includes(getTypeText(type))) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        function getTypeText(type) {
            switch (type) {
                case 'lecture':
                    return '課程講義';
                case 'practice':
                    return '實習教材';
                case 'reference':
                    return '參考資料';
                default:
                    return '';
            }
        }
    }

    // 篩選作業列表
    function filterAssignments(status) {
        const assignmentItems = document.querySelectorAll('.assignment-item');

        assignmentItems.forEach(item => {
            const statusEl = item.querySelector('.assignment-status');

            if (status === 'all' || statusEl.classList.contains(status)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // 切換標籤
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

    // 打開課程模態視窗
    function openCourseModal(mode) {
        const form = document.getElementById('course-form');

        // 設置模態視窗標題
        if (mode === 'add') {
            courseModalTitle.textContent = '新增課程';
            form.reset();
        } else if (mode === 'edit') {
            courseModalTitle.textContent = '編輯課程';
            fillCourseForm();
        }

        // 顯示模態視窗
        courseModal.style.display = 'block';
    }

    // 關閉課程模態視窗
    function closeCourseModal() {
        courseModal.style.display = 'none';
    }

    // 填充課程表單
    function fillCourseForm() {
        const courseData = coursesData[currentCourseId];

        if (!courseData) {
            console.error('找不到課程資料:', currentCourseId);
            return;
        }

        document.getElementById('course-name').value = courseData.name;
        document.getElementById('course-code').value = courseData.code;
        document.getElementById('course-semester').value = courseData.semester;

        // 解析時間
        const timeParts = courseData.time.split(' ');
        document.getElementById('course-day').value = timeParts[0];
        document.getElementById('course-time').value = timeParts[1];

        document.getElementById('course-location').value = courseData.location;
        document.getElementById('course-credits').value = courseData.credits;
        document.getElementById('course-description').value = courseData.description;
    }

    // 保存課程資料
    function saveCourseData() {
        const formData = {
            name: document.getElementById('course-name').value,
            code: document.getElementById('course-code').value,
            semester: document.getElementById('course-semester').value,
            time: `${document.getElementById('course-day').value} ${document.getElementById('course-time').value}`,
            location: document.getElementById('course-location').value,
            credits: parseInt(document.getElementById('course-credits').value),
            description: document.getElementById('course-description').value
        };

        // 判斷是新增還是編輯
        const isAdd = courseModalTitle.textContent === '新增課程';

        if (isAdd) {
            // 生成新的課程ID
            const newId = 'course_' + Date.now();

            // 添加新課程
            coursesData[newId] = {
                id: newId,
                ...formData,
                studentCount: 0
            };

            // 添加到課程列表
            addCourseToList(newId, formData);

            // 選擇新課程
            selectCourse(newId);
        } else {
            // 更新現有課程
            const courseData = coursesData[currentCourseId];

            if (courseData) {
                // 保留原有的學生數量
                const studentCount = courseData.studentCount;

                // 更新課程資料
                coursesData[currentCourseId] = {
                    id: currentCourseId,
                    ...formData,
                    studentCount: studentCount
                };

                // 更新UI
                updateCourseListItem(currentCourseId, formData);
                loadCourseDetails(currentCourseId);
            }
        }

        // 關閉模態視窗
        closeCourseModal();

        // 顯示成功訊息
        alert(`課程${isAdd ? '新增' : '更新'}成功`);
    }

    // 添加課程到列表
    function addCourseToList(courseId, courseData) {
        const li = document.createElement('li');
        li.className = 'course-item';
        li.setAttribute('data-id', courseId);

        li.innerHTML = `
            <div class="course-item-header">
                <span class="course-code">${courseData.code}</span>
                <span class="course-semester">${courseData.semester}</span>
            </div>
            <div class="course-name">${courseData.name}</div>
            <div class="course-info">
                <span class="course-time">${courseData.time}</span>
                <span class="student-count">0 位學生</span>
            </div>
        `;

        li.addEventListener('click', function() {
            selectCourse(courseId);
        });

        courseList.appendChild(li);
    }

    // 更新課程列表項目
    function updateCourseListItem(courseId, courseData) {
        const courseItem = Array.from(courseItems).find(item => item.getAttribute('data-id') === courseId);

        if (courseItem) {
            courseItem.querySelector('.course-code').textContent = courseData.code;
            courseItem.querySelector('.course-semester').textContent = courseData.semester;
            courseItem.querySelector('.course-name').textContent = courseData.name;
            courseItem.querySelector('.course-time').textContent = courseData.time;
        }
    }

    // 確認刪除課程
    function confirmDeleteCourse() {
        const courseData = coursesData[currentCourseId];

        if (!courseData) {
            console.error('找不到課程資料:', currentCourseId);
            return;
        }

        if (confirm(`確定要刪除課程 "${courseData.name}" 嗎？此操作無法復原。`)) {
            // 從數據中刪除
            delete coursesData[currentCourseId];

            // 從UI中刪除
            const courseItem = Array.from(courseItems).find(item => item.getAttribute('data-id') === currentCourseId);
            if (courseItem) {
                courseItem.remove();
            }

            // 選擇列表中的第一個課程（如果存在）
            const firstCourseItem = document.querySelector('.course-item');
            if (firstCourseItem) {
                const firstCourseId = firstCourseItem.getAttribute('data-id');
                selectCourse(firstCourseId);
            } else {
                // 如果沒有課程，顯示空白內容
                clearCourseDetails();
            }

            // 顯示成功訊息
            alert('課程已成功刪除');
        }
    }

    // 清空課程詳情
    function clearCourseDetails() {
        document.getElementById('detail-course-name').textContent = '';
        document.getElementById('detail-course-code').textContent = '';
        document.getElementById('detail-course-semester').textContent = '';

        document.getElementById('info-course-name').textContent = '';
        document.getElementById('info-course-code').textContent = '';
        document.getElementById('info-course-semester').textContent = '';
        document.getElementById('info-course-time').textContent = '';
        document.getElementById('info-course-location').textContent = '';
        document.getElementById('info-course-credits').textContent = '';
        document.getElementById('info-course-students').textContent = '';
        document.getElementById('info-course-description').textContent = '';
    }

    // 打開學生模態視窗
    function openStudentModal() {
        document.getElementById('add-student-form').reset();
        studentModal.style.display = 'block';
    }

    // 關閉學生模態視窗
    function closeStudentModal() {
        studentModal.style.display = 'none';
    }

    // 新增學生到列表
    function addStudentToList() {
        const studentId = document.getElementById('student-id').value;
        const studentName = document.getElementById('student-name').value;
        const department = document.getElementById('student-department').value;
        const year = document.getElementById('student-year').value;

        // 檢查學生ID是否已存在
        const existingRow = Array.from(document.querySelectorAll('#student-list tr')).find(row => {
            return row.querySelector('td:first-child').textContent === studentId;
        });

        if (existingRow) {
            alert(`學號 ${studentId} 已存在於課程中`);
            return;
        }

        // 建立新的學生列
        const tbody = document.getElementById('student-list');
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${studentId}</td>
            <td>${studentName}</td>
            <td>${department}</td>
            <td>${year}</td>
            <td>0%</td>
            <td>-</td>
            <td>
                <button class="button-small">查看</button>
                <button class="button-small button-danger">移除</button>
            </td>
        `;

        // 添加按鈕事件
        tr.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim();

                if (action === '查看') {
                    alert(`查看學生 ${studentId} 資料`);
                } else if (action === '移除') {
                    if (confirm(`確定要從課程中移除學生 ${studentId} 嗎？`)) {
                        tr.remove();
                    }
                }
            });
        });

        tbody.appendChild(tr);

        // 更新課程學生數量
        const courseData = coursesData[currentCourseId];
        if (courseData) {
            courseData.studentCount++;
            document.getElementById('info-course-students').textContent = `${courseData.studentCount} 位學生`;

            // 更新課程列表中的學生數量
            const courseItem = Array.from(courseItems).find(item => item.getAttribute('data-id') === currentCourseId);
            if (courseItem) {
                courseItem.querySelector('.student-count').textContent = `${courseData.studentCount} 位學生`;
            }
        }

        // 關閉模態視窗
        closeStudentModal();

        // 顯示成功訊息
        alert(`學生 ${studentName} 已成功新增至課程`);
    }

    // 匯出學生名單
    function exportStudentList() {
        const courseData = coursesData[currentCourseId];

        if (!courseData) {
            console.error('找不到課程資料:', currentCourseId);
            return;
        }

        alert(`已匯出 ${courseData.name} 課程的學生名單`);
    }

    // 側邊欄選單項目點擊事件
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 選單導航
            const page = this.textContent.trim();
            switch (page) {
                case '儀表板':
                    window.location.href = '../teacher-dashboard.html';
                    break;
                case '課程管理':
                    // 修正課程管理頁面的路徑
                    window.location.href = '../CourseManagementPage/course-management.html';
                    break;
                case '學生成績':
                    alert('學生成績頁面正在建設中');
                    break;
                case '作業批改':
                    window.location.href = '../TeacherAssignmentPage/assignment-grading.html';
                    break;
                case '考試管理':
                    window.location.href = 'TeacherAssignmentPage/exam-management.html';
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

    // 登出功能 (從teacher-dashboard.js)
    document.querySelector('.logout').addEventListener('click', function() {
        if (confirm('確定要登出嗎？')) {
            window.location.href = '../../index.html';
        }
    });
});