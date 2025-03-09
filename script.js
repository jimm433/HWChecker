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

    // 5. 修改後的登入函式 (連接後端API)
    function loginUser(formElement, role) {
        clearError(formElement);

        const userId = formElement.querySelector('input[type="text"]').value.trim();
        const password = formElement.querySelector('input[type="password"]').value.trim();

        if (!userId || !password) {
            showError('請填寫所有欄位', formElement);
            return;
        }

        // 發送 API 請求到你的伺服器
        fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, password, role })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 登入成功
                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('userName', data.user.name);

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
                console.error('登入錯誤:', error);
                showError('伺服器連接錯誤，請稍後再試', formElement);
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