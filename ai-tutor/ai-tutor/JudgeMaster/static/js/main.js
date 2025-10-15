// Add this dropdown management code
document.addEventListener('DOMContentLoaded', function() {
    const userMenuButton = document.getElementById('userMenuButton');
    const userMenu = document.getElementById('userMenu');
    
    // Toggle menu on button click
    userMenuButton?.addEventListener('click', function(e) {
        e.stopPropagation();
        userMenu.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!userMenu?.contains(e.target) && !userMenuButton?.contains(e.target)) {
            userMenu?.classList.add('hidden');
        }
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            userMenu?.classList.add('hidden');
        }
    });
});