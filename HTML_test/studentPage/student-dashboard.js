document.addEventListener('DOMContentLoaded', function() {
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
            window.location.href = '../index.html'; // 返回登入頁面，使用相對路徑
        }
    });


    // 菜單項目點擊導航
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.textContent.trim();
            switch (page) {
                case '課表':
                    // window.location.href = 'schedule.html';
                    alert('課表頁面正在建設中');
                    break;
                case '作業':
                    // window.location.href = 'assignments.html';
                    alert('作業頁面正在建設中');
                    break;
                case '成績':
                    // window.location.href = 'grades.html';
                    alert('成績頁面正在建設中');
                    break;
                case '公告':
                    // window.location.href = 'announcements.html';
                    alert('公告頁面正在建設中');
                    break;
            }
        });
    });
});