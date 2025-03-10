document.addEventListener('DOMContentLoaded', function() {
    // 從 localStorage 讀取用戶資訊
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole');
    
    // 檢查是否已登入
    if (!userId || !userName || userRole !== 'student') {
        // 未登入或不是學生，重定向到登入頁面
        alert('請先登入');
        window.location.href = '../index.html';
        return;
    }
    
    // 更新頁面上的學生資訊
    updateUserInfo(userName);
    
    // 選單項目點擊事件
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有項目的active類
            document.querySelectorAll('.menu-item').forEach(i => {
                i.classList.remove('active');
            });
            // 為點擊的項目添加active類
            this.classList.add('active');
        });
    });

    // 登出功能
    document.querySelector('.logout').addEventListener('click', function() {
        if (confirm('確定要登出嗎？')) {
            // 清除 localStorage 中的用戶資訊
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            
            window.location.href = '../index.html'; // 返回登入頁面，使用相對路徑
        }
    });

    // 菜單項目點擊導航 - 改為跳轉到對應頁面
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.textContent.trim();
            switch (page) {
                case '作業':
                    window.location.href = 'assignments.html';
                    break;
                case '考試':
                    window.location.href = 'exams.html';
                    break;
                case '成績':
                    window.location.href = 'grades.html';
                    break;
                case '公告':
                    window.location.href = 'announcements.html';
                    break;
            }
        });
    });
    
    // 更新用戶資訊的函數
    function updateUserInfo(name) {
        // 更新頁面標題中的學生姓名
        const headerTitle = document.querySelector('.header h1');
        if (headerTitle) {
            headerTitle.textContent = `歡迎回來，${name}`;
        }
        
        // 更新側邊欄的學生資訊
        const studentInfo = document.querySelector('.student-info');
        if (studentInfo) {
            // 假設第一個 p 元素是學生姓名
            const nameParagraph = studentInfo.querySelector('p:first-child');
            if (nameParagraph) {
                nameParagraph.textContent = name;
            }
        }
    }
});