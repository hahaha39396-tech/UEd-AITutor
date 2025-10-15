# ai_feedback.py
import google.generativeai as genai

# 🔧 Cấu hình Gemini API Key (thay bằng key thật của bạn)
genai.configure(api_key="AIzaSyC3kW_ZLpA6HUErIFyYNyTRmWbNaotH8QM")

# 💡 Hàm phản hồi AI
def ai_feedback(student_code, language="Python"):
    """
    Phân tích và phản hồi code học sinh gửi bằng Gemini
    """
    prompt = f"""
    Bạn là trợ giảng AI hỗ trợ học sinh THPT học lập trình.
    Hãy xem xét đoạn code {language} sau và đưa ra phản hồi chi tiết:
    1. Lỗi logic (nếu có)
    2. Gợi ý cải thiện / tối ưu code
    3. Giải thích cách hoạt động của code
    4. Cho điểm đánh giá (1–10) dựa trên mức độ đúng, rõ ràng, và tối ưu.
    
    Code:
    {student_code}
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        return f"Lỗi khi tạo phản hồi: {str(e)}"
