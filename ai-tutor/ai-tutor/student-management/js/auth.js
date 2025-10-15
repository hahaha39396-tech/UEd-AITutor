// Quản lý xác thực và phân quyền
class Auth {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'sms_session';
    }

    // Đăng nhập
    async login(username, password) {
        try {
            const users = await this.getUsers();
            const user = users.find(u => 
                u.username === username && u.password === this.hashPassword(password)
            );

            if (user) {
                // Tạo session
                const session = {
                    userId: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    role: user.role,
                    loginTime: new Date().toISOString()
                };

                // Lưu session
                localStorage.setItem(this.sessionKey, JSON.stringify(session));
                this.currentUser = session;

                // Log activity
                await this.logActivity(user.id, 'login', 'Đăng nhập thành công');

                return session;
            }

            return null;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Đăng xuất
    logout() {
        if (this.currentUser) {
            this.logActivity(this.currentUser.userId, 'logout', 'Đăng xuất');
        }
        
        localStorage.removeItem(this.sessionKey);
        this.currentUser = null;
    }

    // Lấy thông tin user hiện tại
    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        const sessionData = localStorage.getItem(this.sessionKey);
        if (sessionData) {
            this.currentUser = JSON.parse(sessionData);
            return this.currentUser;
        }

        return null;
    }

    // Kiểm tra quyền truy cập
    hasPermission(requiredRole) {
        const user = this.getCurrentUser();
        if (!user) return false;

        const roleHierarchy = {
            'admin': 3,
            'subject_teacher': 2,
            'homeroom_teacher': 1
        };

        const userLevel = roleHierarchy[user.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        return userLevel >= requiredLevel;
    }

    // Kiểm tra quyền truy cập cụ thể
    canAccessResource(resourceType, resourceId = null) {
        const user = this.getCurrentUser();
        if (!user) return false;

        switch (user.role) {
            case 'admin':
                return true; // Admin có quyền truy cập tất cả

            case 'subject_teacher':
                return this.checkSubjectTeacherAccess(user, resourceType, resourceId);

            case 'homeroom_teacher':
                return this.checkHomeroomTeacherAccess(user, resourceType, resourceId);

            default:
                return false;
        }
    }

    // Kiểm tra quyền của giáo viên bộ môn
    async checkSubjectTeacherAccess(user, resourceType, resourceId) {
        switch (resourceType) {
            case 'students':
                // Chỉ được xem học sinh trong lớp mình dạy
                if (resourceId) {
                    const student = await this.getStudentById(resourceId);
                    const teacherClasses = await this.getClassesByTeacher(user.userId);
                    return teacherClasses.some(cls => cls.id === student.classId);
                }
                return true;

            case 'scores':
                // Chỉ được nhập/sửa điểm môn mình dạy
                return true; // Sẽ check cụ thể trong DataManager

            case 'classes':
                // Chỉ được xem lớp mình dạy
                if (resourceId) {
                    const teacherClasses = await this.getClassesByTeacher(user.userId);
                    return teacherClasses.some(cls => cls.id === resourceId);
                }
                return true;

            default:
                return false;
        }
    }

    // Kiểm tra quyền của giáo viên chủ nhiệm
    async checkHomeroomTeacherAccess(user, resourceType, resourceId) {
        switch (resourceType) {
            case 'students':
                // Chỉ được xem học sinh trong lớp chủ nhiệm
                if (resourceId) {
                    const student = await this.getStudentById(resourceId);
                    const homeroomClass = await this.getHomeroomClass(user.userId);
                    return homeroomClass && homeroomClass.id === student.classId;
                }
                return true;

            case 'scores':
                // Được xem tất cả điểm của lớp chủ nhiệm
                return true;

            case 'classes':
                // Chỉ được xem lớp chủ nhiệm
                if (resourceId) {
                    const homeroomClass = await this.getHomeroomClass(user.userId);
                    return homeroomClass && homeroomClass.id === resourceId;
                }
                return true;

            default:
                return false;
        }
    }

    // Tạo tài khoản mới
    async createUser(userData) {
        const currentUser = this.getCurrentUser();
        
        // Chỉ admin mới có thể tạo tài khoản
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error('Không có quyền tạo tài khoản');
        }

        try {
            const users = await this.getUsers();
            
            // Kiểm tra username đã tồn tại
            if (users.some(u => u.username === userData.username)) {
                throw new Error('Tên đăng nhập đã tồn tại');
            }

            const newUser = {
                id: this.generateId(),
                username: userData.username,
                password: this.hashPassword(userData.password),
                fullName: userData.fullName,
                role: userData.role,
                email: userData.email || '',
                phone: userData.phone || '',
                createdAt: new Date().toISOString(),
                createdBy: currentUser.userId,
                isActive: true
            };

            users.push(newUser);
            await this.saveUsers(users);

            // Log activity
            await this.logActivity(
                currentUser.userId, 
                'create_user', 
                `Tạo tài khoản cho ${newUser.fullName} (${newUser.username})`
            );

            return newUser;
        } catch (error) {
            console.error('Create user error:', error);
            throw error;
        }
    }

    // Cập nhật thông tin user
    async updateUser(userId, userData) {
        const currentUser = this.getCurrentUser();
        
        // Kiểm tra quyền
        if (!currentUser || (currentUser.role !== 'admin' && currentUser.userId !== userId)) {
            throw new Error('Không có quyền cập nhật thông tin');
        }

        try {
            const users = await this.getUsers();
            const userIndex = users.findIndex(u => u.id === userId);
            
            if (userIndex === -1) {
                throw new Error('Không tìm thấy người dùng');
            }

            // Cập nhật thông tin
            users[userIndex] = {
                ...users[userIndex],
                ...userData,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.userId
            };

            // Nếu đổi mật khẩu thì hash lại
            if (userData.password) {
                users[userIndex].password = this.hashPassword(userData.password);
            }

            await this.saveUsers(users);

            // Log activity
            await this.logActivity(
                currentUser.userId,
                'update_user',
                `Cập nhật thông tin user ${users[userIndex].fullName}`
            );

            return users[userIndex];
        } catch (error) {
            console.error('Update user error:', error);
            throw error;
        }
    }

    // Xóa user
    async deleteUser(userId) {
        const currentUser = this.getCurrentUser();
        
        if (!currentUser || currentUser.role !== 'admin') {
            throw new Error('Không có quyền xóa tài khoản');
        }

        try {
            const users = await this.getUsers();
            const userToDelete = users.find(u => u.id === userId);
            
            if (!userToDelete) {
                throw new Error('Không tìm thấy người dùng');
            }

            // Không được xóa tài khoản admin gốc
            if (userToDelete.username === 'admin') {
                throw new Error('Không thể xóa tài khoản admin gốc');
            }

            // Xóa user
            const updatedUsers = users.filter(u => u.id !== userId);
            await this.saveUsers(updatedUsers);

            // Log activity
            await this.logActivity(
                currentUser.userId,
                'delete_user',
                `Xóa tài khoản ${userToDelete.fullName} (${userToDelete.username})`
            );

            return true;
        } catch (error) {
            console.error('Delete user error:', error);
            throw error;
        }
    }

    // Hash mật khẩu (đơn giản cho demo, thực tế nên dùng bcrypt)
    hashPassword(password) {
        // Trong thực tế nên dùng bcrypt hoặc các thuật toán hash mạnh hơn
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    // Tạo ID ngẫu nhiên
    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Log hoạt động
    async logActivity(userId, action, description) {
        try {
            const activities = await this.getActivities();
            const activity = {
                id: this.generateId(),
                userId: userId,
                action: action,
                description: description,
                timestamp: new Date().toISOString(),
                ip: 'localhost' // Trong thực tế sẽ lấy IP thực
            };
            
            activities.push(activity);
            
            // Chỉ giữ lại 1000 hoạt động gần nhất
            if (activities.length > 1000) {
                activities.splice(0, activities.length - 1000);
            }
            
            await this.saveActivities(activities);
        } catch (error) {
            console.error('Log activity error:', error);
        }
    }

    // Các helper methods để tương tác với dữ liệu
    async getUsers() {
        try {
            const usersData = localStorage.getItem('users_data');
            if (!usersData) {
                // Create default admin user if no users exist
                const defaultAdmin = {
                    id: 'admin_001',
                    username: 'admin',
                    password: this.hashPassword('admin123'),
                    fullName: 'Quản trị viên',
                    role: 'admin',
                    email: 'admin@school.edu.vn',
                    phone: '',
                    createdAt: new Date().toISOString(),
                    isActive: true
                };

                // Save default admin and return
                await this.saveUsers([defaultAdmin]);
                return [defaultAdmin];
            }
            return JSON.parse(usersData);
        } catch (error) {
            console.error('Get users error:', error);
            return [];
        }
    }

    async saveUsers(users) {
        return new Promise((resolve) => {
            localStorage.setItem('users_data', JSON.stringify(users));
            resolve(true);
        });
    }

    async getActivities() {
        try {
            const activities = localStorage.getItem('activities_data');
            return activities ? JSON.parse(activities) : [];
        } catch (error) {
            console.error('Get activities error:', error);
            return [];
        }
    }

    async saveActivities(activities) {
        localStorage.setItem('activities_data', JSON.stringify(activities));
    }

    async getStudentById(studentId) {
        // Sẽ được implement trong DataManager
        return null;
    }

    async getClassesByTeacher(teacherId) {
        // Sẽ được implement trong DataManager
        return [];
    }

    async getHomeroomClass(teacherId) {
        // Sẽ được implement trong DataManager
        return null;
    }
}