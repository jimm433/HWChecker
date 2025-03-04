javascript
document.addEventListener('DOMContentLoaded', function() {
    // 1. 取得各種元素
    const signInBtn = document.getElementById("signIn"); // 教師登入面板切換按鈕
    const signUpBtn = document.getElementById("signUp"); // 學生登入面板切換按鈕
    const studentForm = document.getElementById("form1"); // 學生登入表單
    const teacherForm = document.getElementById("form2"); // 教師登入表單
    const studentRegisterBtn = document.getElementById("studentRegisterBtn"); // 學生註冊按鈕
    const container = document.querySelector(".container");

    // 測試帳號 - 直接寫在前端用於測試
    const testAccounts = {
        teachers: [
            { userId: "teacher001", password: "Pass@123", role: "teacher" }
        ],
        students: [
            { userId: "student001", password: "Learn@123", role: "student" }
        ]
    };

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

    // 4. 修改登入函式以使用本地測試帳號
    async function loginUser(formElement, role) {
        clearError(formElement);

        const userId = formElement.querySelector('input[type="text"]').value.trim();
        const password = formElement.querySelector('input[type="password"]').value.trim();

        if (!userId || !password) {
            showError('請填寫所有欄位', formElement);
            return;
        }

        // 檢查是否為測試帳號
        let isAuthenticated = false;
        let userRole = '';

        if (role === 'student') {
            const student = testAccounts.students.find(s => s.userId === userId && s.password === password);
            if (student) {
                isAuthenticated = true;
                userRole = student.role;
            }
        } else {
            const teacher = testAccounts.teachers.find(t => t.userId === userId && t.password === password);
            if (teacher) {
                isAuthenticated = true;
                userRole = teacher.role;
            }
        }

        // 如果不是測試帳號，才嘗試呼叫後端API
        if (!isAuthenticated) {
            try {
                // 向後端發送登入請求
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    showError(data.message || '登入失敗', formElement);
                    return;
                }

                userRole = data.role;
                // 模擬一個假的token
                const fakeToken = btoa(JSON.stringify({ userId, role: userRole, timestamp: Date.now() }));
                localStorage.setItem('token', fakeToken);
            } catch (error) {
                // 如果後端請求失敗，直接顯示錯誤訊息
                showError('帳號或密碼錯誤', formElement);
                return;
            }
        } else {
            // 測試帳號登入成功，生成假的token
            const fakeToken = btoa(JSON.stringify({ userId, role: userRole, timestamp: Date.now() }));
            localStorage.setItem('token', fakeToken);
        }

        // 登入成功訊息和導向
        alert(`${role === 'student' ? '學生' : '教師'}登入成功！`);

        // 根據角色導向不同的頁面
        switch (userRole) {
            case 'student':
                window.location.href = '/student-dashboard.html';
                break;
            case 'teacher':
                window.location.href = '/teacher-dashboard.html';
                break;
            default:
                showError('身份不明，請洽管理員', formElement);
                break;
        }
    }

    // 5. 學生登入事件
    studentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser(studentForm, 'student');
    });

    // 6. 教師登入事件
    teacherForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser(teacherForm, 'teacher');
    });

    // 7. 學生註冊按鈕事件 (修正路徑)
    studentRegisterBtn.addEventListener("click", () => {
        window.location.href = 'studentRegister/student-register.html';
    });
});