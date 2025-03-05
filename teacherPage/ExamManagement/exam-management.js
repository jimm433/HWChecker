document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const examItems = document.querySelectorAll('.exam-item');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // 模態視窗元素
    const examModal = document.getElementById('exam-modal');
    const questionModal = document.getElementById('question-modal');
    const aiModal = document.getElementById('ai-modal');

    // 按鈕元素
    const addExamBtn = document.getElementById('add-exam-btn');
    const editExamBtn = document.getElementById('edit-exam-btn');
    const deleteExamBtn = document.getElementById('delete-exam-btn');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const aiGenerateBtn = document.getElementById('ai-generate-btn');
    const cancelExamBtn = document.getElementById('cancel-exam-btn');
    const generateBtn = document.getElementById('generate-btn');
    const cancelGenerateBtn = document.getElementById('cancel-generate-btn');
    const aiAssistBtn = document.getElementById('ai-assist-btn');
    const saveQuestionBtn = document.getElementById('save-question-btn');
    const cancelQuestionBtn = document.getElementById('cancel-question-btn');

    // 關閉模態視窗按鈕
    const closeModalButtons = document.querySelectorAll('.close-modal');

    // 設置事件監聽器
    function setupEventListeners() {
        // 考試項目點擊事件
        examItems.forEach(item => {
            item.addEventListener('click', function() {
                selectExam(this);
            });
        });

        // 標籤切換事件
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        // 新增考試按鈕
        addExamBtn.addEventListener('click', function() {
            openExamModal('add');
        });

        // 編輯考試按鈕
        editExamBtn.addEventListener('click', function() {
            openExamModal('edit');
        });

        // 刪除考試按鈕
        deleteExamBtn.addEventListener('click', function() {
            if (confirm('確定要刪除此考試嗎？此操作無法復原。')) {
                const activeItem = document.querySelector('.exam-item.active');
                if (activeItem) {
                    activeItem.remove();
                    // 選擇第一個考試（如果存在）
                    const firstItem = document.querySelector('.exam-item');
                    if (firstItem) {
                        selectExam(firstItem);
                    }
                }
            }
        });

        // 新增試題按鈕
        addQuestionBtn.addEventListener('click', function() {
            openQuestionModal();
        });

        // AI生成試題按鈕
        aiGenerateBtn.addEventListener('click', function() {
            openAiModal();
        });

        // 考試表單提交
        document.getElementById('exam-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveExam();
        });

        // 取消考試按鈕
        cancelExamBtn.addEventListener('click', function() {
            closeExamModal();
        });

        // 開始生成按鈕
        generateBtn.addEventListener('click', function() {
            generateQuestions();
        });

        // 取消生成按鈕
        cancelGenerateBtn.addEventListener('click', function() {
            closeAiModal();
        });

        // 試題表單提交
        document.getElementById('question-form').addEventListener('submit', function(e) {
            e.preventDefault();
            saveQuestion();
        });

        // AI輔助按鈕
        aiAssistBtn.addEventListener('click', function() {
            suggestQuestion();
        });

        // 取消試題按鈕
        cancelQuestionBtn.addEventListener('click', function() {
            closeQuestionModal();
        });

        // 關閉模態視窗按鈕
        closeModalButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal === examModal) {
                    closeExamModal();
                } else if (modal === questionModal) {
                    closeQuestionModal();
                } else if (modal === aiModal) {
                    closeAiModal();
                }
            });
        });

        // 題型選擇變更事件
        document.getElementById('question-type').addEventListener('change', function() {
            const type = this.value;
            const multipleChoiceOptions = document.getElementById('multiple-choice-options');
            const codingOptions = document.getElementById('coding-options');

            multipleChoiceOptions.style.display = 'none';
            codingOptions.style.display = 'none';

            if (type === 'multiple-choice') {
                multipleChoiceOptions.style.display = 'block';
            } else if (type === 'coding') {
                codingOptions.style.display = 'block';
            }
        });

        // 試題編輯和刪除按鈕
        document.querySelectorAll('.question-actions button').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.textContent.trim();
                const questionItem = this.closest('.question-item');

                if (action === '編輯') {
                    // 在實際應用中，這裡應該從後端獲取試題數據
                    openQuestionModal();
                } else if (action === '刪除') {
                    if (confirm('確定要刪除此試題嗎？')) {
                        questionItem.remove();
                    }
                }

                // 阻止冒泡，避免觸發考試項目的點擊事件
                event.stopPropagation();
            });
        });
    }

    // 選擇考試
    function selectExam(examItem) {
        examItems.forEach(item => {
            item.classList.remove('active');
        });
        examItem.classList.add('active');

        // 在實際應用中，這裡應該從後端獲取考試詳情數據
        const examId = examItem.getAttribute('data-id');
        const examTitle = examItem.querySelector('.exam-title').textContent;
        const examStatusClass = examItem.querySelector('.exam-status').classList[1];

        // 更新考試詳情
        document.getElementById('exam-title').textContent = examTitle;

        // 設置考試狀態徽章
        const statusBadge = document.querySelector('.status-badge');
        statusBadge.className = 'status-badge';
        statusBadge.classList.add(examStatusClass);
        statusBadge.textContent = getStatusText(examStatusClass);
    }

    // 切換標籤
    function switchTab(tabId) {
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            }
        });

        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId + '-tab') {
                content.classList.add('active');
            }
        });
    }

    // 打開考試模態視窗
    function openExamModal(mode) {
        const modalTitle = examModal.querySelector('.modal-header h2');

        if (mode === 'add') {
            modalTitle.textContent = '新增考試';
            document.getElementById('exam-form').reset();
        } else {
            modalTitle.textContent = '編輯考試';
            // 填充表單數據（在實際應用中，應該使用當前選中考試的數據）
            const examTitle = document.getElementById('exam-title').textContent;
            document.getElementById('modal-exam-title').value = examTitle;
        }

        examModal.style.display = 'block';
    }

    // 關閉考試模態視窗
    function closeExamModal() {
        examModal.style.display = 'none';
    }

    // 保存考試
    function saveExam() {
        const examTitle = document.getElementById('modal-exam-title').value;
        const course = document.getElementById('modal-exam-course').value;
        const examDate = document.getElementById('modal-exam-date').value;

        if (!examTitle || !course || !examDate) {
            alert('請填寫所有必填欄位！');
            return;
        }

        // 在實際應用中，這裡應該將數據發送到後端API
        // 模擬成功儲存
        alert('考試已成功儲存！');

        // 更新UI或添加新考試到列表
        const isNewExam = examModal.querySelector('.modal-header h2').textContent === '新增考試';

        if (isNewExam) {
            // 創建新考試項目
            const li = document.createElement('li');
            li.className = 'exam-item';
            li.setAttribute('data-id', 'exam-' + Date.now());
            li.innerHTML = `
                <div class="exam-status upcoming"></div>
                <div class="exam-info">
                    <div class="exam-title">${examTitle}</div>
                    <div class="exam-date">${formatDate(examDate)}</div>
                </div>
            `;

            // 添加點擊事件
            li.addEventListener('click', function() {
                selectExam(this);
            });

            // 添加到列表
            document.getElementById('exam-list').prepend(li);

            // 更新考試項目列表
            examItems = document.querySelectorAll('.exam-item');

            // 選擇新創建的考試
            selectExam(li);
        } else {
            // 更新現有考試
            const activeExam = document.querySelector('.exam-item.active');
            if (activeExam) {
                activeExam.querySelector('.exam-title').textContent = examTitle;
                activeExam.querySelector('.exam-date').textContent = formatDate(examDate);

                // 更新考試詳情
                document.getElementById('exam-title').textContent = examTitle;
            }
        }

        // 關閉模態視窗
        closeExamModal();
    }

    // 打開AI生成試題模態視窗
    function openAiModal() {
        aiModal.style.display = 'block';
    }

    // 關閉AI生成試題模態視窗
    function closeAiModal() {
        aiModal.style.display = 'none';
    }

    // 生成試題
    function generateQuestions() {
        const questionType = document.getElementById('ai-question-type').value;
        const questionCount = document.getElementById('ai-question-count').value;
        const topics = document.getElementById('ai-topics').value;

        if (!questionCount || questionCount < 1 || questionCount > 10) {
            alert('請輸入有效的題目數量（1-10題）');
            return;
        }

        // 在實際應用中，這裡應該調用LLM API生成試題

        // 模擬生成過程
        generateBtn.disabled = true;
        generateBtn.textContent = '生成中...';

        setTimeout(() => {
            alert(`成功生成 ${questionCount} 道試題！`);

            // 重置按鈕狀態
            generateBtn.disabled = false;
            generateBtn.textContent = '開始生成';

            // 關閉模態視窗
            closeAiModal();

            // 切換到試題管理標籤
            switchTab('questions');

            // 在實際應用中，這裡應該將生成的試題添加到列表
            // 這裡只是示範，添加一些模擬試題
            for (let i = 0; i < Math.min(questionCount, 3); i++) {
                addSampleQuestion(questionType);
            }
        }, 2000);
    }

    // 打開試題模態視窗
    function openQuestionModal() {
        // 重置表單
        document.getElementById('question-form').reset();
        document.getElementById('multiple-choice-options').style.display = 'none';
        document.getElementById('coding-options').style.display = 'none';

        questionModal.style.display = 'block';
    }

    // 關閉試題模態視窗
    function closeQuestionModal() {
        questionModal.style.display = 'none';
    }

    // 保存試題
    function saveQuestion() {
        const questionType = document.getElementById('question-type').value;
        const questionContent = document.getElementById('question-content').value;

        if (!questionType || !questionContent) {
            alert('請填寫所有必填欄位！');
            return;
        }

        // 在實際應用中，這裡應該將數據發送到後端API

        // 添加新試題到列表
        const questionGroup = document.querySelector(`.question-group h3:contains('${getQuestionTypeText(questionType)}')`);
        let groupContainer;

        if (questionGroup) {
            groupContainer = questionGroup.closest('.question-group');
        } else {
            // 創建新的題組
            groupContainer = document.createElement('div');
            groupContainer.className = 'question-group';

            const groupTitle = document.createElement('h3');
            groupTitle.textContent = getQuestionTypeText(questionType);

            groupContainer.appendChild(groupTitle);
            document.querySelector('.question-list').appendChild(groupContainer);
        }

        // 計算題號
        const questionItems = groupContainer.querySelectorAll('.question-item');
        const questionNumber = questionItems.length + 1;

        // 創建新的試題項目
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';

        // 根據題型設置不同的內容
        let optionsHtml = '';

        if (questionType === 'multiple-choice') {
            const options = ['A', 'B', 'C', 'D'];
            const optionInputs = document.querySelectorAll('#options-container input[type="text"]');
            const selectedOption = document.querySelector('input[name="correct-option"]:checked');
            const correctIndex = selectedOption ? parseInt(selectedOption.value) : 0;

            optionsHtml = '<div class="options">';

            optionInputs.forEach((input, index) => {
                const optionClass = index === correctIndex ? 'option correct' : 'option';
                optionsHtml += `<div class="${optionClass}">${options[index]}. ${input.value}</div>`;
            });

            optionsHtml += '</div>';
        }

        questionItem.innerHTML = `
            <div class="question-header">
                <span class="question-number">${questionNumber}</span>
                <div class="question-actions">
                    <button class="button-small">編輯</button>
                    <button class="button-small button-danger">刪除</button>
                </div>
            </div>
            <div class="question-content">
                <p>${questionContent}</p>
                ${optionsHtml}
            </div>
        `;

        // 添加按鈕事件
        const editButton = questionItem.querySelector('button:first-child');
        const deleteButton = questionItem.querySelector('button:last-child');

        editButton.addEventListener('click', function(event) {
            openQuestionModal();
            event.stopPropagation();
        });

        deleteButton.addEventListener('click', function(event) {
            if (confirm('確定要刪除此試題嗎？')) {
                questionItem.remove();
            }
            event.stopPropagation();
        });

        // 添加到題組
        groupContainer.appendChild(questionItem);

        // 關閉模態視窗
        closeQuestionModal();

        // 顯示成功訊息
        alert('試題已成功保存！');
    }

    // AI輔助提供試題建議
    function suggestQuestion() {
        const questionType = document.getElementById('question-type').value;

        if (!questionType) {
            alert('請先選擇題型');
            return;
        }

        // 在實際應用中，這裡應該調用LLM API獲取建議

        // 模擬建議過程
        aiAssistBtn.disabled = true;
        aiAssistBtn.textContent = '處理中...';

        setTimeout(() => {
            // 根據題型提供不同的建議
            if (questionType === 'multiple-choice') {
                document.getElementById('question-content').value = '在C語言中，以下哪個不是有效的循環結構？';
                document.getElementById('question-score').value = '5';

                // 顯示選項區域
                document.getElementById('multiple-choice-options').style.display = 'block';
                document.getElementById('coding-options').style.display = 'none';

                // 設置選項
                const optionInputs = document.querySelectorAll('#options-container input[type="text"]');
                const optionRadios = document.querySelectorAll('#options-container input[type="radio"]');

                optionInputs[0].value = 'for';
                optionInputs[1].value = 'while';
                optionInputs[2].value = 'do-while';
                optionInputs[3].value = 'repeat-until';

                // 設置正確答案
                optionRadios[3].checked = true;
            } else if (questionType === 'coding') {
                document.getElementById('question-content').value = '撰寫一個函數 calculateFactorial(int n)，用於計算 n 的階乘。階乘定義為 n! = n * (n-1) * ... * 2 * 1。';
                document.getElementById('question-score').value = '25';

                // 顯示程式碼區域
                document.getElementById('multiple-choice-options').style.display = 'none';
                document.getElementById('coding-options').style.display = 'block';

                // 設置參考解答
                document.getElementById('coding-answer').value = `int factorial(int n) {
    if (n <= 1)
        return 1;
    else
        return n * factorial(n - 1);
}

int main() {
    int result = factorial(5);
    printf("%d\\n", result); // 輸出: 120
    return 0;
}`;
            }

            // 重置按鈕狀態
            aiAssistBtn.disabled = false;
            aiAssistBtn.textContent = 'AI輔助';
        }, 1500);
    }

    // 添加示例試題
    function addSampleQuestion(type) {
        // 根據類型添加不同的示例試題
        if (type === 'all' || type === 'multiple-choice') {
            const questionGroup = document.querySelector('.question-group:nth-child(1)');
            const questionItems = questionGroup.querySelectorAll('.question-item');
            const questionNumber = questionItems.length + 1;

            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.innerHTML = `
                <div class="question-header">
                    <span class="question-number">${questionNumber}</span>
                    <div class="question-actions">
                        <button class="button-small">編輯</button>
                        <button class="button-small button-danger">刪除</button>
                    </div>
                </div>
                <div class="question-content">
                    <p>在C語言中，下列哪個運算符用於取得一個變數的記憶體位址？</p>
                    <div class="options">
                        <div class="option">A. *</div>
                        <div class="option correct">B. &</div>
                        <div class="option">C. #</div>
                        <div class="option">D. @</div>
                    </div>
                </div>
            `;

            // 添加按鈕事件
            const editButton = questionItem.querySelector('button:first-child');
            const deleteButton = questionItem.querySelector('button:last-child');

            editButton.addEventListener('click', function(event) {
                openQuestionModal();
                event.stopPropagation();
            });

            deleteButton.addEventListener('click', function(event) {
                if (confirm('確定要刪除此試題嗎？')) {
                    questionItem.remove();
                }
                event.stopPropagation();
            });

            questionGroup.appendChild(questionItem);
        }

        if (type === 'all' || type === 'coding') {
            const questionGroup = document.querySelector('.question-group:nth-child(2)');
            const questionItems = questionGroup.querySelectorAll('.question-item');
            const questionNumber = questionItems.length + 1;

            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.innerHTML = `
                <div class="question-header">
                    <span class="question-number">${questionNumber}</span>
                    <div class="question-actions">
                        <button class="button-small">編輯</button>
                        <button class="button-small button-danger">刪除</button>
                    </div>
                </div>
                <div class="question-content">
                    <p>實現一個函數，可以檢查一個字符串是否是回文字符串。回文字符串是指正序與倒序讀都相同的字符串。</p>
                </div>
            `;

            // 添加按鈕事件
            const editButton = questionItem.querySelector('button:first-child');
            const deleteButton = questionItem.querySelector('button:last-child');

            editButton.addEventListener('click', function(event) {
                openQuestionModal();
                event.stopPropagation();
            });

            deleteButton.addEventListener('click', function(event) {
                if (confirm('確定要刪除此試題嗎？')) {
                    questionItem.remove();
                }
                event.stopPropagation();
            });

            questionGroup.appendChild(questionItem);
        }
    }

    // 格式化日期
    function formatDate(dateStr) {
        if (!dateStr) return '';

        const date = new Date(dateStr);
        return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    }

    // 獲取狀態文本
    function getStatusText(status) {
        switch (status) {
            case 'upcoming':
                return '即將舉行';
            case 'active':
                return '進行中';
            case 'ended':
                return '已結束';
            case 'draft':
                return '草稿';
            default:
                return '';
        }
    }

    // 獲取題型文本
    function getQuestionTypeText(type) {
        if (type === 'multiple-choice') {
            return '選擇題（每題5分，共50分）';
        } else if (type === 'coding') {
            return '程式題（每題25分，共50分）';
        } else {
            return '試題';
        }
    }

    // 設置CSS選擇器擴展，用於匹配包含文本的元素
    Element.prototype.contains = function(text) {
        return this.textContent.includes(text);
    };

    // 側邊欄選單項目點擊事件
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // 這裡可以添加頁面導航邏輯
        });
    });

    // 登出功能
    document.querySelector('.logout').addEventListener('click', function() {
        if (confirm('確定要登出嗎？')) {
            window.location.href = '../index.html';
        }
    });

    // 初始化
    setupEventListeners();
});