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
            
            // 更新內容區域
            updateContentArea(this.textContent.trim());
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

    // 菜單項目點擊導航 - 改為顯示對應內容
    function updateContentArea(page) {
        // 清除現有內容
        const contentCards = document.querySelector('.content-cards');
        
        // 根據選擇的選單項目顯示不同內容
        switch (page) {
            case '作業':
                contentCards.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h3>近期作業</h3>
                        </div>
                        <div class="card-content">
                            <div class="course-item">
                                <div class="course-time">資料結構</div>
                                <div class="course-name">陣列與鏈結串列作業</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">演算法</div>
                                <div class="course-name">排序演算法實作</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>待繳作業</h3>
                        </div>
                        <div class="card-content">
                            <div class="todo-item">
                                <div class="todo-info">演算法作業</div>
                                <div class="todo-deadline">截止日期：2025/03/05</div>
                            </div>
                            <div class="todo-item">
                                <div class="todo-info">資料庫作業</div>
                                <div class="todo-deadline">截止日期：2025/03/10</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>已繳作業</h3>
                        </div>
                        <div class="card-content">
                            <div class="course-item">
                                <div class="course-time">程式設計</div>
                                <div class="course-name">基礎語法練習 - 已批改: 90分</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">計算機概論</div>
                                <div class="course-name">電腦組成報告 - 待批改</div>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case '考試':
                contentCards.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h3>即將到來的考試</h3>
                        </div>
                        <div class="card-content">
                            <div class="course-item">
                                <div class="course-time">2025/03/15</div>
                                <div class="course-name">資料結構期中考</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">2025/03/20</div>
                                <div class="course-name">演算法小考</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>考試準備資料</h3>
                        </div>
                        <div class="card-content">
                            <div class="course-item">
                                <div class="course-time">資料結構</div>
                                <div class="course-name">複習講義</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">演算法</div>
                                <div class="course-name">範例題目</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>考試成績</h3>
                        </div>
                        <div class="card-content">
                            <div class="course-item">
                                <div class="course-time">程式設計</div>
                                <div class="course-name">期中考: 85分</div>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case '成績':
                contentCards.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h3>本學期成績總覽</h3>
                        </div>
                        <div class="card-content">
                            <div class="course-item">
                                <div class="course-time">程式設計</div>
                                <div class="course-name">目前平均: 88分</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">資料結構</div>
                                <div class="course-name">目前平均: 92分</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">演算法</div>
                                <div class="course-name">目前平均: 78分</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">計算機概論</div>
                                <div class="course-name">目前平均: 90分</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">資料庫系統</div>
                                <div class="course-name">目前平均: 85分</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>歷年成績統計</h3>
                        </div>
                        <div class="card-content">
                            <div class="course-item">
                                <div class="course-time">111學年度</div>
                                <div class="course-name">學期平均: 87.5分</div>
                            </div>
                            <div class="course-item">
                                <div class="course-time">112-1學期</div>
                                <div class="course-name">學期平均: 89.2分</div>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case '公告':
                contentCards.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h3>課程公告</h3>
                        </div>
                        <div class="card-content">
                            <div class="announcement-item">
                                <div class="announcement-date">2025/02/24</div>
                                <div class="announcement-content">資料結構期中考通知: 將於3月15日舉行，範圍包含第1-8章。</div>
                            </div>
                            <div class="announcement-item">
                                <div class="announcement-date">2025/02/22</div>
                                <div class="announcement-content">演算法作業繳交延長通知: 原定於2月28日繳交的作業展延至3月5日。</div>
                            </div>
                            <div class="announcement-item">
                                <div class="announcement-date">2025/02/20</div>
                                <div class="announcement-content">資料庫系統加開輔導課: 將於2月25日晚間6-8點在資205教室舉行。</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>系所公告</h3>
                        </div>
                        <div class="card-content">
                            <div class="announcement-item">
                                <div class="announcement-date">2025/02/18</div>
                                <div class="announcement-content">畢業專題展示會時間與地點確認: 將於6月初舉行。</div>
                            </div>
                            <div class="announcement-item">
                                <div class="announcement-date">2025/02/15</div>
                                <div class="announcement-content">校外實習機會: 多家科技公司提供暑期實習，詳情請洽系辦。</div>
                            </div>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-header">
                            <h3>校園公告</h3>
                        </div>
                        <div class="card-content">
                            <div class="announcement-item">
                                <div class="announcement-date">2025/02/10</div>
                                <div class="announcement-content">校慶活動安排: 3月份校慶將舉辦多項活動，鼓勵同學參與。</div>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            default:
                // 如果沒有匹配的選單項目，顯示預設內容
                break;
        }
    }
    
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