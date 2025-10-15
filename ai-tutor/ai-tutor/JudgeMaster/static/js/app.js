// JudgeMaster Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize sidebar toggle
    initSidebarToggle();
    
    // Initialize chat panel
    initChatPanel();
    
    // Initialize notifications
    initNotifications();
    
    // Initialize dropdown menus
    initDropdowns();
    
    // Initialize forms
    initForms();
}

// Sidebar functionality
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            
            // Save sidebar state
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }
    
    // Mobile sidebar toggle
    if (window.innerWidth <= 768) {
        sidebar?.classList.add('hidden');
        
        sidebarToggle?.addEventListener('click', function() {
            sidebar.classList.toggle('hidden');
        });
    }
}

// Chat panel functionality
function initChatPanel() {
    const chatPanel = document.getElementById('chat-panel');
    const chatToggle = document.getElementById('chat-toggle');
    const chatClose = document.getElementById('chat-close');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (chatToggle) {
        chatToggle.addEventListener('click', function() {
            chatPanel.classList.toggle('open');
        });
    }
    
    if (chatClose) {
        chatClose.addEventListener('click', function() {
            chatPanel.classList.remove('open');
        });
    }
    
    if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (message) {
                sendChatMessage(message);
                chatInput.value = '';
            }
        });
    }
}

// Send chat message
function sendChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    
    // Add user message
    addChatMessage('user', message);
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to backend (placeholder for now)
    setTimeout(() => {
        hideTypingIndicator();
        addChatMessage('assistant', 'Xin lỗi, tính năng AI chatbot đang được phát triển. Vui lòng thử lại sau!');
    }, 1500);
}

// Add message to chat
function addChatMessage(type, content) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    const now = new Date();
    const time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="chat-message-content">${content}</div>
        <div class="chat-message-time">${time}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'chat-message assistant';
    typingDiv.innerHTML = `
        <div class="chat-message-content">
            <span class="typing-dots">
                <span></span><span></span><span></span>
            </span>
            AI đang soạn tin nhắn...
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Send quick message
function sendQuickMessage(message) {
    const chatInput = document.getElementById('chat-input');
    chatInput.value = message;
    sendChatMessage(message);
}

// Notifications
function initNotifications() {
    // Placeholder for notifications system
}

function toggleNotifications() {
    // Show notifications dropdown
    showToast('Tính năng thông báo đang được phát triển!', 'info');
}

// Dropdown menus
function initDropdowns() {
    document.addEventListener('click', function(e) {
        // Close all dropdowns when clicking outside
        const dropdowns = document.querySelectorAll('.dropdown-menu');
        dropdowns.forEach(dropdown => {
            if (!dropdown.parentElement.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Toggle dropdown when clicking button
        if (e.target.matches('.dropdown button, .dropdown button *')) {
            e.preventDefault();
            const dropdown = e.target.closest('.dropdown');
            const menu = dropdown.querySelector('.dropdown-menu');
            menu.classList.toggle('show');
        }
    });
}

// Form handling
function initForms() {
    // Auto-resize textareas
    const textareas = document.querySelectorAll('.form-textarea');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    });
    
    // Form validation
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(form)) {
                e.preventDefault();
            }
        });
    });
}

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            showFieldError(input, 'Trường này là bắt buộc');
            isValid = false;
        } else {
            clearFieldError(input);
        }
    });
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add to page
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        default: return 'ℹ️';
    }
}

// Code editor functionality (placeholder)
function initCodeEditor(element, language = 'python') {
    // This would integrate with a code editor like CodeMirror or Monaco
    console.log('Code editor would be initialized here for element:', element);
}

// Timer functionality
function startTimer(duration, display) {
    let timer = duration, minutes, seconds;
    const interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(interval);
            onTimerExpired();
        }
        
        // Add critical class when under 5 minutes
        if (timer < 300) {
            display.classList.add('critical');
        }
    }, 1000);
    
    return interval;
}

function onTimerExpired() {
    showToast('Hết thời gian làm bài!', 'warning');
    // Auto-submit or other actions
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Export functions for global access
window.JudgeMaster = {
    sendQuickMessage,
    toggleNotifications,
    showToast,
    initCodeEditor,
    startTimer,
    formatFileSize,
    formatTime
};