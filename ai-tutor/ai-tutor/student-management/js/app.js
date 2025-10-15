// Khởi tạo ứng dụng chính
class StudentManagementApp {
    constructor() {
        this.currentUser = null;
        this.currentView = 'login';
        this.dataManager = new DataManager();
        this.auth = new Auth();
        
        // Remove init() call from constructor
        // Let DOMContentLoaded handle initialization
    }

    async init() {
        try {
            // Show appropriate view first
            const savedUser = this.auth.getCurrentUser();
            if (savedUser) {
                this.currentUser = savedUser;
                this.showDashboard();
            } else {
                this.showLogin();
            }

            // Setup event listeners after DOM is ready
            this.setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification('Error initializing application', 'error');
        }
    }

    setupEventListeners() {
        // Handle login form if it exists
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Handle logout button if it exists
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Handle navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-item')) {
                const view = e.target.dataset.view;
                this.switchView(view);
            }
        });
        
        // Handle sidebar toggle if elements exist
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebarToggle && sidebar && mainContent) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mainContent.classList.toggle('sidebar-active');
                
                // Store sidebar state in localStorage
                localStorage.setItem('sidebarOpen', sidebar.classList.contains('active'));
            });
            
            // Restore sidebar state on page load
            const sidebarOpen = localStorage.getItem('sidebarOpen') === 'true';
            if (sidebarOpen) {
                sidebar.classList.add('active');
                mainContent.classList.add('sidebar-active');
            }
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const user = await this.auth.login(username, password);
            if (user) {
                this.currentUser = user;
                this.showDashboard();
                this.showNotification('Đăng nhập thành công!', 'success');
            } else {
                this.showNotification('Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Có lỗi xảy ra khi đăng nhập!', 'error');
        }
    }

    handleLogout() {
        this.auth.logout();
        this.currentUser = null;
        this.showLogin();
        this.showNotification('Đã đăng xuất thành công!', 'success');
    }

    showLogin() {
        this.currentView = 'login';
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="login-container">
                <div class="login-form">
                    <h2>Đăng nhập hệ thống</h2>
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="username">Tên đăng nhập:</label>
                            <input type="text" id="username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Mật khẩu:</label>
                            <input type="password" id="password" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Đăng nhập</button>
                    </form>
                </div>
            </div>
        `;
        this.setupEventListeners();
    }

    showDashboard() {
        const appDiv = document.getElementById('app');
        appDiv.innerHTML = `
            <div class="app-container">
                <header class="header">
                    <button id="sidebarToggle" class="sidebar-toggle">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                    <h1>Hệ thống quản lý điểm THPT</h1>
                    <div class="user-info">
                        <span>Xin chào, ${this.currentUser.fullName}</span>
                        <button id="logoutBtn" class="btn btn-danger">Đăng xuất</button>
                    </div>
                </header>
                
                <nav class="sidebar">
                    <ul>
                        <li><a href="#" data-view="dashboard" class="active">Dashboard</a></li>
                        <li><a href="#" data-view="users">Quản lý người dùng</a></li>
                        <li><a href="#" data-view="students">Quản lý học sinh</a></li>
                        <li><a href="#" data-view="classes">Quản lý lớp học</a></li>
                        <li><a href="#" data-view="subjects">Quản lý môn học</a></li>
                        <li><a href="#" data-view="scores">Quản lý điểm số</a></li>
                        <li><a href="#" data-view="reports">Báo cáo tổng hợp</a></li>
                    </ul>
                </nav>

                <main class="main-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Tổng số giáo viên</h3>
                            <div class="stat-number">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>Tổng số lớp</h3>
                            <div class="stat-number">4</div>
                        </div>
                        <div class="stat-card">
                            <h3>Tổng số môn học</h3>
                            <div class="stat-number">8</div>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-primary" data-action="add-student">Thêm học sinh</button>
                        <button class="btn btn-primary" data-action="create-class">Tạo lớp học</button>
                        <button class="btn btn-primary" data-action="export-data">Xuất dữ liệu</button>
                    </div>
                </main>
            </div>
        `;

        // Gắn lại event listeners sau khi cập nhật DOM
        this.setupDashboardListeners();
    }

    setupDashboardListeners() {
        // Xử lý logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Xử lý sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebarToggle && sidebar && mainContent) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                mainContent.classList.toggle('sidebar-active');
            });
        }

        // Xử lý navigation
        document.querySelectorAll('.sidebar a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                
                // Remove active class from all links
                document.querySelectorAll('.sidebar a').forEach(a => 
                    a.classList.remove('active'));
                
                // Add active class to clicked link
                e.target.classList.add('active');
                
                this.switchView(view);
            });
        });

        // Xử lý action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                switch (action) {
                    case 'add-student':
                        this.showAddStudentForm();
                        break;
                    case 'create-class':
                        this.switchView('classes');
                        break;
                    case 'export-data':
                        this.exportAllData();
                        break;
                }
            });
        });
    }

    generateNavigation() {
        const { role } = this.currentUser;
        let nav = '<ul class="nav-menu">';
        
        nav += '<li><a href="#" class="nav-item" data-view="dashboard">Dashboard</a></li>';
        
        if (role === 'admin') {
            nav += `
                <li><a href="#" class="nav-item" data-view="users">Quản lý người dùng</a></li>
                <li><a href="#" class="nav-item" data-view="students">Quản lý học sinh</a></li>
                <li><a href="#" class="nav-item" data-view="classes">Quản lý lớp học</a></li>
                <li><a href="#" class="nav-item" data-view="subjects">Quản lý môn học</a></li>
                <li><a href="#" class="nav-item" data-view="scores">Quản lý điểm số</a></li>
                <li><a href="#" class="nav-item" data-view="reports">Báo cáo tổng hợp</a></li>
            `;
        } else if (role === 'subject_teacher') {
            nav += `
                <li><a href="#" class="nav-item" data-view="my-classes">Lớp của tôi</a></li>
                <li><a href="#" class="nav-item" data-view="my-students">Học sinh của tôi</a></li>
                <li><a href="#" class="nav-item" data-view="score-input">Nhập điểm</a></li>
                <li><a href="#" class="nav-item" data-view="my-reports">Báo cáo môn học</a></li>
            `;
        } else if (role === 'homeroom_teacher') {
            nav += `
                <li><a href="#" class="nav-item" data-view="my-class">Lớp chủ nhiệm</a></li>
                <li><a href="#" class="nav-item" data-view="class-scores">Điểm lớp</a></li>
                <li><a href="#" class="nav-item" data-view="student-management">Quản lý học sinh</a></li>
                <li><a href="#" class="nav-item" data-view="class-reports">Báo cáo lớp</a></li>
            `;
        }
        
        nav += '</ul>';
        return nav;
    }

    generateDashboardContent() {
        const { role } = this.currentUser;
        
        if (role === 'admin') {
            return this.generateAdminDashboard();
        } else if (role === 'subject_teacher') {
            return this.generateSubjectTeacherDashboard();
        } else if (role === 'homeroom_teacher') {
            return this.generateHomeroomTeacherDashboard();
        }
    }

    generateAdminDashboard() {
        return `
            <div class="dashboard">
                <h2>Dashboard Quản trị viên</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Tổng số học sinh</h3>
                        <div class="stat-number" id="totalStudents">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Tổng số giáo viên</h3>
                        <div class="stat-number" id="totalTeachers">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Tổng số lớp</h3>
                        <div class="stat-number" id="totalClasses">0</div>
                    </div>
                    <div class="stat-card">
                        <h3>Tổng số môn học</h3>
                        <div class="stat-number" id="totalSubjects">0</div>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h3>Thao tác nhanh</h3>
                    <button class="btn btn-primary" onclick="app.switchView('users')">Thêm người dùng</button>
                    <button class="btn btn-primary" onclick="app.switchView('students')">Thêm học sinh</button>
                    <button class="btn btn-primary" onclick="app.switchView('classes')">Tạo lớp học</button>
                    <button class="btn btn-primary" onclick="app.exportAllData()">Xuất dữ liệu</button>
                </div>
            </div>
        `;
    }

    generateSubjectTeacherDashboard() {
        return `
            <div class="dashboard">
                <h2>Dashboard Giáo viên bộ môn</h2>
                <div class="teacher-info">
                    <h3>Thông tin giảng dạy</h3>
                    <div id="teachingInfo">Đang tải...</div>
                </div>
                
                <div class="quick-actions">
                    <h3>Thao tác nhanh</h3>
                    <button class="btn btn-primary" onclick="app.switchView('score-input')">Nhập điểm</button>
                    <button class="btn btn-primary" onclick="app.switchView('my-students')">Xem học sinh</button>
                    <button class="btn btn-secondary" onclick="app.exportMyClassData()">Xuất điểm lớp</button>
                </div>
            </div>
        `;
    }

    generateHomeroomTeacherDashboard() {
        return `
            <div class="dashboard">
                <h2>Dashboard Giáo viên chủ nhiệm</h2>
                <div class="class-overview">
                    <h3>Tổng quan lớp học</h3>
                    <div id="classOverview">Đang tải...</div>
                </div>
                
                <div class="quick-actions">
                    <h3>Thao tác nhanh</h3>
                    <button class="btn btn-primary" onclick="app.switchView('student-management')">Quản lý học sinh</button>
                    <button class="btn btn-primary" onclick="app.switchView('class-scores')">Xem điểm lớp</button>
                    <button class="btn btn-secondary" onclick="app.exportClassReport()">Xuất báo cáo</button>
                </div>
            </div>
        `;
    }

    async switchView(viewName) {
        try {
            const mainContent = document.querySelector('.main-content');
            if (!mainContent) {
                throw new Error('Main content container not found');
            }

            // Update navigation active state
            document.querySelectorAll('.sidebar a').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.view === viewName) {
                    link.classList.add('active');
                }
            });

            // Generate view content based on view name
            let content = '';
            switch (viewName) {
                case 'dashboard':
                    content = await this.generateDashboardContent();
                    break;
                case 'users':
                    content = await this.generateUsersView();
                    break;
                case 'students':
                    content = await this.generateStudentsView();
                    break;
                case 'classes':
                    content = await this.generateClassesView();
                    break;
                case 'subjects':
                    content = await this.generateSubjectsView();
                    break;
                case 'scores':
                    content = await this.generateScoresView();
                    break;
                case 'reports':
                    content = await this.generateReportsView();
                    break;
                default:
                    content = '<div class="error-message">View not found</div>';
            }

            // Update main content
            mainContent.innerHTML = content;

            // Setup event listeners for the new view
            switch (viewName) {
                case 'dashboard':
                    this.setupDashboardListeners();
                    break;
                case 'users':
                    this.setupUsersListeners();
                    break;
                case 'students':
                    this.setupStudentsListeners();
                    break;
                case 'classes':  // Add this case
                    this.setupClassesListeners();
                    break;
                case 'subjects':
                    this.setupSubjectsListeners();
                    break;
                case 'reports':
                    this.setupReportsListeners();
                    break;
                // ... other cases
            }

        } catch (error) {
            console.error('Error switching view:', error);
            // Show error notification to user
            const notification = document.createElement('div');
            notification.className = 'notification error';
            notification.textContent = 'Error loading view. Please try again.';
            document.body.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => notification.remove(), 3000);
        }
    }

    async loadDashboardData() {
        if (this.currentUser.role === 'admin') {
            try {
                const students = await this.dataManager.getStudents();
                const users = await this.dataManager.getUsers();
                const classes = await this.dataManager.getClasses();
                const subjects = await this.dataManager.getSubjects();
                
                document.getElementById('totalStudents').textContent = students.length;
                document.getElementById('totalTeachers').textContent = 
                    users.filter(u => u.role !== 'admin').length;
                document.getElementById('totalClasses').textContent = classes.length;
                document.getElementById('totalSubjects').textContent = subjects.length;
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }
    }

    async generateUsersView() {
        const users = await this.dataManager.getUsers();
        
        return `
            <div class="users-management">
                <div class="page-header">
                    <h2>Quản lý người dùng</h2>
                    <button class="btn btn-primary" onclick="app.showAddUserForm()">Thêm người dùng</button>
                </div>
                
                <div class="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Tên đăng nhập</th>
                                <th>Họ tên</th>
                                <th>Vai trò</th>
                                <th>Ngày tạo</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.id}</td>
                                    <td>${user.username}</td>
                                    <td>${user.fullName}</td>
                                    <td>${this.getRoleDisplay(user.role)}</td>
                                    <td>${new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                        <button class="btn btn-small" onclick="app.editUser('${user.id}')">Sửa</button>
                                        ${user.username !== 'admin' ? 
                                            `<button class="btn btn-small btn-danger" onclick="app.deleteUser('${user.id}')">Xóa</button>` 
                                            : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async generateStudentsView() {
        const students = await this.dataManager.getStudents();
        const classes = await this.dataManager.getClasses();
        
        return `
            <div class="students-management">
                <div class="page-header">
                    <h2>Quản lý học sinh</h2>
                    <button class="btn btn-primary" onclick="app.showAddStudentForm()">Thêm học sinh</button>
                </div>
                
                <div class="filter-section">
                    <select id="classFilter" onchange="app.filterStudentsByClass()">
                        <option value="">Tất cả các lớp</option>
                        ${classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('')}
                    </select>
                </div>
                
                <div class="students-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Mã học sinh</th>
                                <th>Họ tên</th>
                                <th>Lớp</th>
                                <th>Ngày sinh</th>
                                <th>Giới tính</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="studentsTableBody">
                            ${students.map(student => {
                                const studentClass = classes.find(c => c.id === student.classId);
                                return `
                                    <tr>
                                        <td>${student.studentCode}</td>
                                        <td>${student.fullName}</td>
                                        <td>${studentClass ? studentClass.name : 'Chưa phân lớp'}</td>
                                        <td>${new Date(student.dateOfBirth).toLocaleDateString('vi-VN')}</td>
                                        <td>${student.gender === 'male' ? 'Nam' : 'Nữ'}</td>
                                        <td>
                                            <button class="btn btn-small" onclick="app.editStudent('${student.id}')">Sửa</button>
                                            <button class="btn btn-small btn-danger" onclick="app.deleteStudent('${student.id}')">Xóa</button>
                                            <button class="btn btn-small" onclick="app.viewStudentScores('${student.id}')">Xem điểm</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async generateScoreInputView() {
        const classes = await this.dataManager.getClassesByTeacher(this.currentUser.id);
        const subjects = await this.dataManager.getSubjects();
        
        return `
            <div class="score-input">
                <div class="page-header">
                    <h2>Nhập điểm</h2>
                </div>
                
                <div class="score-input-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="scoreClass">Lớp:</label>
                            <select id="scoreClass" onchange="app.loadStudentsForScoring()">
                                <option value="">Chọn lớp</option>
                                ${classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="scoreSubject">Môn học:</label>
                            <select id="scoreSubject">
                                <option value="">Chọn môn</option>
                                ${subjects.map(subject => `<option value="${subject.id}">${subject.name}</option>`).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="scoreType">Loại điểm:</label>
                            <select id="scoreType">
                                <option value="oral">Điểm miệng</option>
                                <option value="test15">Điểm 15 phút</option>
                                <option value="test45">Điểm 1 tiết</option>
                                <option value="midterm">Điểm giữa kì</option>
                                <option value="final">Điểm cuối kì</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="studentsScoreList" class="students-score-list">
                        <!-- Danh sách học sinh sẽ được load ở đây -->
                    </div>
                    
                    <button class="btn btn-primary" onclick="app.saveScores()">Lưu điểm</button>
                </div>
            </div>
        `;
    }

    async generateClassesView() {
        const classes = await this.dataManager.getClasses();
        const teachers = await this.dataManager.getUsers();
        
        return `
            <div class="classes-management">
                <div class="page-header">
                    <h2>Quản lý lớp học</h2>
                    <button class="btn btn-primary" onclick="app.showAddClassForm()">Tạo lớp mới</button>
                </div>

                <div class="classes-grid">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Tên lớp</th>
                                <th>Khối</th>
                                <th>Sĩ số</th>
                                <th>GVCN</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${classes.map(cls => {
                                const homeroomTeacher = teachers.find(t => t.id === cls.homeRoomTeacher);
                                return `
                                    <tr>
                                        <td>${cls.name}</td>
                                        <td>${cls.grade}</td>
                                        <td>${cls.studentCount || 0}</td>
                                        <td>${homeroomTeacher ? homeroomTeacher.fullName : 'Chưa phân công'}</td>
                                        <td>
                                            <button class="btn btn-small" onclick="app.editClass('${cls.id}')">
                                                Sửa
                                            </button>
                                            <button class="btn btn-small" onclick="app.viewClassDetails('${cls.id}')">
                                                Chi tiết
                                            </button>
                                            <button class="btn btn-small btn-danger" onclick="app.deleteClass('${cls.id}')">
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async generateSubjectsView() {
        const subjects = await this.dataManager.getSubjects() || [];
        const teachers = await this.dataManager.getUsers() || [];
        
        return `
            <div class="subjects-management">
                <div class="page-header">
                    <h2>Quản lý môn học</h2>
                    <button class="btn btn-primary" onclick="app.showAddSubjectForm()">Thêm môn học</button>
                </div>

                <div class="subjects-grid">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mã môn</th>
                                <th>Tên môn học</th>
                                <th>Khối lớp</th>
                                <th>Số tiết/tuần</th>
                                <th>Giáo viên bộ môn</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjects.map(subject => {
                                const subjectTeachers = teachers.filter(t => 
                                    t.role === 'subject_teacher' && 
                                    t.subjects && 
                                    t.subjects.includes(subject.id)
                                );
                                return `
                                    <tr>
                                        <td>${subject.code || ''}</td>
                                        <td>${subject.name || ''}</td>
                                        <td>${(subject.grades || []).join(', ') || 'Chưa cập nhật'}</td>
                                        <td>${subject.lessonsPerWeek || 0}</td>
                                        <td>
                                            ${subjectTeachers.map(t => t.fullName).join(', ') || 'Chưa phân công'}
                                        </td>
                                        <td>
                                            <button class="btn btn-small" onclick="app.editSubject('${subject.id}')">
                                                Sửa
                                            </button>
                                            <button class="btn btn-small btn-danger" onclick="app.deleteSubject('${subject.id}')">
                                                Xóa
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async generateScoresView() {
        const classes = await this.dataManager.getClasses();
        const subjects = await this.dataManager.getSubjects();
        
        return `
            <div class="scores-management">
                <div class="page-header">
                    <h2>Quản lý điểm số</h2>
                </div>

                <div class="score-filters">
                    <div class="form-group">
                        <label for="classSelect">Lớp:</label>
                        <select id="classSelect" onchange="app.loadClassScores()">
                            <option value="">Chọn lớp</option>
                            ${classes.map(cls => 
                                `<option value="${cls.id}">${cls.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="subjectSelect">Môn học:</label>
                        <select id="subjectSelect" onchange="app.loadClassScores()">
                            <option value="">Chọn môn học</option>
                            ${subjects.map(subject => 
                                `<option value="${subject.id}">${subject.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="scores-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mã HS</th>
                                <th>Họ và tên</th>
                                <th>Điểm miệng</th>
                                <th>Điểm 15p</th>
                                <th>Điểm 1 tiết</th>
                                <th>Điểm giữa kỳ</th>
                                <th>Điểm cuối kỳ</th>
                                <th>Điểm TB</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="scoresTableBody">
                            <tr>
                                <td colspan="9" class="text-center">Vui lòng chọn lớp và môn học</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="app.showInputScoresForm()">
                        Nhập điểm
                    </button>
                    <button class="btn btn-secondary" onclick="app.exportScores()">
                        Xuất điểm
                    </button>
                </div>
            </div>
        `;
    }

    async generateReportsView() {
        const classes = await this.dataManager.getClasses();
        
        return `
            <div class="reports-management">
                <div class="page-header">
                    <h2>Báo cáo tổng hợp</h2>
                </div>

                <div class="reports-grid">
                    <div class="report-card">
                        <h3>Báo cáo theo lớp</h3>
                        <div class="form-group">
                            <label for="classReport">Chọn lớp:</label>
                            <select id="classReport" onchange="app.loadClassReport()">
                                <option value="">Chọn lớp</option>
                                ${classes.map(cls => 
                                    `<option value="${cls.id}">${cls.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.generateClassReport()">
                            Xuất báo cáo
                        </button>
                    </div>

                    <div class="report-card">
                        <h3>Báo cáo theo môn học</h3>
                        <div class="form-group">
                            <label for="subjectReport">Chọn môn học:</label>
                            <select id="subjectReport">
                                <option value="">Chọn môn học</option>
                                ${(await this.dataManager.getSubjects()).map(subject => 
                                    `<option value="${subject.id}">${subject.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.generateSubjectReport()">
                            Xuất báo cáo
                        </button>
                    </div>

                    <div class="report-card">
                        <h3>Báo cáo tổng kết học kỳ</h3>
                        <div class="form-group">
                            <label for="semesterReport">Học kỳ:</label>
                            <select id="semesterReport">
                                <option value="1">Học kỳ 1</option>
                                <option value="2">Học kỳ 2</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="app.generateSemesterReport()">
                            Xuất báo cáo
                        </button>
                    </div>
                </div>

                <div id="reportPreview" class="report-preview">
                    <!-- Report preview will be shown here -->
                </div>
            </div>
        `;
    }

    // Add these helper methods for reports
    async loadClassReport() {
        const classId = document.getElementById('classReport').value;
        if (!classId) return;

        try {
            const reportPreview = document.getElementById('reportPreview');
            reportPreview.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';

            // Implementation will be added later
            console.log('Loading class report for:', classId);
        } catch (error) {
            console.error('Error loading class report:', error);
            this.showNotification('Lỗi khi tải báo cáo', 'error');
        }
    }

    async generateClassReport() {
        // Implementation will be added later
        console.log('Generating class report');
    }

    async generateSubjectReport() {
        // Implementation will be added later
        console.log('Generating subject report');
    }

    async generateSemesterReport() {
        // Implementation will be added later
        console.log('Generating semester report');
    }

    // Add reports event listeners
    setupReportsListeners() {
        // Class report selection
        const classReport = document.getElementById('classReport');
        if (classReport) {
            classReport.addEventListener('change', () => {
                this.loadClassReport();
            });
        }

        // Report generation buttons
        document.querySelectorAll('.report-card button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.textContent.trim();
                switch (action) {
                    case 'Xuất báo cáo lớp':
                        this.generateClassReport();
                        break;
                    case 'Xuất báo cáo môn':
                        this.generateSubjectReport();
                        break;
                    case 'Xuất báo cáo học kỳ':
                        this.generateSemesterReport();
                        break;
                }
            });
        });
    }

    getRoleDisplay(role) {
        const roles = {
            'admin': 'Quản trị viên',
            'subject_teacher': 'Giáo viên bộ môn',
            'homeroom_teacher': 'Giáo viên chủ nhiệm'
        };
        return roles[role] || role;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Các methods khác sẽ được implement trong các phần tiếp theo
    showAddUserForm() {
        // Implementation for adding users
    }

    showAddStudentForm() {
        // Implementation for adding students
    }

    async exportAllData() {
        // Implementation for exporting all data
    }

    async exportMyClassData() {
        // Implementation for exporting class data
    }

    async exportClassReport() {
        // Implementation for exporting class reports
    }

    setupUsersListeners() {
        // Add user form
        const addUserBtn = document.querySelector('[onclick="app.showAddUserForm()"]');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAddUserForm();
            });
        }

        // Edit and delete buttons
        document.querySelectorAll('.users-table button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (button.textContent === 'Sửa') {
                    const userId = button.getAttribute('onclick').match(/'(.*?)'/)[1];
                    this.editUser(userId);
                } else if (button.textContent === 'Xóa') {
                    const userId = button.getAttribute('onclick').match(/'(.*?)'/)[1];
                    this.deleteUser(userId);
                }
            });
        });
    }

    setupStudentsListeners() {
        // Add student form
        const addStudentBtn = document.querySelector('[onclick="app.showAddStudentForm()"]');
        if (addStudentBtn) {
            addStudentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAddStudentForm();
            });
        }

        // Class filter
        const classFilter = document.getElementById('classFilter');
        if (classFilter) {
            classFilter.addEventListener('change', () => {
                this.filterStudentsByClass(classFilter.value);
            });
        }

        // Student table actions
        document.querySelectorAll('.students-table button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.textContent;
                const studentId = button.getAttribute('onclick').match(/'(.*?)'/)[1];
                
                switch (action) {
                    case 'Sửa':
                        this.editStudent(studentId);
                        break;
                    case 'Xóa':
                        this.deleteStudent(studentId);
                        break;
                    case 'Xem điểm':
                        this.viewStudentScores(studentId);
                        break;
                }
            });
        });
    }

    setupScoresListeners() {
        // Class and subject selection
        const scoreClass = document.getElementById('scoreClass');
        const scoreSubject = document.getElementById('scoreSubject');
        
        if (scoreClass) {
            scoreClass.addEventListener('change', () => {
                this.loadStudentsForScoring(scoreClass.value);
            });
        }

        // Save scores button
        const saveScoresBtn = document.querySelector('[onclick="app.saveScores()"]');
        if (saveScoresBtn) {
            saveScoresBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveScores();
            });
        }
    }

    // Add these placeholder methods that will be implemented later
    editUser(userId) {
        console.log('Editing user:', userId);
        // Implementation will be added later
    }

    deleteUser(userId) {
        console.log('Deleting user:', userId);
        // Implementation will be added later
    }

    editStudent(studentId) {
        console.log('Editing student:', studentId);
        // Implementation will be added later
    }

    deleteStudent(studentId) {
        console.log('Deleting student:', studentId);
        // Implementation will be added later
    }

    viewStudentScores(studentId) {
        console.log('Viewing scores for student:', studentId);
        // Implementation will be added later
    }

    filterStudentsByClass(classId) {
        console.log('Filtering students by class:', classId);
        // Implementation will be added later
    }

    loadStudentsForScoring(classId) {
        console.log('Loading students for scoring:', classId);
        // Implementation will be added later
    }

    saveScores() {
        console.log('Saving scores');
        // Implementation will be added later
    }

    showAddClassForm() {
        console.log('Showing add class form');
        // Implementation will be added later
    }

    editClass(classId) {
        console.log('Editing class:', classId);
        // Implementation will be added later
    }

    viewClassDetails(classId) {
        console.log('Viewing class details:', classId);
        // Implementation will be added later
    }

    deleteClass(classId) {
        console.log('Deleting class:', classId);
        // Implementation will be added later
    }

    setupClassesListeners() {
        // Add class form
        const addClassBtn = document.querySelector('[onclick="app.showAddClassForm()"]');
        if (addClassBtn) {
            addClassBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAddClassForm();
            });
        }

        // Class actions
        document.querySelectorAll('.classes-grid button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.textContent.trim();
                const classId = button.getAttribute('onclick').match(/'(.*?)'/)[1];
                
                switch (action) {
                    case 'Sửa':
                        this.editClass(classId);
                        break;
                    case 'Chi tiết':
                        this.viewClassDetails(classId);
                        break;
                    case 'Xóa':
                        this.deleteClass(classId);
                        break;
                }
            });
        });
    }

    setupSubjectsListeners() {
        // Add subject form button
        const addSubjectBtn = document.querySelector('[onclick="app.showAddSubjectForm()"]');
        if (addSubjectBtn) {
            addSubjectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAddSubjectForm();
            });
        }

        // Subject table actions
        document.querySelectorAll('.subjects-grid button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.textContent.trim();
                const subjectId = button.getAttribute('onclick').match(/'(.*?)'/)[1];
                
                switch (action) {
                    case 'Sửa':
                        this.editSubject(subjectId);
                        break;
                    case 'Xóa':
                        this.deleteSubject(subjectId);
                        break;
                }
            });
        });
    }

    // Add these placeholder methods for subject actions
    showAddSubjectForm() {
        console.log('Showing add subject form');
        // Implementation will be added later
    }

    editSubject(subjectId) {
        console.log('Editing subject:', subjectId);
        // Implementation will be added later
    }

    deleteSubject(subjectId) {
        console.log('Deleting subject:', subjectId);
        // Implementation will be added later
    }

    async loadClassScores() {
        const classId = document.getElementById('classSelect').value;
        const subjectId = document.getElementById('subjectSelect').value;
        
        if (!classId || !subjectId) {
            document.getElementById('scoresTableBody').innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">Vui lòng chọn lớp và môn học</td>
                </tr>
            `;
            return;
        }

        try {
            // Get students of selected class
            const students = await this.dataManager.getStudentsByClass(classId);
            // Get scores for the selected class and subject
            const scores = await this.dataManager.getScores(classId, subjectId);

            const tableBody = document.getElementById('scoresTableBody');
            tableBody.innerHTML = students.map(student => {
                const studentScores = scores.find(s => s.studentId === student.id) || {};
                return `
                    <tr>
                        <td>${student.studentCode || ''}</td>
                        <td>${student.fullName}</td>
                        <td>${studentScores.oral || '-'}</td>
                        <td>${studentScores.test15 || '-'}</td>
                        <td>${studentScores.test45 || '-'}</td>
                        <td>${studentScores.midterm || '-'}</td>
                        <td>${studentScores.final || '-'}</td>
                        <td>${this.calculateAverageScore(studentScores) || '-'}</td>
                        <td>
                            <button class="btn btn-small" onclick="app.editStudentScore('${student.id}')">
                                Sửa điểm
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('Error loading class scores:', error);
            this.showNotification('Lỗi khi tải điểm số', 'error');
        }
    }

    calculateAverageScore(scores) {
        if (!scores) return null;

        const weights = {
            oral: 1,
            test15: 1,
            test45: 2,
            midterm: 2,
            final: 3
        };

        let totalWeight = 0;
        let totalScore = 0;

        for (const [type, score] of Object.entries(scores)) {
            if (type !== 'studentId' && type !== 'subjectId' && score !== null) {
                totalScore += score * weights[type];
                totalWeight += weights[type];
            }
        }

        return totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : null;
    }

    editStudentScore(studentId) {
        console.log('Editing scores for student:', studentId);
        // Implementation will be added later
    }

    async showInputScoresForm() {
        const classId = document.getElementById('classSelect').value;
        const subjectId = document.getElementById('subjectSelect').value;

        if (!classId || !subjectId) {
            this.showNotification('Vui lòng chọn lớp và môn học trước', 'error');
            return;
        }

        try {
            const students = await this.dataManager.getStudentsByClass(classId);
            const scores = await this.dataManager.getScores(classId, subjectId);
            const subject = (await this.dataManager.getSubjects()).find(s => s.id === subjectId);

            // Create modal dialog
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Nhập điểm ${subject?.name || ''}</h3>
                        <button class="close-button" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="scoreInputForm">
                            <div class="score-type-select">
                                <label for="scoreType">Loại điểm:</label>
                                <select id="scoreType" required>
                                    <option value="oral">Điểm miệng</option>
                                    <option value="test15">Điểm 15 phút</option>
                                    <option value="test45">Điểm 1 tiết</option>
                                    <option value="midterm">Điểm giữa kỳ</option>
                                    <option value="final">Điểm cuối kỳ</option>
                                </select>
                            </div>
                            <div class="scores-input-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Mã HS</th>
                                            <th>Họ và tên</th>
                                            <th>Điểm</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${students.map(student => {
                                            const studentScore = scores.find(s => s.studentId === student.id);
                                            return `
                                                <tr>
                                                    <td>${student.studentCode}</td>
                                                    <td>${student.fullName}</td>
                                                    <td>
                                                        <input type="number" 
                                                            name="score_${student.id}" 
                                                            min="0" 
                                                            max="10" 
                                                            step="0.1" 
                                                            class="score-input"
                                                            value="${studentScore?.score || ''}"
                                                        >
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-primary">Lưu điểm</button>
                                <button type="button" class="btn btn-secondary" 
                                    onclick="this.closest('.modal').remove()">Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add form submit handler
            const form = document.getElementById('scoreInputForm');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveInputScores(classId, subjectId);
                modal.remove();
                this.loadClassScores(); // Refresh the scores table
            });

        } catch (error) {
            console.error('Error showing input scores form:', error);
            this.showNotification('Lỗi khi tải form nhập điểm', 'error');
        }
    }

    async saveInputScores(classId, subjectId) {
        try {
            const scoreType = document.getElementById('scoreType').value;
            const inputs = document.querySelectorAll('.score-input');
            const scores = [];

            inputs.forEach(input => {
                const studentId = input.name.replace('score_', '');
                const score = input.value ? parseFloat(input.value) : null;
                
                if (score !== null) {
                    scores.push({
                        studentId,
                        classId,
                        subjectId,
                        [scoreType]: score,
                        updatedAt: new Date().toISOString()
                    });
                }
            });

            // Save all scores
            for (const score of scores) {
                await this.dataManager.addOrUpdateScore(score);
            }

            this.showNotification('Đã lưu điểm thành công', 'success');
        } catch (error) {
            console.error('Error saving scores:', error);
            this.showNotification('Lỗi khi lưu điểm', 'error');
        }
    }
}

// Khởi tạo ứng dụng
let app;
document.addEventListener('DOMContentLoaded', async () => {
    const appElement = document.getElementById('app');
    if (!appElement) {
        console.error('Error: Could not find #app element');
        return;
    }
    
    try {
        app = new StudentManagementApp();
        await app.init(); // Call init() after construction
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});