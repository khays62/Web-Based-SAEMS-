document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated and is admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const addUserBtn = document.getElementById('addUserBtn');
    const userModal = document.getElementById('userModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const userForm = document.getElementById('userForm');
    const searchInput = document.getElementById('searchInput');
    const usersTable = document.getElementById('usersTable');

    // Show modal
    addUserBtn.addEventListener('click', () => {
        userForm.reset();
        document.getElementById('modalTitle').textContent = 'Add New User';
        userModal.classList.add('show');
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        userModal.classList.remove('show');
    });

    // Close modal when clicking outside
    userModal.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.classList.remove('show');
        }
    });

    // Handle form submission
    userForm.addEventListener('submit', handleUserSubmit);

    // Handle search
    searchInput.addEventListener('input', handleSearch);

    // Initial load of users
    loadUsers();

    // Function to handle form submission
    function handleUserSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(userForm);
        const userData = {
            name: formData.get('userName'),
            email: formData.get('userEmail'),
            role: formData.get('userRole'),
            password: formData.get('userPassword'),
            status: formData.get('userStatus')
        };

        // Simulate API call
        setTimeout(() => {
            // In a real application, this would be an API call
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userId = 'USR' + Date.now().toString().slice(-6);
            
            users.push({
                id: userId,
                ...userData
            });
            
            localStorage.setItem('users', JSON.stringify(users));
            
            showMessage('User added successfully!', 'success');
            userModal.classList.remove('show');
            loadUsers();
        }, 500);
    }

    // Function to load users
    function loadUsers() {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const tbody = usersTable.querySelector('tbody');
        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn-icon" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Function to handle search
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = usersTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    // Function to show message
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;

        const content = document.querySelector('.users-content');
        content.insertBefore(messageDiv, content.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
});

// Function to edit user
function editUser(id) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === id);
    
    if (user) {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        
        document.getElementById('modalTitle').textContent = 'Edit User';
        form.userName.value = user.name;
        form.userEmail.value = user.email;
        form.userRole.value = user.role;
        form.userStatus.value = user.status;
        
        // Clear password field for security
        form.userPassword.value = '';
        
        modal.classList.add('show');
    }
}

// Function to delete user
function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUsers = users.filter(u => u.id !== id);
        
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        loadUsers();
        showMessage('User deleted successfully!', 'success');
    }
} 