document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // DOM elements
    const addStudentBtn = document.getElementById('addStudentBtn');
    const studentModal = document.getElementById('studentModal');
    const closeModalBtns = document.querySelectorAll('.modal-close');
    const studentForm = document.getElementById('studentForm');
    const searchInput = document.getElementById('searchInput');
    const studentsTable = document.getElementById('studentsTable').querySelector('tbody');
    const studentNameInput = document.getElementById('studentName');
    const studentClassSelect = document.getElementById('studentClass');
    const studentAcademicYearInput = document.getElementById('studentAcademicYear');
    const studentParentContactInput = document.getElementById('studentParentContact');
    const studentRegistrationDateInput = document.getElementById('studentRegistrationDate');
    const modalTitle = document.getElementById('modalTitle');
    const messageContainer = document.getElementById('messageContainer');

    let editingStudentId = null;

    // Event listeners
    addStudentBtn.addEventListener('click', () => openStudentModal());
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    studentForm.addEventListener('submit', handleStudentFormSubmit);
    searchInput.addEventListener('input', handleSearch);
    studentClassSelect.addEventListener('change', handleClassChange);

    // Initial load
    loadStudentsTable();

    // Load classes into select
    function loadClassesOptions() {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        console.log('Classes loaded for dropdown:', classes);
        studentClassSelect.innerHTML = '<option value="">Select Class</option>' +
            classes.map(cls => `<option value="${cls.id}">${cls.name} (${cls.academicYear || ''})</option>`).join('');
    }

    // Open student modal for add/edit
    function openStudentModal(stu = null) {
        loadClassesOptions();
        studentModal.classList.add('show');
        studentForm.reset();
        editingStudentId = null;
        modalTitle.textContent = stu ? 'Edit Student' : 'Add New Student';
        if (stu) {
            editingStudentId = stu.id;
            studentNameInput.value = stu.name;
            studentClassSelect.value = stu.classId || '';
            studentParentContactInput.value = stu.parentContact || '';
            studentRegistrationDateInput.value = stu.registrationDate || '';
            // Set academic year field
            const classes = JSON.parse(localStorage.getItem('classes')) || [];
            const classObj = classes.find(c => c.id === stu.classId);
            studentAcademicYearInput.value = stu.academicYear || (classObj ? classObj.academicYear : '');
        } else {
            // Default registration date to today
            studentRegistrationDateInput.value = new Date().toISOString().slice(0, 10);
            studentAcademicYearInput.value = '';
        }
    }

    // Handle class change to auto-fill academic year
    function handleClassChange() {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const selected = classes.find(cls => cls.id === studentClassSelect.value);
        studentAcademicYearInput.value = selected ? (selected.academicYear || '') : '';
    }

    // Close modal
    function closeModal() {
        studentModal.classList.remove('show');
    }

    // Handle add/edit student form submit
    function handleStudentFormSubmit(e) {
        e.preventDefault();
        const name = studentNameInput.value.trim();
        const classId = studentClassSelect.value;
        const parentContact = studentParentContactInput.value.trim();
        const registrationDate = studentRegistrationDateInput.value;
        const academicYear = studentAcademicYearInput.value;
        if (!name || !classId || !parentContact || !registrationDate) {
            showMessage('Please fill all fields.', 'error');
            return;
        }
        let students = JSON.parse(localStorage.getItem('students')) || [];
        if (editingStudentId) {
            // Edit
            students = students.map(stu =>
                stu.id === editingStudentId ? { ...stu, name, classId, parentContact, registrationDate, academicYear } : stu
            );
            showMessage('Student updated successfully.', 'success');
        } else {
            // Add
            const newId = 'STU' + (Date.now() % 1000000).toString().padStart(4, '0');
            students.push({ id: newId, name, classId, parentContact, registrationDate, academicYear });
            showMessage('Student added successfully.', 'success');
        }
        localStorage.setItem('students', JSON.stringify(students));
        closeModal();
        loadStudentsTable(searchInput.value);
    }

    // Load students into table
    function loadStudentsTable(filter = '') {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        let filtered = students;
        if (filter) {
            const f = filter.toLowerCase();
            filtered = students.filter(stu =>
                stu.name.toLowerCase().includes(f) ||
                (stu.classId && (classes.find(c => c.id === stu.classId)?.name || '').toLowerCase().includes(f)) ||
                (stu.parentContact && stu.parentContact.toLowerCase().includes(f))
            );
        }
        studentsTable.innerHTML = filtered.map((stu, idx) => {
            const classObj = classes.find(c => c.id === stu.classId);
            const academicYear = stu.academicYear || (classObj ? classObj.academicYear : '-');
            return `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${stu.id}</td>
                    <td>${stu.name}</td>
                    <td>${classObj ? classObj.name : '-'}</td>
                    <td>${academicYear || '-'}</td>
                    <td>${stu.parentContact || '-'}</td>
                    <td>${stu.registrationDate || '-'}</td>
                    <td class="actions">
                        <button class="btn btn-icon" title="Edit" onclick="window.editStudent('${stu.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" title="Delete" onclick="window.deleteStudent('${stu.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="8">No students found.</td></tr>';
    }

    // Search/filter handler
    function handleSearch(e) {
        loadStudentsTable(e.target.value);
    }

    // Edit student
    window.editStudent = function(studentId) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const stu = students.find(s => s.id === studentId);
        if (stu) openStudentModal(stu);
    };

    // Delete student
    window.deleteStudent = function(studentId) {
        if (!confirm('Are you sure you want to delete this student?')) return;
        let students = JSON.parse(localStorage.getItem('students')) || [];
        students = students.filter(stu => stu.id !== studentId);
        localStorage.setItem('students', JSON.stringify(students));
        showMessage('Student deleted.', 'success');
        loadStudentsTable(searchInput.value);
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
        if (e.target === studentModal) studentModal.classList.remove('show');
    });
}); 