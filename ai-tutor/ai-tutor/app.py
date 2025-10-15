# app.py
from flask import Flask, request, jsonify, render_template
from .grade import grade_submission
from .ai_feedback import ai_feedback
import os
import google.generativeai as genai
import cv2
import numpy as np
import base64


# Cấu hình Gemini API 
genai.configure(api_key="AIzaSyC3kW_ZLpA6HUErIFyYNyTRmWbNaotH8QM")

# Khởi tạo model
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
]

model = genai.GenerativeModel(model_name="gemini-2.5-flash", 
                            safety_settings=safety_settings)

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

# Route Web chat
@app.route("/chat_web")
def chat_web():
    return render_template("chat.html")

# Route API chấm code
@app.route("/grade", methods=["POST"])
def grade_code():
    data = request.get_json()
    student_code = data.get("code", "")

    os.makedirs("submissions", exist_ok=True)
    temp_file = "submissions/student_temp.py"
    with open(temp_file, "w", encoding="utf-8") as f:
        f.write(student_code)

    score, total, feedback = grade_submission(temp_file)
    feedback_text = ai_feedback(student_code)

    return jsonify({
        "score": score,
        "total": total,
        "feedback": feedback,
        "ai_feedback": feedback_text
    })
@app.route("/cv_upload", methods=["POST"])
def cv_upload():
    if 'image' not in request.files:
        return jsonify({"error": "Chưa gửi ảnh"}), 400

    file = request.files['image']

    # Đọc ảnh thành numpy array
    img_array = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    # Ví dụ xử lý: chuyển sang grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Chuyển ảnh kết quả sang base64 để gửi về web
    _, buffer = cv2.imencode('.jpg', gray)
    img_bytes = buffer.tobytes()
    img_base64 = base64.b64encode(img_bytes).decode('utf-8')

    return jsonify({"result_image": img_base64})

# Route Web nhập code
@app.route("/grade_web", methods=["GET", "POST"])
def grade_web():
    result = None
    if request.method == "POST":
        student_code = request.form["code"]
        os.makedirs("submissions", exist_ok=True)
        temp_file = "submissions/student_temp.py"
        with open(temp_file, "w", encoding="utf-8") as f:
            f.write(student_code)

        score, total, feedback = grade_submission(temp_file)
        feedback_text = ai_feedback(student_code)
        result = {
            "score": score,
            "total": total,
            "feedback": feedback,
            "ai_feedback": feedback_text
        }

    return render_template("index.html", result=result)

# Route AI tutor chat trực tiếp
chat_history = []  # Lưu chat history (global, có thể nâng cấp theo user)

def build_prompt(user_question: str) -> str:
    q = user_question.lower().strip()

    # 1. Nếu chỉ chào
    greetings = ["xin chào", "chào", "hello", "hi", "chào bạn", "chào ai"]
    if q in greetings:
        return f"""
        Bạn là trợ lý AI cho học sinh THPT. 
        Hãy trả lời ngắn gọn, thân thiện bằng tiếng Việt. 
        Không giải thích lý thuyết, không phân tích code. 
        Chỉ chào lại và hỏi xem học sinh muốn học môn gì hôm nay.
        
        Học sinh: "{user_question}"
        """

    # 2. Nếu có dấu hiệu hỏi về code / lập trình
    if any(x in q for x in ["code", "python", "java", "c++", "c#", "lập trình"]):
        return f"""
        Bạn là trợ lý AI cho học sinh THPT. 
        Hãy phân tích và giải thích chi tiết đoạn code hoặc câu hỏi liên quan đến lập trình. 
        Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu. 
        Nếu có lỗi code, hãy chỉ ra lỗi và đưa code đã sửa. 
        Nếu không có code, chỉ giải thích khái niệm mà học sinh hỏi.
        
        Học sinh: "{user_question}"
        """

    # 3. Nếu là câu hỏi lý thuyết môn học
    if any(x in q for x in ["toán", "hóa", "lý", "vật lý", "sinh", "đạo hàm", "công thức", "kiến thức"]):
        return f"""
        Bạn là gia sư AI cho học sinh THPT. 
        Trả lời bằng tiếng Việt, tập trung vào kiến thức môn học. 
        Luôn theo flow: 
        1. Giải thích lý thuyết 
        2. Cho ví dụ minh họa 
        3. Đưa bài tập luyện tập (từ dễ → trung bình → khó).
        
        Học sinh: "{user_question}"
        """

    # 4. Trường hợp khác → fallback
    return f"""
    Bạn là trợ lý AI thân thiện cho học sinh THPT. 
    Trả lời bằng tiếng Việt, ngắn gọn, gợi ý học sinh chọn môn học hoặc đưa ra câu hỏi rõ ràng hơn.
    
    Học sinh: "{user_question}"
    """

