from flask import Flask, request, jsonify
import os
from openai import OpenAI
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_cors import CORS
import re
import concurrent.futures

# 載入環境變數
load_dotenv()

app = Flask(__name__)
CORS(app)  # 允許跨域請求

# 獲取環境變數
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI")

# 初始化 OpenAI 客戶端
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# 連接到 MongoDB
def connect_to_mongodb():
    try:
        client = MongoClient(MONGODB_URI)
        # 驗證連接
        client.admin.command('ping')
        print("成功連接到 MongoDB")
        return client
    except Exception as e:
        print(f"連接到 MongoDB 時發生錯誤: {e}")
        raise e

# AI 批改單個作業
@app.route('/api/ai-grading', methods=['POST', 'OPTIONS'])
def ai_grading():
    # 處理 OPTIONS 預檢請求
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # 解析請求數據
        data = request.json
        submission_id = data.get('submissionId')
        student_id = data.get('studentId')
        content = data.get('content')
        grading_options = data.get('gradingOptions', {})
        
        print(f'收到批改請求: {submission_id}, {student_id}')
        
        # 驗證必要參數
        if not all([submission_id, student_id, content]):
            return jsonify({
                'success': False,
                'message': '缺少必要參數'
            }), 400
        
        # 生成評分提示
        grading_prompt = f"""
你是一位專業的程式碼批改助教，請對以下代碼進行全面評分：

【評分標準】
1. 程式正確性 (30%): 程式是否能正確解決問題
2. 程式效率 (20%): 算法效率和時間/空間複雜度
3. 程式碼風格 (20%): 代碼可讀性、命名規範
4. 程式架構 (20%): 模組化設計和程式組織
5. 報告完整性 (10%): 註解、說明的完整性

學生代碼：
---
{content}
---

評分要求：
1. 分析每個評分標準的表現
2. 指出優點和需要改進的地方
3. 給出具體、建設性的意見
4. 最終給出總分 (0-100分)

回覆格式：
【評分標準詳細評論】
- 具體評分點
- 扣分原因 / 改進建議

【總體評語】
- 優點總結
- 關鍵改進點

總分：xx/100
"""
        
        # 調用 OpenAI API 進行批改
        response = openai_client.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=[
                {"role": "system", "content": "你是一個專業的程式碼批改助教"},
                {"role": "user", "content": grading_prompt}
            ],
            max_tokens=1000
        )
        
        grading_result = response.choices[0].message.content
        print('批改結果:', grading_result)
        
        # 解析分數和評分項目
        score_match = re.search(r'總分[：:]\s*(\d+)', grading_result)
        score = int(score_match.group(1)) if score_match else 0
        
        grading_items = []
        for item in [
            {'name': '程式正確性', 'maxScore': 30},
            {'name': '程式效率', 'maxScore': 20},
            {'name': '程式碼風格', 'maxScore': 20},
            {'name': '程式架構', 'maxScore': 20},
            {'name': '報告完整性', 'maxScore': 10}
        ]:
            regex = re.compile(f"{item['name']}[：:]\s*(-?\d+)")
            match = regex.search(grading_result)
            item_score = int(match.group(1)) if match else 0
            grading_items.append({
                'name': item['name'],
                'score': item_score,
                'maxScore': item['maxScore']
            })
        
        # 儲存結果到資料庫
        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            submissions_collection = db["submissions"]
            
            # 更新提交記錄
            submissions_collection.update_one(
                {"_id": submission_id},
                {"$set": {
                    "ai_grade": {
                        "score": score,
                        "feedback": grading_result,
                        "grading_items": grading_items
                    },
                    "ai_status": "completed"
                }},
                upsert=True
            )
        finally:
            client.close()
        
        return jsonify({
            'success': True,
            'result': {
                'submissionId': submission_id,
                'score': score,
                'gradingItems': grading_items,
                'feedback': grading_result
            }
        })
    except Exception as e:
        print(f'AI批改錯誤: {e}')
        return jsonify({
            'success': False,
            'message': f'AI批改發生錯誤: {str(e)}'
        }), 500

