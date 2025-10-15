import os
import json
import uuid
import subprocess
from datetime import datetime
from pathlib import Path
from functools import wraps
from urllib.parse import unquote as url_unquote, urljoin, urlparse
from flask import (
    Flask, render_template, request, jsonify, redirect, url_for,
    flash, session
)
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager, UserMixin, login_user,
    logout_user, login_required, current_user
)
from flask_wtf.csrf import CSRFProtect, CSRFError
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from flask import Flask

app = Flask(__name__)

@app.route('/')
def judge_index():
    return "JudgeMaster app running!"

# Không chạy app.run() ở đây, để import app thôi

# -----------------------------
# Initialize Flask app
# -----------------------------
app = Flask(__name__)

# Load biến môi trường từ file .env
load_dotenv()

# Lấy SESSION_SECRET
session_secret = os.getenv("SESSION_SECRET")
if not session_secret:
    raise RuntimeError("SESSION_SECRET environment variable must be set")

# Lấy ADMIN_PASSWORD
admin_password = os.getenv("ADMIN_PASSWORD")
if not admin_password:
    print("Warning: ADMIN_PASSWORD not set. Admin user not created.")

# -----------------------------
# Configuration
# -----------------------------
app.secret_key = session_secret
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL") or "sqlite:///judgemaster.db"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max file upload
app.config['WTF_CSRF_TIME_LIMIT'] = None  # Disable CSRF token expiration for simplicity
# Initialize extensions
db = SQLAlchemy(app)
csrf = CSRFProtect(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # type: ignore
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Session security
is_production = os.environ.get('FLASK_ENV', 'production') != 'development'
app.config['SESSION_COOKIE_SECURE'] = is_production  # True in production with HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Strict' if is_production else 'Lax'

# Create upload directory
Path(app.config["UPLOAD_FOLDER"]).mkdir(exist_ok=True)

# User loader for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Role-based access control decorators
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash('You need to login first.', 'error')
                return redirect(url_for('login'))
            
            if current_user.role not in roles:
                flash('You do not have permission to access this page.', 'error')
                return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def instructor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('You need to login first.', 'error')
            return redirect(url_for('login'))
        
        if not current_user.is_instructor():
            flash('You do not have permission to access this page.', 'error')
            return redirect(url_for('dashboard'))
        
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('You need to login first.', 'error')
            return redirect(url_for('login'))
        
        if not current_user.is_admin():
            flash('You do not have permission to access this page.', 'error')
            return redirect(url_for('dashboard'))
        
        return f(*args, **kwargs)
    return decorated_function

def is_safe_url(target):
    """
    Check if a URL is safe for redirects to prevent open redirect attacks.
    Only allows relative URLs that don't start with // and same-origin URLs.
    """
    if not target:
        return False
    
    # Parse the URL
    parsed = urlparse(target)
    
    # Reject scheme-relative URLs (starting with //)
    if target.startswith('//'):
        return False
    
    # Allow relative URLs (no scheme and no netloc)
    if not parsed.scheme and not parsed.netloc:
        return True
    
    # For absolute URLs, check if they're same-origin
    ref_url = urlparse(request.url)
    return parsed.scheme == ref_url.scheme and parsed.netloc == ref_url.netloc

# Database Models
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    display_name = db.Column(db.String(50), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')  # admin, instructor, ta, student
    avatar_url = db.Column(db.String(255), nullable=True)
    last_login = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='active')  # active, disabled
    timezone = db.Column(db.String(50), default='UTC')
    locale = db.Column(db.String(10), default='en')
    preferred_language = db.Column(db.String(20), default='python')
    learning_goals = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    enrollments = db.relationship('Enrollment', backref='user', lazy=True)
    submissions = db.relationship('Submission', backref='user', lazy=True)
    courses_taught = db.relationship('Course', backref='instructor', lazy=True, foreign_keys='Course.instructor_id')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def is_instructor(self):
        return self.role in ['instructor', 'ta', 'admin']
    
    def is_admin(self):
        return self.role == 'admin'

class Course(db.Model):
    __tablename__ = 'courses'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    syllabus_url = db.Column(db.String(255), nullable=True)
    visibility = db.Column(db.String(20), default='private')  # public, private
    tags = db.Column(db.String(255), nullable=True)
    semester = db.Column(db.String(20), nullable=True)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    assignments = db.relationship('Assignment', backref='course', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', backref='course', lazy=True)

class Assignment(db.Model):
    __tablename__ = 'assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    assignment_type = db.Column(db.String(50), default='coding')  # coding, quiz, project
    language = db.Column(db.String(20), default='python')
    difficulty_level = db.Column(db.String(20), default='beginner')  # beginner, intermediate, advanced
    time_limit = db.Column(db.Integer, default=60)  # in minutes
    max_attempts = db.Column(db.Integer, default=3)
    points_possible = db.Column(db.Integer, default=100)
    due_date = db.Column(db.DateTime, nullable=True)
    publish_date = db.Column(db.DateTime, default=datetime.utcnow)
    is_published = db.Column(db.Boolean, default=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    starter_code = db.Column(db.Text, nullable=True)
    test_cases = db.Column(db.Text, nullable=True)  # JSON string
    grading_criteria = db.Column(db.Text, nullable=True)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    submissions = db.relationship('Submission', backref='assignment', lazy=True)
    test_cases_rel = db.relationship('TestCase', backref='assignment', lazy=True, cascade='all, delete-orphan')

class TestCase(db.Model):
    __tablename__ = 'test_cases'
    
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'), nullable=False)
    input_data = db.Column(db.Text, nullable=False)
    expected_output = db.Column(db.Text, nullable=False)
    points = db.Column(db.Integer, default=1)
    is_hidden = db.Column(db.Boolean, default=False)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Submission(db.Model):
    __tablename__ = 'submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'), nullable=False)
    code = db.Column(db.Text, nullable=False)
    language = db.Column(db.String(20), default='python')
    submission_time = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')  # pending, grading, completed, error
    score = db.Column(db.Float, nullable=True)
    max_score = db.Column(db.Float, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    execution_time = db.Column(db.Float, nullable=True)  # in seconds
    memory_usage = db.Column(db.Integer, nullable=True)  # in KB
    attempt_number = db.Column(db.Integer, default=1)
    is_late = db.Column(db.Boolean, default=False)
    
    # Anti-cheat fields
    typing_patterns = db.Column(db.Text, nullable=True)  # JSON string
    code_similarity_score = db.Column(db.Float, nullable=True)
    suspicious_flags = db.Column(db.Text, nullable=True)  # JSON string
    
    # Relationships
    results = db.relationship('TestResult', backref='submission', lazy=True, cascade='all, delete-orphan')

class TestResult(db.Model):
    __tablename__ = 'test_results'
    
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey('submissions.id'), nullable=False)
    test_case_id = db.Column(db.Integer, db.ForeignKey('test_cases.id'), nullable=True)
    status = db.Column(db.String(20), nullable=False)  # passed, failed, error, timeout
    actual_output = db.Column(db.Text, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    execution_time = db.Column(db.Float, nullable=True)
    points_earned = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Enrollment(db.Model):
    __tablename__ = 'enrollments'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')  # active, dropped, completed
    
    __table_args__ = (db.UniqueConstraint('user_id', 'course_id'),)

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    context = db.Column(db.Text, nullable=True)  # JSON string for context
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='chat_history')

# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Protect against open redirect attacks
            next_page = request.args.get('next')
            if next_page and is_safe_url(next_page):
                return redirect(next_page)
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        full_name = request.form['full_name']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        role = 'student'  # Force all registrations to student role
        
        # Server-side password validation
        if password != confirm_password:
            flash('Mật khẩu xác nhận không khớp', 'error')
            return render_template('register.html')
        
        if len(password) < 6:
            flash('Mật khẩu phải có ít nhất 6 ký tự', 'error')
            return render_template('register.html')
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return render_template('register.html')
        
        # Create new user
        user = User()
        user.email = email
        user.full_name = full_name
        user.role = role
        user.display_name = full_name.split()[0] if full_name else ''
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    # Get user's courses and assignments based on role
    if current_user.role == 'student':
        enrollments = Enrollment.query.filter_by(user_id=current_user.id, status='active').all()
        courses = [enrollment.course for enrollment in enrollments]
        
        # Get recent submissions
        recent_submissions = Submission.query.filter_by(user_id=current_user.id)\
                                           .order_by(Submission.submission_time.desc())\
                                           .limit(5).all()
        
        # Get upcoming assignments
        upcoming_assignments = []
        for course in courses:
            assignments = Assignment.query.filter_by(course_id=course.id, is_published=True)\
                                        .filter(Assignment.due_date >= datetime.utcnow())\
                                        .order_by(Assignment.due_date.asc()).all()
            upcoming_assignments.extend(assignments)
        
        return render_template('dashboard.html', 
                             courses=courses,
                             recent_submissions=recent_submissions,
                             upcoming_assignments=upcoming_assignments[:10])
    
    elif current_user.is_instructor():
        courses = Course.query.filter_by(instructor_id=current_user.id).all()
        
        # Get recent submissions for instructor's courses
        recent_submissions = db.session.query(Submission)\
                                     .join(Assignment)\
                                     .filter(Assignment.course_id.in_([c.id for c in courses]))\
                                     .order_by(Submission.submission_time.desc())\
                                     .limit(10).all()
        
        return render_template('dashboard.html',
                             courses=courses,
                             recent_submissions=recent_submissions)
    
    else:  # admin
        total_users = User.query.count()
        total_courses = Course.query.count()
        total_assignments = Assignment.query.count()
        total_submissions = Submission.query.count()
        
        return render_template('dashboard.html',
                             total_users=total_users,
                             total_courses=total_courses,
                             total_assignments=total_assignments,
                             total_submissions=total_submissions)

@app.route('/assignments')
@login_required
def assignments():
    if current_user.role == 'student':
        # Get assignments from enrolled courses
        enrollments = Enrollment.query.filter_by(user_id=current_user.id, status='active').all()
        course_ids = [enrollment.course_id for enrollment in enrollments]
        assignments = Assignment.query.filter(Assignment.course_id.in_(course_ids))\
                                    .filter_by(is_published=True)\
                                    .order_by(Assignment.due_date.asc()).all()
    else:
        # Get instructor's assignments
        courses = Course.query.filter_by(instructor_id=current_user.id).all()
        course_ids = [course.id for course in courses]
        assignments = Assignment.query.filter(Assignment.course_id.in_(course_ids))\
                                    .order_by(Assignment.created_at.desc()).all()
    
    return render_template('assignments.html', assignments=assignments)

@app.route('/results')
@login_required
def results():
    if current_user.role == 'student':
        submissions = Submission.query.filter_by(user_id=current_user.id)\
                                    .order_by(Submission.submission_time.desc()).all()
    else:
        # Get all submissions for instructor's courses
        courses = Course.query.filter_by(instructor_id=current_user.id).all()
        course_ids = [course.id for course in courses]
        submissions = db.session.query(Submission)\
                               .join(Assignment)\
                               .filter(Assignment.course_id.in_(course_ids))\
                               .order_by(Submission.submission_time.desc()).all()
    
    return render_template('results.html', submissions=submissions)

@app.route('/practice')
@login_required
def practice():
    # Get practice assignments (assignments without due dates or marked as practice)
    practice_assignments = Assignment.query.filter_by(is_published=True)\
                                          .filter_by(assignment_type='practice')\
                                          .order_by(Assignment.created_at.desc()).all()
    
    return render_template('practice.html', assignments=practice_assignments)

# Add the new route for chat interface
@app.route('/chat')
@login_required
def chat():
    return render_template('chat.html')

# Add API endpoint for chat interactions
@app.route('/api/chat', methods=['POST'])
@login_required
def chat_api():
    try:
        data = request.json
        user_message = data.get('message', '')
        context = data.get('context', '')
        
        # Store chat in history
        chat = ChatHistory(
            user_id=current_user.id,
            message=user_message,
            response="AI response here",  # Replace with actual AI response
            context=context
        )
        db.session.add(chat)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'response': "AI response here"  # Replace with actual AI response
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html', user=current_user)

@app.route('/settings')
@login_required
def settings():
    return render_template('settings.html', user=current_user)

# Error handlers
@app.errorhandler(403)
def forbidden(error):
    return render_template('error.html', 
                         error_code=403, 
                         error_message='Bạn không có quyền truy cập trang này.'), 403

@app.errorhandler(404)
def not_found(error):
    return render_template('error.html', 
                         error_code=404, 
                         error_message='Trang không tồn tại.'), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('error.html', 
                         error_code=500, 
                         error_message='Lỗi hệ thống. Vui lòng thử lại sau.'), 500

@app.errorhandler(CSRFError)
def handle_csrf_error(e):
    flash('Phiên làm việc đã hết hạn. Vui lòng thử lại.', 'error')
    return redirect(url_for('login'))

# Initialize database
with app.app_context():
    db.create_all()
    
    # Create default admin user if none exists
    if not User.query.filter_by(role='admin').first():
        admin = User()
        admin.email = 'admin@judgemaster.com'
        admin.full_name = 'System Administrator'
        admin.role = 'admin'
        admin.display_name = 'Admin'
        admin_password = os.environ.get("ADMIN_PASSWORD")
        if not admin_password:
            print("Warning: ADMIN_PASSWORD not set. Admin user not created.")
        else:
            admin.set_password(admin_password)
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created: admin@judgemaster.com")

if __name__ == '__main__':
    # Only enable debug in development
    debug_mode = os.environ.get('FLASK_ENV', 'production') == 'development'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
