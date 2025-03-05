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
                case '課程管理':
                    window.location.href = 'CourseManagementPage/course-management.html';
                    break;
                case '學生成績':
                    // window.location.href = 'grades.html';
                    alert('學生成績頁面正在建設中');
                    break;
                case '作業批改':
                    window.location.href = 'TeacherAssignmentPage/assignment-grading.html';
                    break;
                case '考試管理':
                    window.location.href = 'ExamManagement/exam-management.html';
                    break;
                case '教材上傳':
                    // window.location.href = 'materials.html';
                    alert('教材上傳頁面正在建設中');
                    break;
                case '公告管理':
                    // window.location.href = 'announcements.html';
                    alert('公告管理頁面正在建設中');
                    break;
            }
        });
    });
});