# 批量批改作業
@app.route('/api/batch-grading', methods=['POST', 'OPTIONS'])
def batch_grading():
    # 處理 OPTIONS 預檢請求
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # 解析請求數據
        data = request.json
        submissions = data.get('submissions', [])
        grading_options = data.get('gradingOptions', {})
        
        if not submissions:
            return jsonify({
                'success': False,
                'message': '沒有提供作業'
            }), 400
        
        print(f'批次批改 {len(submissions)} 份作業')
        
        # 批次處理作業
        results = []
        completed_count = 0
        failed_count = 0
        
        # 定義批改單個作業的函數
        def grade_submission(submission):
            try:
                submission_id = submission.get('id')
                student_id = submission.get('studentId')
                content = submission.get('content')
                
                if not all([submission_id, student_id, content]):
                    return {
                        'id': submission_id or 'unknown',
                        'error': '缺少必要參數'
                    }
                
                # 生成評分提示
                grading_prompt = f"""
你是一位專業的程式碼批改助教，請對以下代碼進行全面評分：

【評分標準】
1. 程式正確性 (30%): 程式是否能正確解決問題
2. 程式效率 (20%): 算法效率和時間/空間複雜度
3. 程式碼風格 (20%): 代碼可讀性、命名規範
4. 程式架構 (20%): 模組化設計和程式組織
5. 報告完整性 (10%): 註解、說明的完整性

學生代碼：
---
{content}
---

評分要求：
1. 分析每個評分標準的表現
2. 指出優點和需要改進的地方
3. 給出具體、建設性的意見
4. 最終給出總分 (0-100分)

回覆格式：
【評分標準詳細評論】
- 具體評分點
- 扣分原因 / 改進建議

【總體評語】
- 優點總結
- 關鍵改進點

總分：xx/100
"""
                
                # 調用 OpenAI API 進行批改
                response = openai_client.chat.completions.create(
                    model="gpt-4-1106-preview",
                    messages=[
                        {"role": "system", "content": "你是一個專業的程式碼批改助教"},
                        {"role": "user", "content": grading_prompt}
                    ],
                    max_tokens=1000
                )
                
                grading_result = response.choices[0].message.content
                
                # 解析分數和評分項目
                score_match = re.search(r'總分[：:]\s*(\d+)', grading_result)
                score = int(score_match.group(1)) if score_match else 0
                
                grading_items = []
                for item in [
                    {'name': '程式正確性', 'maxScore': 30},
                    {'name': '程式效率', 'maxScore': 20},
                    {'name': '程式碼風格', 'maxScore': 20},
                    {'name': '程式架構', 'maxScore': 20},
                    {'name': '報告完整性', 'maxScore': 10}
                ]:
                    regex = re.compile(f"{item['name']}[：:]\s*(-?\d+)")
                    match = regex.search(grading_result)
                    item_score = int(match.group(1)) if match else 0
                    grading_items.append({
                        'name': item['name'],
                        'score': item_score,
                        'maxScore': item['maxScore']
                    })
                
                # 儲存結果到資料庫
                client = connect_to_mongodb()
                try:
                    db = client["school_system"]
                    submissions_collection = db["submissions"]
                    
                    # 更新提交記錄
                    submissions_collection.update_one(
                        {"_id": submission_id},
                        {"$set": {
                            "ai_grade": {
                                "score": score,
                                "feedback": grading_result,
                                "grading_items": grading_items
                            },
                            "ai_status": "completed"
                        }},
                        upsert=True
                    )
                finally:
                    client.close()
                
                return {
                    'id': submission_id,
                    'score': score,
                    'grading': {
                        'gradingItems': grading_items,
                        'feedback': grading_result
                    }
                }
            except Exception as e:
                print(f'單個作業批改失敗 {submission.get("id")}: {e}')
                return {
                    'id': submission.get('id') or 'unknown',
                    'error': str(e)
                }
        
        # 使用線程池進行並行處理 (限制並行數量以控制 API 調用頻率)
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            future_to_submission = {executor.submit(grade_submission, submission): submission for submission in submissions}
            
            for future in concurrent.futures.as_completed(future_to_submission):
                result = future.result()
                results.append(result)
                if 'error' in result:
                    failed_count += 1
                else:
                    completed_count += 1
        
        return jsonify({
            'success': True,
            'results': results,
            'completedCount': completed_count,
            'failedCount': failed_count
        })
        
    except Exception as e:
        print(f'批次批改錯誤: {e}')
        return jsonify({
            'success': False,
            'message': f'批次批改發生錯誤: {str(e)}'
        }), 500
        
