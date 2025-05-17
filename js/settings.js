document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const notificationForm = document.getElementById('notificationForm');
    const systemForm = document.getElementById('systemForm');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const searchInput = document.getElementById('searchInput');

    // Load user data
    loadUserData();
    loadUserPreferences();

    // Handle profile form submission
    profileForm.addEventListener('submit', handleProfileSubmit);

    // Handle password form submission
    passwordForm.addEventListener('submit', handlePasswordSubmit);

    // Handle notification form submission
    notificationForm.addEventListener('submit', handleNotificationSubmit);

    // Handle system form submission
    systemForm.addEventListener('submit', handleSystemSubmit);

    // Handle dark mode toggle
    darkModeToggle.addEventListener('change', handleDarkModeToggle);

    // Handle search
    searchInput.addEventListener('input', handleSearch);

    // Function to load user data
    function loadUserData() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');

        profileName.value = user.name;
        profileEmail.value = user.email;
        profileRole.value = user.role;
    }

    // Function to load user preferences
    function loadUserPreferences() {
        const preferences = JSON.parse(localStorage.getItem('userPreferences')) || {
            emailNotifications: true,
            examReminders: true,
            resultNotifications: true,
            darkMode: false,
            language: 'en',
            timezone: 'UTC'
        };

        // Set notification preferences
        document.querySelector('input[name="emailNotifications"]').checked = preferences.emailNotifications;
        document.querySelector('input[name="examReminders"]').checked = preferences.examReminders;
        document.querySelector('input[name="resultNotifications"]').checked = preferences.resultNotifications;

        // Set system preferences
        darkModeToggle.checked = preferences.darkMode;
        document.getElementById('language').value = preferences.language;
        document.getElementById('timezone').value = preferences.timezone;

        // Apply dark mode if enabled
        if (preferences.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    // Function to handle profile form submission
    function handleProfileSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(profileForm);
        const updatedUser = {
            ...user,
            name: formData.get('profileName'),
            email: formData.get('profileEmail')
        };

        // Simulate API call
        setTimeout(() => {
            localStorage.setItem('user', JSON.stringify(updatedUser));
            showMessage('Profile updated successfully!', 'success');
        }, 500);
    }

    // Function to handle password form submission
    function handlePasswordSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(passwordForm);
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match!', 'error');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            showMessage('Password changed successfully!', 'success');
            passwordForm.reset();
        }, 500);
    }

    // Function to handle notification form submission
    function handleNotificationSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(notificationForm);
        const preferences = {
            emailNotifications: formData.get('emailNotifications') === 'on',
            examReminders: formData.get('examReminders') === 'on',
            resultNotifications: formData.get('resultNotifications') === 'on'
        };

        // Simulate API call
        setTimeout(() => {
            const userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
            localStorage.setItem('userPreferences', JSON.stringify({
                ...userPreferences,
                ...preferences
            }));
            showMessage('Notification preferences saved!', 'success');
        }, 500);
    }

    // Function to handle system form submission
    function handleSystemSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(systemForm);
        const preferences = {
            language: formData.get('language'),
            timezone: formData.get('timezone')
        };

        // Simulate API call
        setTimeout(() => {
            const userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
            localStorage.setItem('userPreferences', JSON.stringify({
                ...userPreferences,
                ...preferences
            }));
            showMessage('System settings saved!', 'success');
        }, 500);
    }

    // Function to handle dark mode toggle
    function handleDarkModeToggle(e) {
        const isDarkMode = e.target.checked;
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        // Save preference
        const userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
        localStorage.setItem('userPreferences', JSON.stringify({
            ...userPreferences,
            darkMode: isDarkMode
        }));
    }

    // Function to handle search
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.settings-card');

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    // Function to show message
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;

        const content = document.querySelector('.settings-content');
        content.insertBefore(messageDiv, content.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}); 