document.addEventListener('DOMContentLoaded', () => {
    // Authentication check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // DOM elements
    const addExamBtn = document.getElementById('addExamBtn');
    const examModal = document.getElementById('examModal');
    const examForm = document.getElementById('examForm');
    const examTitleInput = document.getElementById('examTitle');
    const examClassSelect = document.getElementById('examClass');
    const examSubjectSelect = document.getElementById('examSubject');
    const examDateInput = document.getElementById('examDate');
    const examDurationSelect = document.getElementById('examDuration');
    const teacherNameInput = document.getElementById('teacherName');
    const examContentTextarea = document.getElementById('examContent');
    const examsTable = document.getElementById('examsTable').querySelector('tbody');
    const searchInput = document.getElementById('searchInput');
    const modalTitle = document.getElementById('modalTitle');
    const viewExamModal = document.getElementById('viewExamModal');
    const messageContainer = document.getElementById('messageContainer');

    let editingExamId = null;

    // Load initial data
    loadClasses();
    loadExamsTable();
    setupDurationOptions();

    // Event listeners
    addExamBtn.addEventListener('click', () => openExamModal());
    examForm.addEventListener('submit', handleExamFormSubmit);
    document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));
    searchInput.addEventListener('input', handleSearch);
    examClassSelect.addEventListener('change', handleClassChange);

    // Function to setup duration options
    function setupDurationOptions() {
        const durations = [
            { value: 30, label: '30 minutes' },
            { value: 60, label: '1 hour' },
            { value: 90, label: '1 hour 30 minutes' },
            { value: 120, label: '2 hours' },
            { value: 150, label: '2 hours 30 minutes' },
            { value: 180, label: '3 hours' }
        ];

        examDurationSelect.innerHTML = durations.map(d => 
            `<option value="${d.value}">${d.label}</option>`
        ).join('');
    }

    // Function to load classes
    function loadClasses() {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        examClassSelect.innerHTML = '<option value="">Select Class</option>' +
            classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('');
    }

    // Function to handle class change
    function handleClassChange() {
        const classId = examClassSelect.value;
        if (!classId) {
            examSubjectSelect.innerHTML = '<option value="">Select Subject</option>';
            return;
        }

        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        const selectedClass = classes.find(cls => cls.id === classId);
        
        if (selectedClass && selectedClass.subjectIds) {
            const subjectOptions = selectedClass.subjectIds.map(subjectId => {
                const subject = subjects.find(sub => sub.id === subjectId);
                return subject ? `<option value="${subject.id}">${subject.name}</option>` : '';
            }).filter(option => option !== '');
            
            examSubjectSelect.innerHTML = '<option value="">Select Subject</option>' + subjectOptions.join('');
        } else {
            examSubjectSelect.innerHTML = '<option value="">Select Subject</option>';
        }
    }

    // Function to load exams table
    function loadExamsTable(filter = '') {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        
        let filtered = exams;
        if (filter) {
            const f = filter.toLowerCase();
            filtered = exams.filter(exam =>
                exam.title.toLowerCase().includes(f) ||
                exam.teacherName.toLowerCase().includes(f)
            );
        }

        examsTable.innerHTML = filtered.map(exam => {
            const classInfo = classes.find(cls => cls.id === exam.classId);
            const subjectInfo = subjects.find(sub => sub.id === exam.subjectId);
            
            return `
                <tr>
                    <td>${exam.title}</td>
                    <td>${classInfo ? classInfo.name : ''}</td>
                    <td>${subjectInfo ? subjectInfo.name : ''}</td>
                    <td>${new Date(exam.date).toLocaleDateString()}</td>
                    <td>${exam.duration} minutes</td>
                    <td class="actions">
                        <button class="btn btn-icon" title="View" onclick="window.viewExam('${exam.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon" title="Edit" onclick="window.editExam('${exam.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" title="Delete" onclick="window.deleteExam('${exam.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6">No exams found.</td></tr>';
    }

    // Function to open exam modal
    function openExamModal(exam = null) {
        examModal.classList.add('show');
        examForm.reset();
        editingExamId = null;
        modalTitle.textContent = exam ? 'Edit Exam' : 'Add New Exam';
        
        if (exam) {
            editingExamId = exam.id;
            examTitleInput.value = exam.title;
            examClassSelect.value = exam.classId;
            handleClassChange();
            examSubjectSelect.value = exam.subjectId;
            examDateInput.value = exam.date;
            examDurationSelect.value = exam.duration;
            teacherNameInput.value = exam.teacherName;
            examContentTextarea.value = exam.content || '';
        } else {
            examContentTextarea.value = '';
        }
    }

    // Function to close all modals
    function closeModals() {
        examModal.classList.remove('show');
        viewExamModal.classList.remove('show');
    }

    // Function to handle exam form submit
    function handleExamFormSubmit(e) {
        e.preventDefault();
        const title = examTitleInput.value.trim();
        const classId = examClassSelect.value;
        const subjectId = examSubjectSelect.value;
        const date = examDateInput.value;
        const duration = examDurationSelect.value;
        const teacherName = teacherNameInput.value.trim();
        const content = examContentTextarea.value;

        if (!title || !classId || !subjectId || !date || !duration || !teacherName || !content) {
            showMessage('Please fill all required fields.', 'error');
            return;
        }

        let exams = JSON.parse(localStorage.getItem('exams')) || [];
        if (editingExamId) {
            // Edit
            exams = exams.map(exam =>
                exam.id === editingExamId ? { ...exam, title, classId, subjectId, date, duration, teacherName, content } : exam
            );
            showMessage('Exam updated successfully.', 'success');
        } else {
            // Add
            const newId = 'EXM' + (Date.now() % 1000000).toString().padStart(4, '0');
            exams.push({ id: newId, title, classId, subjectId, date, duration, teacherName, content });
            showMessage('Exam added successfully.', 'success');
        }
        localStorage.setItem('exams', JSON.stringify(exams));
        closeModals();
        loadExamsTable(searchInput.value);
    }

    // Function to handle search
    function handleSearch(e) {
        loadExamsTable(e.target.value);
    }

    // Function to view exam
    window.viewExam = function(examId) {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        
        const exam = exams.find(e => e.id === examId);
        if (exam) {
            const classInfo = classes.find(cls => cls.id === exam.classId);
            const subjectInfo = subjects.find(sub => sub.id === exam.subjectId);

            document.getElementById('viewSubject').textContent = subjectInfo ? subjectInfo.name : '';
            document.getElementById('viewClass').textContent = classInfo ? classInfo.name : '';
            document.getElementById('viewTitle').textContent = exam.title;
            document.getElementById('viewDate').textContent = new Date(exam.date).toLocaleDateString();
            document.getElementById('viewDuration').textContent = `${exam.duration} minutes`;
            document.getElementById('viewTeacher').textContent = exam.teacherName;
            document.getElementById('viewContent').innerHTML = exam.content;

            // Setup print functionality
            const printBtn = document.getElementById('printExamBtn');
            printBtn.onclick = () => {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${exam.title}</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                margin: 0;
                                padding: 20px;
                            }
                            .exam-header {
                                text-align: center;
                                margin-bottom: 30px;
                            }
                            .exam-header h1 {
                                font-size: 24px;
                                margin-bottom: 10px;
                            }
                            .exam-info {
                                margin-bottom: 20px;
                                border-bottom: 1px solid #000;
                                padding-bottom: 10px;
                            }
                            .exam-info p {
                                margin: 5px 0;
                            }
                            .exam-content {
                                margin-top: 20px;
                            }
                            .student-info {
                                margin-top: 40px;
                                border-top: 1px solid #000;
                                padding-top: 10px;
                            }
                            @media print {
                                body {
                                    padding: 0;
                                }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="exam-header">
                            <h1>${exam.title}</h1>
                            <p>${subjectInfo ? subjectInfo.name : ''} - ${classInfo ? classInfo.name : ''}</p>
                        </div>
                        <div class="exam-info">
                            <p><strong>Date:</strong> ${new Date(exam.date).toLocaleDateString()}</p>
                            <p><strong>Duration:</strong> ${exam.duration} minutes</p>
                            <p><strong>Teacher:</strong> ${exam.teacherName}</p>
                        </div>
                        <div class="exam-content">
                            ${exam.content}
                        </div>
                        <div class="student-info">
                            <p><strong>Student Name:</strong> _________________________</p>
                            <p><strong>Student ID:</strong> _________________________</p>
                            <p><strong>Signature:</strong> _________________________</p>
                        </div>
                    </body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            };

            viewExamModal.classList.add('show');
        }
    };

    // Function to edit exam
    window.editExam = function(examId) {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const exam = exams.find(e => e.id === examId);
        if (exam) openExamModal(exam);
    };

    // Function to delete exam
    window.deleteExam = function(examId) {
        if (!confirm('Are you sure you want to delete this exam?')) return;
        let exams = JSON.parse(localStorage.getItem('exams')) || [];
        exams = exams.filter(exam => exam.id !== examId);
        localStorage.setItem('exams', JSON.stringify(exams));
        showMessage('Exam deleted.', 'success');
        loadExamsTable(searchInput.value);
    };

    // Function to show message
    function showMessage(msg, type) {
        const el = document.createElement('div');
        el.className = `message ${type}`;
        el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
        messageContainer.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === examModal) examModal.classList.remove('show');
        if (e.target === viewExamModal) viewExamModal.classList.remove('show');
    });
}); 