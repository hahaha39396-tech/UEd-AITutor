// js/data-manager.js
class DataManager {
    constructor() {
        this.initializeData();
    }

    // Initialize default data structure
    initializeData() {
        const defaultData = {
            users: [
                {
                    id: 'admin001',
                    username: 'admin',
                    password: 'admin123',
                    fullName: 'Quản trị viên',
                    role: 'admin',
                    email: 'admin@school.edu.vn'
                }
            ],
            students: [],
            classes: [
                { id: 'class001', name: '10A1', grade: 10, homeRoomTeacher: null },
                { id: 'class002', name: '10A2', grade: 10, homeRoomTeacher: null },
                { id: 'class003', name: '11A1', grade: 11, homeRoomTeacher: null },
                { id: 'class004', name: '12A1', grade: 12, homeRoomTeacher: null }
            ],
            subjects: [
                { id: 'subj001', name: 'Toán', code: 'TOAN' },
                { id: 'subj002', name: 'Văn', code: 'VAN' },
                { id: 'subj003', name: 'Anh', code: 'ANH' },
                { id: 'subj004', name: 'Lý', code: 'LY' },
                { id: 'subj005', name: 'Hóa', code: 'HOA' },
                { id: 'subj006', name: 'Sinh', code: 'SINH' },
                { id: 'subj007', name: 'Sử', code: 'SU' },
                { id: 'subj008', name: 'Địa', code: 'DIA' }
            ],
            scores: [],
            teacherAssignments: []
        };

        // Initialize localStorage if empty
        Object.keys(defaultData).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(defaultData[key]));
            }
        });
    }

    // Generic data operations
    getData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    setData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // User operations
    getUsers() {
        return this.getData('users');
    }
    
    addUser(user) {
        const users = this.getUsers();
        user.id = Utils.generateId();
        users.push(user);
        this.setData('users', users);
        return user;
    }

    updateUser(userId, updatedUser) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUser };
            this.setData('users', users);
            return users[index];
        }
        return null;
    }

    deleteUser(userId) {
        const users = this.getUsers();
        const filteredUsers = users.filter(u => u.id !== userId);
        this.setData('users', filteredUsers);
    }

    // Student operations
    getStudents() {
        return this.getData('students');
    }
    
    addStudent(student) {
        const students = this.getStudents();
        student.id = Utils.generateId();
        students.push(student);
        this.setData('students', students);
        return student;
    }

    updateStudent(studentId, updatedStudent) {
        const students = this.getStudents();
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            students[index] = { ...students[index], ...updatedStudent };
            this.setData('students', students);
            return students[index];
        }
        return null;
    }

    deleteStudent(studentId) {
        const students = this.getStudents();
        const filteredStudents = students.filter(s => s.id !== studentId);
        this.setData('students', filteredStudents);
        
        // Also delete related scores
        const scores = this.getScores();
        const filteredScores = scores.filter(s => s.studentId !== studentId);
        this.setData('scores', filteredScores);
    }

    // Class operations
    getClasses() {
        return this.getData('classes');
    }
    
    addClass(classData) {
        const classes = this.getClasses();
        classData.id = Utils.generateId();
        classes.push(classData);
        this.setData('classes', classes);
        return classData;
    }

    updateClass(classId, updatedClass) {
        const classes = this.getClasses();
        const index = classes.findIndex(c => c.id === classId);
        if (index !== -1) {
            classes[index] = { ...classes[index], ...updatedClass };
            this.setData('classes', classes);
            return classes[index];
        }
        return null;
    }

    deleteClass(classId) {
        const classes = this.getClasses();
        const filteredClasses = classes.filter(c => c.id !== classId);
        this.setData('classes', filteredClasses);
    }

    // Subject operations
    getSubjects() {
        const subjects = localStorage.getItem('subjects');
        if (!subjects) {
            // Initialize with default subjects if none exist
            const defaultSubjects = [
                {
                    id: 'sub001',
                    code: 'TOAN',
                    name: 'Toán học',
                    grades: [10, 11, 12],
                    lessonsPerWeek: 5,
                    teachers: []
                },
                {
                    id: 'sub002',
                    code: 'LY',
                    name: 'Vật lý',
                    grades: [10, 11, 12],
                    lessonsPerWeek: 3,
                    teachers: []
                },
                {
                    id: 'sub003',
                    code: 'HOA',
                    name: 'Hóa học',
                    grades: [10, 11, 12],
                    lessonsPerWeek: 3,
                    teachers: []
                },
                {
                    id: 'sub004',
                    code: 'VAN',
                    name: 'Ngữ văn',
                    grades: [10, 11, 12],
                    lessonsPerWeek: 4,
                    teachers: []
                }
            ];
            localStorage.setItem('subjects', JSON.stringify(defaultSubjects));
            return defaultSubjects;
        }
        return JSON.parse(subjects);
    }

    async setSubjects(subjects) {
        localStorage.setItem('subjects', JSON.stringify(subjects));
    }

    deleteSubject(subjectId) {
        const subjects = this.getSubjects();
        const filteredSubjects = subjects.filter(s => s.id !== subjectId);
        this.setData('subjects', filteredSubjects);
    }

    // Score operations
    getScores() {
        return this.getData('scores');
    }
    
    addOrUpdateScore(scoreData) {
        const scores = this.getScores();
        const existingIndex = scores.findIndex(s => 
            s.studentId === scoreData.studentId && 
            s.subjectId === scoreData.subjectId
        );
        
        if (existingIndex !== -1) {
            scores[existingIndex] = { ...scores[existingIndex], ...scoreData };
        } else {
            scoreData.id = Utils.generateId();
            scores.push(scoreData);
        }
        
        this.setData('scores', scores);
        return scoreData;
    }

    getScoresByStudent(studentId) {
        const scores = this.getScores();
        return scores.filter(s => s.studentId === studentId);
    }

    getScoresByClass(classId) {
        const students = this.getStudents().filter(s => s.classId === classId);
        const scores = this.getScores();
        return scores.filter(score => 
            students.some(student => student.id === score.studentId)
        );
    }

    // Teacher assignment operations
    getTeacherAssignments() {
        return this.getData('teacherAssignments');
    }
    
    addTeacherAssignment(assignment) {
        const assignments = this.getTeacherAssignments();
        assignment.id = Utils.generateId();
        assignments.push(assignment);
        this.setData('teacherAssignments', assignments);
        return assignment;
    }

    getTeacherClasses(teacherId) {
        const assignments = this.getTeacherAssignments();
        return assignments
            .filter(a => a.teacherId === teacherId)
            .map(a => a.classId);
    }

    getTeacherSubjects(teacherId) {
        const assignments = this.getTeacherAssignments();
        return assignments
            .filter(a => a.teacherId === teacherId)
            .map(a => a.subjectId);
    }

    async getStudentsByClass(classId) {
        try {
            const allStudents = this.getData('students') || [];
            return allStudents.filter(student => student.classId === classId);
        } catch (error) {
            console.error('Error getting students by class:', error);
            return [];
        }
    }

    async getScores(classId, subjectId) {
        try {
            const allScores = this.getData('scores') || [];
            return allScores.filter(score => 
                score.classId === classId && 
                score.subjectId === subjectId
            );
        } catch (error) {
            console.error('Error getting scores:', error);
            return [];
        }
    }
}

// Initialize data on page load
const dataManager = new DataManager();