# 儲存教師評分結果
@app.route('/api/grade-assignment', methods=['POST', 'OPTIONS'])
def grade_assignment():
    # 處理 OPTIONS 預檢請求
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # 解析請求數據
        grade_data = request.json
        
        # 驗證必要欄位
        required_fields = ['submissionId', 'studentId', 'courseId', 'assignmentId', 'score']
        if not all(field in grade_data for field in required_fields):
            return jsonify({
                'success': False,
                'message': '缺少必要欄位'
            }), 400
        
        # 連接數據庫
        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            assignments_collection = db["assignments"]
            
            # 儲存批改結果
            result = assignments_collection.update_one(
                {
                    'studentId': grade_data['studentId'],
                    'courseId': grade_data['courseId'],
                    'assignmentId': grade_data['assignmentId']
                },
                {
                    '$set': {
                        'teacherScore': grade_data['score'],
                        'teacherComments': grade_data.get('comments', ''),
                        'aiScoreAccepted': grade_data.get('aiScoreAccepted', False),
                        'status': 'graded'
                    }
                },
                upsert=True
            )
            
            return jsonify({
                'success': True,
                'data': {
                    'acknowledged': result.acknowledged,
                    'modifiedCount': result.modified_count,
                    'upsertedId': str(result.upserted_id) if result.upserted_id else None
                }
            })
        finally:
            client.close()
            
    except Exception as e:
        print(f'儲存作業批改失敗: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500
        
# 獲取教師的課程
@app.route('/api/teacher/courses', methods=['GET'])
def get_teacher_courses():
    try:
        teacher_id = request.args.get('teacherId')
        if not teacher_id:
            return jsonify({
                'success': False,
                'message': '未提供教師ID'
            }), 400
            
        # 連接數據庫
        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            courses_collection = db["courses"]
            
            # 查詢教師的課程
            courses = list(courses_collection.find({"teacherId": teacher_id}))
            
            # 轉換 ObjectId 為字符串
            for course in courses:
                course['_id'] = str(course['_id'])
                
            return jsonify({
                'success': True,
                'courses': courses
            })
        finally:
            client.close()
            
    except Exception as e:
        print(f'獲取教師課程失敗: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 獲取課程的作業
@app.route('/api/teacher/courses/<course_id>/assignments', methods=['GET'])
def get_course_assignments(course_id):
    try:
        # 連接數據庫
        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            assignments_collection = db["assignments"]
            
            # 查詢課程的作業
            assignments = list(assignments_collection.find({"courseId": course_id}))
            
            # 轉換 ObjectId 為字符串
            for assignment in assignments:
                assignment['_id'] = str(assignment['_id'])
                
            return jsonify({
                'success': True,
                'assignments': assignments
            })
        finally:
            client.close()
            
    except Exception as e:
        print(f'獲取課程作業失敗: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

# 獲取作業的提交
@app.route('/api/teacher/courses/<course_id>/assignments/<assignment_id>/submissions', methods=['GET'])
def get_assignment_submissions(course_id, assignment_id):
    try:
        # 連接數據庫
        client = connect_to_mongodb()
        try:
            db = client["school_system"]
            submissions_collection = db["submissions"]
            
            # 查詢作業的提交
            submissions = list(submissions_collection.find({
                "courseId": course_id,
                "assignmentId": assignment_id
            }))
            
            # 轉換 ObjectId 為字符串
            for submission in submissions:
                submission['_id'] = str(submission['_id'])
                
            return jsonify({
                'success': True,
                'submissions': submissions
            })
        finally:
            client.close()
            
    except Exception as e:
        print(f'獲取作業提交失敗: {e}')
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, port=8000)