@app.route("/tutor", methods=["POST"])
def tutor_chat():
    try:
        data = request.get_json()
        user_question = data.get("user", "")
        images = data.get("images", [])

        global chat_history

        # ===== Giữ tối đa 6 lượt hội thoại gần nhất =====
        context = []
        for msg in chat_history[-6:]:
            role = msg["role"]
            if role == "assistant":
                role = "model"
            elif role not in ["user", "model"]:
                role = "user"
            context.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })

        # ===== Xây phần nội dung người dùng gửi (text + ảnh) =====
        user_parts = []
        if user_question:
            user_parts.append({"text": user_question})

        for img in images:
            if isinstance(img, str) and img.startswith("data:image"):
                try:
                    header, base64_data = img.split(",", 1)
                    img_bytes = base64.b64decode(base64_data)
                    user_parts.append({
                        "mime_type": "image/png",
                        "data": img_bytes
                    })
                except Exception as e:
                    print("Lỗi xử lý ảnh:", e)

        # ===== Thêm câu hỏi người dùng vào ngữ cảnh hội thoại =====
        context.append({
            "role": "user",
            "parts": user_parts
        })

        # ===== Gọi Gemini API (hỗ trợ ảnh + context) =====
        response = model.generate_content(
            contents=context,
            safety_settings=safety_settings
        )

        ai_reply = getattr(response, "text", None) or "Xin lỗi, mình chưa hiểu ảnh hoặc câu hỏi này."

        # ===== Cập nhật lịch sử chat =====
        chat_history.append({"role": "user", "content": user_question})
        chat_history.append({"role": "model", "content": ai_reply})

        return jsonify({"reply": ai_reply})

    except Exception as e:
        print("Lỗi backend:", e)
        return jsonify({"reply": f"Lỗi xử lý: {str(e)}"}), 200
if __name__ == "__main__":
    app.run(debug=True, port=5001, use_reloader=False)
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import pyttsx3
from datetime import datetime

from PIL import Image
import io
from datetime import datetime

from datetime import datetime
import base64
import os
from flask import request, jsonify
import google.generativeai as genai

@app.route("/generate_image", methods=["POST"])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "").strip()

        if not prompt:
            return jsonify({"error": "Thiếu prompt!"}), 400

        # ✅ Model chuyên sinh ảnh
        image_model = genai.GenerativeModel("imagen-3.0")

        # Gọi sinh ảnh
        result = image_model.generate_images(prompt=prompt)

        if not result.images:
            return jsonify({"error": "Không tạo được ảnh!"}), 500

        # Lấy dữ liệu ảnh (dạng binary)
        img_data = result.images[0]._image_bytes
        os.makedirs("outputs", exist_ok=True)
        file_path = f"outputs/ai_image_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"

        with open(file_path, "wb") as f:
            f.write(img_data)

        return jsonify({
            "message": "Tạo ảnh thành công!",
            "file": file_path
        })

    except Exception as e:
        print("❌ Lỗi sinh ảnh:", e)
        return jsonify({"error": str(e)}), 500
