document.addEventListener('DOMContentLoaded', () => {
    // Authentication check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // DOM elements
    const addClassBtn = document.getElementById('addClassBtn');
    const classModal = document.getElementById('classModal');
    const classForm = document.getElementById('classForm');
    const classNameInput = document.getElementById('className');
    const academicYearInput = document.getElementById('academicYear');
    const classSubjectsSelect = document.getElementById('classSubjects');
    const classesTable = document.getElementById('classesTable').querySelector('tbody');
    const searchInput = document.getElementById('searchInput');
    const modalTitle = document.getElementById('modalTitle');
    const viewStudentsModal = document.getElementById('viewStudentsModal');
    const studentsInClassTable = document.getElementById('studentsInClassTable').querySelector('tbody');
    const messageContainer = document.getElementById('messageContainer');

    let editingClassId = null;

    // Load initial data
    loadSubjectsOptions();
    loadClassesTable();

    // Event listeners
    addClassBtn.addEventListener('click', () => openClassModal());
    classForm.addEventListener('submit', handleClassFormSubmit);
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));
    searchInput.addEventListener('input', handleSearch);

    // Load subjects into multi-select
    function loadSubjectsOptions() {
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        classSubjectsSelect.innerHTML = subjects.map(subj => `<option value="${subj.id}">${subj.name}</option>`).join('');
    }

    // Load classes into table
    function loadClassesTable(filter = '') {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        let filtered = classes;
        if (filter) {
            const f = filter.toLowerCase();
            filtered = classes.filter(cls =>
                cls.name.toLowerCase().includes(f) ||
                (cls.academicYear && cls.academicYear.toLowerCase().includes(f))
            );
        }
        classesTable.innerHTML = filtered.map(cls => {
            const totalStudents = students.filter(stu => stu.classId === cls.id).length;
            const totalSubjects = (cls.subjectIds || []).length;
            return `
                <tr>
                    <td>${cls.id}</td>
                    <td>${cls.name}</td>
                    <td>${cls.academicYear || ''}</td>
                    <td>${totalStudents}</td>
                    <td>${totalSubjects}</td>
                    <td class="actions">
                        <button class="btn btn-icon" title="View Students" onclick="window.viewStudentsInClass('${cls.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon" title="Edit" onclick="window.editClass('${cls.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" title="Delete" onclick="window.deleteClass('${cls.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6">No classes found.</td></tr>';
    }

    // Open class modal for add/edit
    function openClassModal(cls = null) {
        classModal.classList.add('show');
        classForm.reset();
        editingClassId = null;
        modalTitle.textContent = cls ? 'Edit Class' : 'Add New Class';
        if (cls) {
            editingClassId = cls.id;
            classNameInput.value = cls.name;
            academicYearInput.value = cls.academicYear || '';
            Array.from(classSubjectsSelect.options).forEach(opt => {
                opt.selected = (cls.subjectIds || []).includes(opt.value);
            });
        }
    }

    // Close all modals
    function closeModals() {
        classModal.classList.remove('show');
        viewStudentsModal.classList.remove('show');
    }

    // Handle add/edit class form submit
    function handleClassFormSubmit(e) {
        e.preventDefault();
        const name = classNameInput.value.trim();
        const academicYear = academicYearInput.value.trim();
        const subjectIds = Array.from(classSubjectsSelect.selectedOptions).map(opt => opt.value);
        if (!name || !academicYear || subjectIds.length === 0) {
            showMessage('Please fill all fields and select at least one subject.', 'error');
            return;
        }
        let classes = JSON.parse(localStorage.getItem('classes')) || [];
        if (editingClassId) {
            // Edit
            classes = classes.map(cls =>
                cls.id === editingClassId ? { ...cls, name, academicYear, subjectIds } : cls
            );
            showMessage('Class updated successfully.', 'success');
        } else {
            // Add
            const newId = 'CLS' + (Date.now() % 1000000).toString().padStart(4, '0');
            classes.push({ id: newId, name, academicYear, subjectIds });
            showMessage('Class added successfully.', 'success');
        }
        localStorage.setItem('classes', JSON.stringify(classes));
        closeModals();
        loadClassesTable(searchInput.value);
    }

    // Search/filter handler
    function handleSearch(e) {
        loadClassesTable(e.target.value);
    }

    // View students in class
    window.viewStudentsInClass = function(classId) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const classStudents = students.filter(stu => stu.classId === classId);
        studentsInClassTable.innerHTML = classStudents.length ? classStudents.map((stu, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td>${stu.id}</td>
                <td>${stu.name}</td>
                <td>${stu.parentContact || ''}</td>
                <td>${stu.registrationDate || ''}</td>
            </tr>
        `).join('') : '<tr><td colspan="5">No students in this class.</td></tr>';
        viewStudentsModal.classList.add('show');
    };

    // Edit class
    window.editClass = function(classId) {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const cls = classes.find(c => c.id === classId);
        if (cls) openClassModal(cls);
    };

    // Delete class
    window.deleteClass = function(classId) {
        if (!confirm('Are you sure you want to delete this class?')) return;
        let classes = JSON.parse(localStorage.getItem('classes')) || [];
        classes = classes.filter(cls => cls.id !== classId);
        localStorage.setItem('classes', JSON.stringify(classes));
        showMessage('Class deleted.', 'success');
        loadClassesTable(searchInput.value);
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
        if (e.target === classModal) classModal.classList.remove('show');
        if (e.target === viewStudentsModal) viewStudentsModal.classList.remove('show');
    });
}); 