document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    // Add loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('loading');
    
    // Simulate API call (replace with actual API call later)
    setTimeout(() => {
        // For demo purposes, accept any login
        if (username && password && role) {
            // Store user info in localStorage
            localStorage.setItem('user', JSON.stringify({
                username,
                role,
                isAuthenticated: true
            }));
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        } else {
            showError('Please fill in all fields');
        }
        
        // Remove loading state
        submitButton.classList.remove('loading');
    }, 1000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const form = document.querySelector('.login-form');
    const existingError = form.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }
    
    form.insertBefore(errorDiv, form.firstChild);
    
    // Remove error message after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
} 