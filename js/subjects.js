document.addEventListener('DOMContentLoaded', () => {
    // Authentication check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // DOM elements
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const subjectModal = document.getElementById('subjectModal');
    const subjectForm = document.getElementById('subjectForm');
    const subjectNameInput = document.getElementById('subjectName');
    const subjectCodeInput = document.getElementById('subjectCode');
    const subjectsTable = document.getElementById('subjectsTable').querySelector('tbody');
    const searchInput = document.getElementById('searchInput');
    const modalTitle = document.getElementById('modalTitle');
    const viewClassesModal = document.getElementById('viewClassesModal');
    const classesForSubjectTable = document.getElementById('classesForSubjectTable').querySelector('tbody');
    const messageContainer = document.getElementById('messageContainer');

    let editingSubjectId = null;

    // Load initial data
    loadSubjectsTable();

    // Event listeners
    addSubjectBtn.addEventListener('click', () => openSubjectModal());
    subjectForm.addEventListener('submit', handleSubjectFormSubmit);
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));
    searchInput.addEventListener('input', handleSearch);
    subjectNameInput.addEventListener('input', handleSubjectNameInput);

    // Auto-generate subject code based on name
    function handleSubjectNameInput() {
        const name = subjectNameInput.value.trim();
        if (!name) {
            subjectCodeInput.value = '';
            return;
        }
        // Generate code: first 3 letters uppercase + 3-digit number
        const prefix = name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        let maxNum = 0;
        subjects.forEach(subj => {
            const match = subj.code && subj.code.match(new RegExp(`^${prefix}(\\d{3})$`));
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        subjectCodeInput.value = prefix + String(maxNum + 1).padStart(3, '0');
    }

    // Load subjects into table
    function loadSubjectsTable(filter = '') {
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        let filtered = subjects;
        if (filter) {
            const f = filter.toLowerCase();
            filtered = subjects.filter(subj =>
                subj.name.toLowerCase().includes(f) ||
                (subj.code && subj.code.toLowerCase().includes(f))
            );
        }
        subjectsTable.innerHTML = filtered.map(subj => {
            // Count number of classes that have this subject in their subjectIds
            const classCount = classes.filter(cls => (cls.subjectIds || []).includes(subj.id)).length;
            return `
                <tr>
                    <td>${subj.id}</td>
                    <td>${subj.name}</td>
                    <td>${subj.code || ''}</td>
                    <td>${classCount}</td>
                    <td class="actions">
                        <button class="btn btn-icon" title="View Classes" onclick="window.viewClassesForSubject('${subj.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon" title="Edit" onclick="window.editSubject('${subj.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" title="Delete" onclick="window.deleteSubject('${subj.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="5">No subjects found.</td></tr>';
    }

    // Open subject modal for add/edit
    function openSubjectModal(subj = null) {
        subjectModal.classList.add('show');
        subjectForm.reset();
        editingSubjectId = null;
        modalTitle.textContent = subj ? 'Edit Subject' : 'Add New Subject';
        if (subj) {
            editingSubjectId = subj.id;
            subjectNameInput.value = subj.name;
            subjectCodeInput.value = subj.code || '';
        } else {
            subjectCodeInput.value = '';
        }
    }

    // Close all modals
    function closeModals() {
        subjectModal.classList.remove('show');
        viewClassesModal.classList.remove('show');
    }

    // Handle add/edit subject form submit
    function handleSubjectFormSubmit(e) {
        e.preventDefault();
        const name = subjectNameInput.value.trim();
        const code = subjectCodeInput.value.trim();
        if (!name || !code) {
            showMessage('Please fill all required fields.', 'error');
            return;
        }
        let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        if (editingSubjectId) {
            // Edit
            subjects = subjects.map(subj =>
                subj.id === editingSubjectId ? { ...subj, name, code } : subj
            );
            showMessage('Subject updated successfully.', 'success');
        } else {
            // Add
            const newId = 'SUB' + (Date.now() % 1000000).toString().padStart(4, '0');
            subjects.push({ id: newId, name, code });
            showMessage('Subject added successfully.', 'success');
        }
        localStorage.setItem('subjects', JSON.stringify(subjects));
        closeModals();
        loadSubjectsTable(searchInput.value);
    }

    // Search/filter handler
    function handleSearch(e) {
        loadSubjectsTable(e.target.value);
    }

    // View classes for subject
    window.viewClassesForSubject = function(subjectId) {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const classList = classes.filter(cls => (cls.subjectIds || []).includes(subjectId));
        classesForSubjectTable.innerHTML = classList.length ? classList.map((cls, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${cls.id}</td>
                <td>${cls.name}</td>
                <td>${cls.academicYear || ''}</td>
            </tr>
        `).join('') : '<tr><td colspan="4">No classes assigned to this subject.</td></tr>';
        viewClassesModal.classList.add('show');
    };

    // Edit subject
    window.editSubject = function(subjectId) {
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        const subj = subjects.find(s => s.id === subjectId);
        if (subj) openSubjectModal(subj);
    };

    // Delete subject
    window.deleteSubject = function(subjectId) {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        subjects = subjects.filter(subj => subj.id !== subjectId);
        localStorage.setItem('subjects', JSON.stringify(subjects));
        showMessage('Subject deleted.', 'success');
        loadSubjectsTable(searchInput.value);
    };

    // Show message
    function showMessage(msg, type) {
        const el = document.createElement('div');
        el.className = `message ${type}`;
        el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
        messageContainer.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === subjectModal) subjectModal.classList.remove('show');
        if (e.target === viewClassesModal) viewClassesModal.classList.remove('show');
    });
}); 