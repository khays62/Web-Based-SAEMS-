document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const addResultBtn = document.getElementById('addResultBtn');
    const resultModal = document.getElementById('resultModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const resultForm = document.getElementById('resultForm');
    const searchInput = document.getElementById('searchInput');
    const resultsTable = document.getElementById('resultsTable');
    const examFilter = document.getElementById('examFilter');
    const classFilter = document.getElementById('classFilter');

    // Show modal
    addResultBtn.addEventListener('click', () => {
        resultForm.reset();
        document.getElementById('modalTitle').textContent = 'Add New Result';
        loadExamOptions();
        loadStudentOptions();
        resultModal.classList.add('show');
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        resultModal.classList.remove('show');
    });

    // Close modal when clicking outside
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            resultModal.classList.remove('show');
        }
    });

    // Handle form submission
    resultForm.addEventListener('submit', handleResultSubmit);

    // Handle search
    searchInput.addEventListener('input', handleSearch);

    // Handle filters
    examFilter.addEventListener('change', handleFilters);
    classFilter.addEventListener('change', handleFilters);

    // Initial load
    loadResults();
    loadFilterOptions();

    // Function to load exam options
    function loadExamOptions() {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const examSelect = document.getElementById('resultExam');
        examSelect.innerHTML = '<option value="">Select Exam</option>';

        exams.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.id;
            option.textContent = `${exam.title} (${exam.subject})`;
            examSelect.appendChild(option);
        });
    }

    // Function to load student options
    function loadStudentOptions() {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const studentSelect = document.getElementById('resultStudent');
        studentSelect.innerHTML = '<option value="">Select Student</option>';

        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.id})`;
            studentSelect.appendChild(option);
        });
    }

    // Function to load filter options
    function loadFilterOptions() {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const classes = [...new Set(exams.map(exam => exam.class))];

        // Load exam filter options
        examFilter.innerHTML = '<option value="">All Exams</option>';
        exams.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.id;
            option.textContent = exam.title;
            examFilter.appendChild(option);
        });

        // Load class filter options
        classFilter.innerHTML = '<option value="">All Classes</option>';
        classes.forEach(className => {
            const option = document.createElement('option');
            option.value = className;
            option.textContent = className;
            classFilter.appendChild(option);
        });
    }

    // Function to handle form submission
    function handleResultSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(resultForm);
        const resultData = {
            examId: formData.get('resultExam'),
            studentId: formData.get('resultStudent'),
            score: formData.get('resultScore'),
            grade: formData.get('resultGrade'),
            remarks: formData.get('resultRemarks')
        };

        // Get exam and student details
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        
        const exam = exams.find(e => e.id === resultData.examId);
        const student = students.find(s => s.id === resultData.studentId);

        if (!exam || !student) {
            showMessage('Invalid exam or student selection', 'error');
            return;
        }

        // Simulate API call
        setTimeout(() => {
            const results = JSON.parse(localStorage.getItem('results')) || [];
            const resultId = 'RES' + Date.now().toString().slice(-6);
            
            results.push({
                id: resultId,
                ...resultData,
                examTitle: exam.title,
                subject: exam.subject,
                class: exam.class,
                studentName: student.name
            });
            
            localStorage.setItem('results', JSON.stringify(results));
            
            showMessage('Result added successfully!', 'success');
            resultModal.classList.remove('show');
            loadResults();
        }, 500);
    }

    // Function to load results
    function loadResults() {
        const results = JSON.parse(localStorage.getItem('results')) || [];
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        const tbody = resultsTable.querySelector('tbody');
        const thead = resultsTable.querySelector('thead');
        tbody.innerHTML = '';

        // Get selected class and exam
        const selectedClassId = classFilter.value;
        const selectedExamId = examFilter.value;
        const selectedClass = classes.find(cls => cls.id === selectedClassId);
        const selectedExam = exams.find(exam => exam.id === selectedExamId);

        // Get subjects for the selected class
        let classSubjects = [];
        if (selectedClass && selectedClass.subjectIds) {
            classSubjects = selectedClass.subjectIds.map(subId => {
                const sub = subjects.find(s => s.id === subId);
                return sub ? sub.name : '';
            }).filter(Boolean);
        }

        // Build dynamic table header
        let headerHtml = `<tr><th>Student ID</th><th>Student Name</th>`;
        classSubjects.forEach(sub => {
            headerHtml += `<th>${sub}</th>`;
        });
        headerHtml += `<th>Average</th><th>Grade</th><th>Academic Year</th><th>Class Name</th><th>Exam Title</th></tr>`;
        thead.innerHTML = headerHtml;

        // Get students for the selected class
        let classStudents = students;
        if (selectedClassId) {
            classStudents = students.filter(stu => stu.classId === selectedClassId);
        }

        // For each student, build a row
        classStudents.forEach(student => {
            let rowHtml = `<td>${student.id}</td><td>${student.name}</td>`;
            let scores = [];
            classSubjects.forEach(sub => {
                // Find result for this student, subject, and exam
                let score = '';
                let result = results.find(r => r.studentId === student.id && r.subject === sub && (!selectedExamId || r.examId === selectedExamId));
                if (result) score = result.score;
                rowHtml += `<td>${score !== '' ? score : '-'}</td>`;
                scores.push(Number(score) || 0);
            });
            // Calculate average and grade
            let validScores = scores.filter(s => !isNaN(s) && s > 0);
            let average = validScores.length ? (validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
            let grade = calculateGrade(average);
            rowHtml += `<td>${average ? average.toFixed(1) : '-'}</td>`;
            rowHtml += `<td><span class="grade-badge grade-${grade.toLowerCase()}">${grade}</span></td>`;
            rowHtml += `<td>${selectedClass ? selectedClass.academicYear : ''}</td>`;
            rowHtml += `<td>${selectedClass ? selectedClass.name : ''}</td>`;
            rowHtml += `<td>${selectedExam ? selectedExam.title : ''}</td>`;
            const tr = document.createElement('tr');
            tr.innerHTML = rowHtml;
            tbody.appendChild(tr);
        });
    }

    function calculateGrade(average) {
        if (average >= 90) return 'A+';
        if (average >= 80) return 'A';
        if (average >= 70) return 'B';
        if (average >= 60) return 'C';
        if (average >= 50) return 'D';
        return 'F';
    }

    // Function to handle search
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = resultsTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    // Function to handle filters
    function handleFilters() {
        const examId = examFilter.value;
        const className = classFilter.value;
        const rows = resultsTable.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const examMatch = !examId || row.cells[2].textContent.includes(examFilter.options[examFilter.selectedIndex].text);
            const classMatch = !className || row.cells[4].textContent === className;
            row.style.display = examMatch && classMatch ? '' : 'none';
        });
    }

    // Function to show message
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        messageDiv.textContent = message;

        const content = document.querySelector('.results-content');
        content.insertBefore(messageDiv, content.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
});

// Function to edit result
function editResult(id) {
    const results = JSON.parse(localStorage.getItem('results')) || [];
    const result = results.find(r => r.id === id);
    
    if (result) {
        const modal = document.getElementById('resultModal');
        const form = document.getElementById('resultForm');
        
        document.getElementById('modalTitle').textContent = 'Edit Result';
        form.resultExam.value = result.examId;
        form.resultStudent.value = result.studentId;
        form.resultScore.value = result.score;
        form.resultGrade.value = result.grade;
        form.resultRemarks.value = result.remarks || '';
        
        loadExamOptions();
        loadStudentOptions();
        modal.classList.add('show');
    }
}

// Function to delete result
function deleteResult(id) {
    if (confirm('Are you sure you want to delete this result?')) {
        const results = JSON.parse(localStorage.getItem('results')) || [];
        const updatedResults = results.filter(r => r.id !== id);
        
        localStorage.setItem('results', JSON.stringify(updatedResults));
        loadResults();
        showMessage('Result deleted successfully!', 'success');
    }
} 