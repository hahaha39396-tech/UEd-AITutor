// js/utils.js
const Utils = {
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format date
    formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN');
    },

    // Calculate average score
    calculateAverage: (scores) => {
        const validScores = Object.values(scores).filter(score => score !== null && score !== '');
        if (validScores.length === 0) return 0;
        
        const sum = validScores.reduce((total, score) => total + parseFloat(score), 0);
        return (sum / validScores.length).toFixed(2);
    },

    // Show notification
    showNotification: (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 5px;
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Export to JSON
    exportToJSON: (data, filename) => {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = filename + '.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    // Export to Excel (CSV format)
    exportToExcel: (data, filename) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        
        if (data.length > 0) {
            // Add headers
            const headers = Object.keys(data[0]);
            csvContent += headers.join(",") + "\r\n";
            
            // Add data rows
            data.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    return `"${value}"`;
                });
                csvContent += values.join(",") + "\r\n";
            });
        }
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Validate email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate score (0-10)
    isValidScore: (score) => {
        const num = parseFloat(score);
        return !isNaN(num) && num >= 0 && num <= 10;
    }
};

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);