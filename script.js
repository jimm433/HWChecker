document.addEventListener('DOMContentLoaded', function() {
    // 1. 取得各種元素
    const signInBtn = document.getElementById("signIn");
    const signUpBtn = document.getElementById("signUp");
    const studentForm = document.getElementById("form1");
    const teacherForm = document.getElementById("form2");
    const studentRegisterBtn = document.getElementById("studentRegisterBtn");
    const container = document.querySelector(".container");

    // 2. 表單切換顯示
    signInBtn.addEventListener("click", () => {
        container.classList.remove("right-panel-active");
    });

    signUpBtn.addEventListener("click", () => {
        container.classList.add("right-panel-active");
    });

    // 3. 顯示與清除錯誤訊息
    function showError(message, formElement) {
        clearError(formElement);
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

    // 4. 登入函式
    function loginUser(formElement, role) {
        clearError(formElement);

        const userId = formElement.querySelector('input[type="text"]').value.trim();
        const password = formElement.querySelector('input[type="password"]').value.trim();

        if (!userId || !password) {
            showError('請填寫所有欄位', formElement);
            return;
        }

        // 使用正確的 Netlify Functions 路徑
        fetch('/.netlify/functions/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    userId,
                    password,
                    role
                })
            })
            .then(response => {
                console.log('API 回應狀態:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('API 回應數據:', data);
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

    // 5. 事件監聽器
    studentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser(studentForm, 'student');
    });

    teacherForm.addEventListener('submit', function(e) {
        e.preventDefault();
        loginUser(teacherForm, 'teacher');
    });

    // 6. 學生註冊按鈕事件
    studentRegisterBtn.addEventListener("click", () => {
        window.location.href = 'studentRegister/student-register.html';
    });
});