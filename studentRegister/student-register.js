document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('studentRegisterForm');
    const notification = document.getElementById('notification');

    // 實現返回登入頁面的功能
    document.getElementById('loginLink').addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = '../index.html';
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // 獲取表單數據
        const studentId = document.getElementById('newStudentId').value.trim();
        const studentName = document.getElementById('newStudentName').value.trim();
        const password = document.getElementById('newStudentPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 基本表單驗證
        if (!studentId || !studentName || !password) {
            showNotification('請填寫所有必填欄位', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('密碼與確認密碼不符', 'error');
            return;
        }

        if (password.length < 6) {
            showNotification('密碼長度至少需要6個字符', 'error');
            return;
        }

        // 準備要發送到API的數據
        const registerData = {
            studentId: studentId,
            name: studentName,
            password: password
        };

        // 發送註冊請求到 Netlify Functions
        // 嘗試直接使用完整路徑
        fetch('/.netlify/functions/api/register/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 註冊成功
                    showNotification('註冊成功！歡迎 ' + studentName + '！', 'success');
                    form.reset();

                    // 2秒後跳轉到登入頁面
                    setTimeout(function() {
                        window.location.href = '../index.html';
                    }, 2000);
                } else {
                    // 註冊失敗
                    showNotification(data.message || '註冊失敗，請稍後再試', 'error');
                }
            })
            .catch(error => {
                console.error('註冊錯誤:', error);
                showNotification('伺服器連接錯誤，請稍後再試', 'error');
            });
    });

    // 顯示通知函數
    function showNotification(message, type) {
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.style.display = 'block';

        // 5秒後自動隱藏通知
        setTimeout(function() {
            notification.style.display = 'none';
        }, 5000);
    }
});