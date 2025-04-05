document.addEventListener('DOMContentLoaded', function() {
    // 1. 取得各種元素
    const signInBtn = document.getElementById("signIn"); // 教師登入面板切換按鈕
    const signUpBtn = document.getElementById("signUp"); // 學生登入面板切換按鈕
    const studentForm = document.getElementById("form1"); // 學生登入表單
    const teacherForm = document.getElementById("form2"); // 教師登入表單
    const studentRegisterBtn = document.getElementById("studentRegisterBtn"); // 學生註冊按鈕
    const container = document.querySelector(".container");

    // 2. 表單切換顯示 (原先就有的功能)
    signInBtn.addEventListener("click", () => {
        // 點擊「教師登入」按鈕，移除右面板的樣式
        container.classList.remove("right-panel-active");
    });

    signUpBtn.addEventListener("click", () => {
        // 點擊「學生登入」按鈕，加入右面板的樣式
        container.classList.add("right-panel-active");
    });

    // 3. 顯示與清除錯誤訊息
    function showError(message, formElement) {
        clearError(formElement); // 先清除舊錯誤
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.marginTop = '10px';
        errorDiv.textContent = message;
        formElement.appendChild(errorDiv);
    }

    function clearError(formElement) {
        const errorDiv = formElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // 4. 偵測當前環境並設定 API 端點
    function getApiUrl() {
        // Netlify 環境
        return '/.netlify/functions/auth';
    }

    // 5. 登入函式
    function loginUser(formElement, role) {
        clearError(formElement);

        const userId = formElement.querySelector('input[type="text"]').value.trim();
        const password = formElement.querySelector('input[type="password"]').value.trim();

        if (!userId || !password) {
            showError('請填寫所有欄位', formElement);
            return;
        }

        // 顯示載入提示
        const loadingMsg = document.createElement('div');
        loadingMsg.textContent = '登入中...';
        loadingMsg.style.color = 'blue';
        loadingMsg.className = 'loading-message';
        formElement.appendChild(loadingMsg);

        // 確定 API 端點
        const apiUrl = getApiUrl();
        console.log('嘗試連接到API端點:', apiUrl);

        // 發送 API 請求
        fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: userId,
                    password: password,
                    role: role
                })
            })
            .then(response => {
                console.log('API 回應狀態:', response.status);

                // 檢查回應是否成功
                if (!response.ok) {
                    // 如果回應不成功，嘗試解析錯誤訊息
                    return response.text().then(errorText => {
                        console.error('錯誤回應內容:', errorText);
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                    });
                }

                return response.json();
            })
            .then(data => {
                console.log('API 回應數據:', data);

                // 移除載入提示
                const loadingElement = formElement.querySelector('.loading-message');
                if (loadingElement) loadingElement.remove();

                if (data.success) {
                    // 登入成功
                    localStorage.setItem('userId', data.user.userId);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('username', data.user.username);

                    // 導向相應頁面
                    if (role === 'teacher') {
                        window.location.href = 'teacherPage/teacher-dashboard.html';
                    } else {
                        window.location.href = 'studentPage/student-dashboard.html';
                    }
                } else {
                    // 登入失敗
                    showError(data.message || '帳號或密碼錯誤', formElement);
                }
            })
            .catch(error => {
                console.error('登入錯誤詳細信息:', error);

                // 移除載入提示
                const loadingElement = formElement.querySelector('.loading-message');
                if (loadingElement) loadingElement.remove();

                // 更詳細的錯誤訊息
                if (error.message.includes('Failed to fetch')) {
                    showError('無法連接到伺服器。請檢查網路連線。', formElement);
                } else {
                    showError(`登入失敗: ${error.message}`, formElement);
                }
            });
    }

    // 6. 學生登入事件
    studentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser(studentForm, 'student');
    });

    // 7. 教師登入事件
    teacherForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser(teacherForm, 'teacher');
    });

    // 8. 學生註冊按鈕事件
    studentRegisterBtn.addEventListener("click", () => {
        window.location.href = 'studentRegister/student-register.html';
    });
});