// teacher-manager.js
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB 連線字串 (與你的 API 相同)
const uri = "mongodb+srv://jimm433:S9mEMxrTBqgjHWUd@hwhelperdb.t7cf1.mongodb.net/?retryWrites=true&w=majority&appName=HWhelperDB";

// 連接到 MongoDB
async function connectToMongoDB() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    console.log('成功連接到 MongoDB');
    return client;
  } catch (error) {
    console.error('連接到 MongoDB 時發生錯誤:', error);
    throw error;
  }
}

// 操作選單
async function displayMenu() {
  console.log('\n教師管理系統');
  console.log('==============');
  console.log('1. 新增單個教師');
  console.log('2. 批量新增教師');
  console.log('3. 查詢所有教師');
  console.log('4. 修改教師資料');
  console.log('5. 刪除教師');
  console.log('0. 退出系統');
  console.log('==============');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question('請選擇功能 (0-5): ', (choice) => {
      readline.close();
      resolve(choice);
    });
  });
}

// 讀取使用者輸入
async function promptInput(prompt) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(prompt, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// 新增單個教師
async function addTeacher() {
  const teacherId = await promptInput('請輸入教師ID (例如: T001): ');
  const name = await promptInput('請輸入教師姓名: ');
  const password = await promptInput('請輸入教師密碼: ');
  const department = await promptInput('請輸入系所 (預設: 資訊工程學系): ') || '資訊工程學系';
  const title = await promptInput('請輸入職稱 (預設: 教授): ') || '教授';

  const client = await connectToMongoDB();
  
  try {
    const db = client.db("school_system");
    const teachersCollection = db.collection('teachers');

    // 檢查教師ID是否已存在
    const existingTeacher = await teachersCollection.findOne({ teacher_id: teacherId });
    if (existingTeacher) {
      console.log(`教師ID ${teacherId} 已存在!`);
      return;
    }

    // 新增教師
    const result = await teachersCollection.insertOne({
      teacher_id: teacherId,
      name,
      password,
      department,
      title
    });

    console.log(`教師 ${name} (${teacherId}) 已成功新增!`);
    console.log(`插入ID: ${result.insertedId}`);
  } catch (error) {
    console.error('新增教師時發生錯誤:', error);
  } finally {
    await client.close();
    console.log('已關閉 MongoDB 連接');
  }
}

// 批量新增教師
async function batchAddTeachers() {
  console.log('批量新增教師功能');
  console.log('請依照格式輸入教師資料');
  console.log('範例: T001,王大明,password123,資訊工程學系,教授');
  console.log('輸入 "done" 完成新增');

  const teachers = [];
  let input = '';
  
  while (true) {
    input = await promptInput(`教師 #${teachers.length + 1} (或輸入 "done" 完成): `);
    
    if (input.toLowerCase() === 'done') {
      break;
    }
    
    const parts = input.split(',');
    if (parts.length < 3) {
      console.log('格式錯誤! 請至少提供教師ID、姓名和密碼');
      continue;
    }
    
    teachers.push({
      teacher_id: parts[0].trim(),
      name: parts[1].trim(),
      password: parts[2].trim(),
      department: parts[3]?.trim() || '資訊工程學系',
      title: parts[4]?.trim() || '教授'
    });
  }
  
  if (teachers.length === 0) {
    console.log('沒有輸入任何教師資料');
    return;
  }
  
  console.log(`準備新增 ${teachers.length} 位教師...`);
  
  const client = await connectToMongoDB();
  
  try {
    const db = client.db("school_system");
    const teachersCollection = db.collection('teachers');
    
    // 檢查是否有重複的教師ID
    const teacherIds = teachers.map(t => t.teacher_id);
    const existingTeachers = await teachersCollection.find({ 
      teacher_id: { $in: teacherIds } 
    }).toArray();
    
    if (existingTeachers.length > 0) {
      const existingIds = existingTeachers.map(t => t.teacher_id);
      console.log('以下教師ID已存在:', existingIds.join(', '));
      
      // 過濾掉已存在的教師
      const newTeachers = teachers.filter(
        t => !existingIds.includes(t.teacher_id)
      );
      
      if (newTeachers.length === 0) {
        console.log('所有教師ID都已存在，無法新增');
        return;
      }
      
      const confirmed = await promptInput(`將會新增 ${newTeachers.length} 位新教師，繼續? (y/n): `);
      if (confirmed.toLowerCase() !== 'y') {
        console.log('操作已取消');
        return;
      }
      
      const result = await teachersCollection.insertMany(newTeachers);
      console.log(`成功新增 ${result.insertedCount} 位教師`);
    } else {
      const result = await teachersCollection.insertMany(teachers);
      console.log(`成功新增所有 ${result.insertedCount} 位教師`);
    }
  } catch (error) {
    console.error('批量新增教師時發生錯誤:', error);
  } finally {
    await client.close();
    console.log('已關閉 MongoDB 連接');
  }
}

// 查詢所有教師
async function queryAllTeachers() {
  const client = await connectToMongoDB();
  
  try {
    const db = client.db("school_system");
    const teachersCollection = db.collection('teachers');
    
    const teachers = await teachersCollection.find({}).toArray();
    
    if (teachers.length === 0) {
      console.log('沒有找到任何教師資料');
      return;
    }
    
    console.log(`找到 ${teachers.length} 位教師:`);
    teachers.forEach((teacher, index) => {
      console.log(`\n${index + 1}. ${teacher.name} (ID: ${teacher.teacher_id})`);
      console.log(`   系所: ${teacher.department}`);
      console.log(`   職稱: ${teacher.title}`);
      console.log(`   密碼: ${teacher.password}`);
    });
  } catch (error) {
    console.error('查詢教師時發生錯誤:', error);
  } finally {
    await client.close();
    console.log('已關閉 MongoDB 連接');
  }
}

// 修改教師資料
async function updateTeacher() {
  const teacherId = await promptInput('請輸入要修改的教師ID: ');
  
  const client = await connectToMongoDB();
  
  try {
    const db = client.db("school_system");
    const teachersCollection = db.collection('teachers');
    
    // 檢查教師ID是否存在
    const existingTeacher = await teachersCollection.findOne({ teacher_id: teacherId });
    if (!existingTeacher) {
      console.log(`找不到教師ID: ${teacherId}`);
      return;
    }
    
    console.log('找到教師資料:');
    console.log(`姓名: ${existingTeacher.name}`);
    console.log(`系所: ${existingTeacher.department}`);
    console.log(`職稱: ${existingTeacher.title}`);
    
    const updateData = {};
    
    const newName = await promptInput('請輸入新姓名 (留空表示不修改): ');
    if (newName) updateData.name = newName;
    
    const newPassword = await promptInput('請輸入新密碼 (留空表示不修改): ');
    if (newPassword) updateData.password = newPassword;
    
    const newDepartment = await promptInput('請輸入新系所 (留空表示不修改): ');
    if (newDepartment) updateData.department = newDepartment;
    
    const newTitle = await promptInput('請輸入新職稱 (留空表示不修改): ');
    if (newTitle) updateData.title = newTitle;
    
    if (Object.keys(updateData).length === 0) {
      console.log('沒有輸入任何更新資料');
      return;
    }
    
    const confirmed = await promptInput('確認修改這些資料? (y/n): ');
    if (confirmed.toLowerCase() !== 'y') {
      console.log('操作已取消');
      return;
    }
    
    const result = await teachersCollection.updateOne(
      { teacher_id: teacherId },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      console.log('沒有資料被修改');
    } else {
      console.log(`教師 ${existingTeacher.name} (${teacherId}) 資料已成功更新`);
    }
  } catch (error) {
    console.error('修改教師資料時發生錯誤:', error);
  } finally {
    await client.close();
    console.log('已關閉 MongoDB 連接');
  }
}

// 刪除教師
async function deleteTeacher() {
  const teacherId = await promptInput('請輸入要刪除的教師ID: ');
  
  const client = await connectToMongoDB();
  
  try {
    const db = client.db("school_system");
    const teachersCollection = db.collection('teachers');
    
    // 檢查教師ID是否存在
    const existingTeacher = await teachersCollection.findOne({ teacher_id: teacherId });
    if (!existingTeacher) {
      console.log(`找不到教師ID: ${teacherId}`);
      return;
    }
    
    console.log('找到教師資料:');
    console.log(`姓名: ${existingTeacher.name}`);
    console.log(`系所: ${existingTeacher.department}`);
    console.log(`職稱: ${existingTeacher.title}`);
    
    const confirmed = await promptInput(`確定要刪除教師 ${existingTeacher.name} (${teacherId})? 此操作無法復原! (y/n): `);
    if (confirmed.toLowerCase() !== 'y') {
      console.log('操作已取消');
      return;
    }
    
    const result = await teachersCollection.deleteOne({ teacher_id: teacherId });
    
    if (result.deletedCount === 0) {
      console.log('刪除操作失敗');
    } else {
      console.log(`教師 ${existingTeacher.name} (${teacherId}) 已成功刪除`);
    }
  } catch (error) {
    console.error('刪除教師時發生錯誤:', error);
  } finally {
    await client.close();
    console.log('已關閉 MongoDB 連接');
  }
}

// 新增默認教師清單的功能
async function addDefaultTeachers() {
  const defaultTeachers = [
    {
      teacher_id: "T001",
      name: "王廷叡",
      password: "password123",
      department: "資訊工程學系",
      title: "教授"
    },
    {
      teacher_id: "T002",
      name: "李美華",
      password: "secure456",
      department: "資訊工程學系",
      title: "副教授"
    },
    {
      teacher_id: "T003",
      name: "張建國",
      password: "teacher789",
      department: "資訊工程學系",
      title: "助理教授"
    },
    {
      teacher_id: "T004",
      name: "陳文芳",
      password: "faculty2024",
      department: "資訊工程學系",
      title: "講師"
    },
    {
      teacher_id: "T005",
      name: "林志明",
      password: "profpass",
      department: "資訊工程學系",
      title: "教授"
    }
  ];

  const client = await connectToMongoDB();
  
  try {
    const db = client.db("school_system");
    const teachersCollection = db.collection('teachers');
    
    // 檢查是否有重複的教師ID
    const teacherIds = defaultTeachers.map(t => t.teacher_id);
    const existingTeachers = await teachersCollection.find({ 
      teacher_id: { $in: teacherIds } 
    }).toArray();
    
    if (existingTeachers.length > 0) {
      const existingIds = existingTeachers.map(t => t.teacher_id);
      console.log('以下教師ID已存在:', existingIds.join(', '));
      
      // 過濾掉已存在的教師
      const newTeachers = defaultTeachers.filter(
        t => !existingIds.includes(t.teacher_id)
      );
      
      if (newTeachers.length === 0) {
        console.log('所有默認教師ID都已存在，無法新增');
        return;
      }
      
      const result = await teachersCollection.insertMany(newTeachers);
      console.log(`成功新增 ${result.insertedCount} 位默認教師`);
    } else {
      const result = await teachersCollection.insertMany(defaultTeachers);
      console.log(`成功新增所有 ${result.insertedCount} 位默認教師`);
    }
  } catch (error) {
    console.error('新增默認教師時發生錯誤:', error);
  } finally {
    await client.close();
    console.log('已關閉 MongoDB 連接');
  }
}

// 主函數
async function main() {
  let running = true;
  
  // 檢查教師集合是否存在，若不存在則創建
  const client = await connectToMongoDB();
  try {
    const db = client.db("school_system");
    const collections = await db.listCollections({ name: 'teachers' }).toArray();
    
    if (collections.length === 0) {
      console.log('教師集合不存在，正在創建...');
      await db.createCollection('teachers');
      console.log('教師集合已創建');
      
      // 可選：創建索引
      await db.collection('teachers').createIndex({ "teacher_id": 1 }, { unique: true });
      console.log('已為教師ID創建唯一索引');
      
      // 詢問是否添加默認教師
      const addDefault = await promptInput('是否添加默認教師資料? (y/n): ');
      if (addDefault.toLowerCase() === 'y') {
        await addDefaultTeachers();
      }
    }
  } catch (error) {
    console.error('檢查教師集合時發生錯誤:', error);
  } finally {
    await client.close();
  }
  
  while (running) {
    const choice = await displayMenu();
    
    switch (choice) {
      case '1':
        await addTeacher();
        break;
      case '2':
        await batchAddTeachers();
        break;
      case '3':
        await queryAllTeachers();
        break;
      case '4':
        await updateTeacher();
        break;
      case '5':
        await deleteTeacher();
        break;
      case '0':
        console.log('正在退出系統...');
        running = false;
        break;
      default:
        console.log('無效的選擇，請重新輸入');
    }
    
    if (running) {
      await promptInput('\n按 Enter 繼續...');
    }
  }
}

// 啟動程式
main().catch(console.error);