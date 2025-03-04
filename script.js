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

    // 4. 硬編碼測試帳號 (用於前端測試)
    const testAccounts = {
        teachers: [
            { userId: "teacher", password: "teacher", role: "teacher" },
            { userId: "teacher1", password: "123456", role: "teacher" },
            { userId: "admin", password: "admin", role: "teacher" }
        ],
        students: [
            { userId: "student", password: "student", role: "student" },
            { userId: "student1", password: "123456", role: "student" },
            { userId: "test", password: "test", role: "student" }
        ]
    };

    // 5. 修改後的登入函式 (不需要後端)
    function loginUser(formElement, role) {
        clearError(formElement);

        const userId = formElement.querySelector('input[type="text"]').value.trim();
        const password = formElement.querySelector('input[type="password"]').value.trim();

        if (!userId || !password) {
            showError('請填寫所有欄位', formElement);
            return;
        }

        // 根據角色選擇相應的帳號列表
        const accountList = role === 'student' ? testAccounts.students : testAccounts.teachers;

        // 查找匹配的帳號
        const matchedAccount = accountList.find(account =>
            account.userId === userId && account.password === password
        );

        if (matchedAccount) {
            alert(`${role === 'student' ? '學生' : '教師'}登入成功！`);

            // 模擬儲存 token
            localStorage.setItem('token', 'test-token-' + matchedAccount.userId);
            localStorage.setItem('userRole', matchedAccount.role);
            localStorage.setItem('userId', matchedAccount.userId);

            // 導向相應頁面
            if (role === 'teacher') {
                window.location.href = 'teacherPage/teacher-dashboard.html';
            } else {
                window.location.href = 'studentPage/student-dashboard.html';
            }
        } else {
            showError('帳號或密碼錯誤', formElement);
        }
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