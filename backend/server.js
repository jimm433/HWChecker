require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// 允許 CORS（開放 Netlify 前端存取）
app.use(cors({
    origin: "https://earnest-queijadas-6b0801.netlify.app", // 指定 Netlify 網站
    methods: "GET,POST",
    credentials: true
}));

app.use(express.json()); // 允許解析 JSON 格式的請求

// 測試 API
app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from backend!" });
});

// 模擬登入 API
app.post("/api/login", (req, res) => {
    const { userId, password } = req.body;

    // 簡單模擬帳號密碼驗證（請替換為真實的資料庫驗證）
    if (userId === "student" && password === "123456") {
        return res.json({ token: "student-token-123", role: "student" });
    } else if (userId === "teacher" && password === "654321") {
        return res.json({ token: "teacher-token-456", role: "teacher" });
    } else {
        return res.status(401).json({ message: "帳號或密碼錯誤" });
    }
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ error: "API 路徑不存在" });
});

// 啟動伺服器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ 伺服器運行中: http://localhost:${PORT}`);
});