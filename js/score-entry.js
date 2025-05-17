document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const classSelect = document.getElementById('classSelect');
    const examSelect = document.getElementById('examSelect');
    const scoreTable = document.getElementById('scoreTable');
    const saveScoresBtn = document.getElementById('saveScores');
    const searchInput = document.getElementById('searchInput');

    // Load initial data
    loadClasses();
    loadExams();

    // Event listeners
    classSelect.addEventListener('change', handleClassChange);
    examSelect.addEventListener('change', handleExamChange);
    saveScoresBtn.addEventListener('click', saveScores);
    searchInput.addEventListener('input', handleSearch);

    // Function to load classes
    function loadClasses() {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        classSelect.innerHTML = '<option value="">Select Class</option>' +
            classes.map(cls => `<option value="${cls.id}">${cls.name}</option>`).join('');
    }

    // Function to load exams
    function loadExams() {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        examSelect.innerHTML = '<option value="">Select Exam</option>' +
            exams.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');
    }

    // Function to handle class change
    function handleClassChange() {
        const selectedClass = classSelect.value;
        // Show academic year
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const selectedClassObj = classes.find(cls => cls.id === selectedClass);
        let academicYearLabel = document.getElementById('academicYearLabel');
        if (!academicYearLabel) {
            academicYearLabel = document.createElement('span');
            academicYearLabel.id = 'academicYearLabel';
            classSelect.parentNode.appendChild(academicYearLabel);
        }
        academicYearLabel.textContent = selectedClassObj ? `Academic Year: ${selectedClassObj.academicYear || ''}` : '';

        // Filter exams for this class
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const classExams = exams.filter(exam => exam.classId === selectedClass);
        examSelect.innerHTML = '<option value="">Select Exam</option>' +
            classExams.map(exam => `<option value="${exam.id}">${exam.title}</option>`).join('');

        if (selectedClass) {
            loadStudents(selectedClass);
            loadClassSubjects(selectedClass);
        } else {
            clearTable();
        }
    }

    // Function to load class subjects
    function loadClassSubjects(classId) {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        const selectedClass = classes.find(cls => cls.id === classId);
        
        if (selectedClass && selectedClass.subjectIds) {
            // Get subject names from subject IDs
            const subjectNames = selectedClass.subjectIds.map(subjectId => {
                const subject = subjects.find(sub => sub.id === subjectId);
                return subject ? subject.name : '';
            }).filter(name => name !== '');
            
            if (subjectNames.length > 0) {
                updateTableSubjects(subjectNames);
            }
        }
    }

    // Function to handle exam change
    function handleExamChange() {
        const selectedExam = examSelect.value;
        if (selectedExam) {
            // Load any exam-specific data if needed
        } else {
            clearTable();
        }
    }

    // Function to load students
    function loadStudents(classId) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const classStudents = students.filter(student => student.classId === classId);
        
        if (classStudents.length > 0) {
            generateTable(classStudents);
        } else {
            showMessage('No students found in this class', 'error');
        }
    }

    // Function to load subjects
    function loadSubjects(examId) {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const selectedExam = exams.find(exam => exam.id === examId);
        
        if (selectedExam && selectedExam.subjects) {
            updateTableSubjects(selectedExam.subjects);
        }
    }

    // Function to generate table
    function generateTable(students) {
        const tbody = scoreTable.querySelector('tbody');
        tbody.innerHTML = students.map((student, index) => `
            <tr data-student-id="${student.id}">
                <td>${index + 1}</td>
                <td>${student.id}</td>
                <td>${student.name}</td>
                <!-- Subject columns will be added dynamically -->
                <td class="average-score">0</td>
                <td class="grade">-</td>
            </tr>
        `).join('');
    }

    // Function to update table subjects
    function updateTableSubjects(subjects) {
        const theadRow = scoreTable.querySelector('thead tr');
        const tbody = scoreTable.querySelector('tbody');

        // Remove existing subject columns from thead
        // Find the index after Name (which is index 2)
        while (theadRow.cells.length > 3) {
            // Remove cells between Name and Average
            theadRow.deleteCell(3);
        }
        // Insert new subject columns after Name
        subjects.forEach((subject, i) => {
            const th = document.createElement('th');
            th.className = 'subject-col';
            th.textContent = subject;
            theadRow.insertBefore(th, theadRow.cells[3 + i]);
        });

        // For each row, remove old subject cells and insert new ones after Name
        tbody.querySelectorAll('tr').forEach(row => {
            // Remove old subject cells (between Name and Average)
            while (row.cells.length > 5) {
                row.deleteCell(3);
            }
            // Insert new subject input cells after Name
            subjects.forEach((subject, i) => {
                const td = document.createElement('td');
                td.innerHTML = `<input type="number" class="score-input" min="0" max="100" data-subject="${subject}" placeholder="Score">`;
                row.insertBefore(td, row.cells[3 + i]);
            });
        });
        // Add event listeners for new score inputs
        addScoreInputListeners();
    }

    // Function to add score input listeners
    function addScoreInputListeners() {
        const scoreInputs = document.querySelectorAll('.score-input');
        scoreInputs.forEach(input => {
            input.addEventListener('input', handleScoreInput);
        });
    }

    // Function to handle score input
    function handleScoreInput(e) {
        const input = e.target;
        const value = parseInt(input.value);
        
        // Validate score
        if (value < 0 || value > 100) {
            input.classList.add('invalid');
            return;
        }
        
        input.classList.remove('invalid');
        updateStudentStats(input.closest('tr'));
    }

    // Function to update student statistics
    function updateStudentStats(row) {
        const scoreInputs = row.querySelectorAll('.score-input');
        const scores = Array.from(scoreInputs)
            .map(input => parseInt(input.value) || 0)
            .filter(score => !isNaN(score));
        
        if (scores.length > 0) {
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const grade = calculateGrade(average);
            
            row.querySelector('.average-score').textContent = average.toFixed(1);
            row.querySelector('.grade').innerHTML = `<span class="grade-badge grade-${grade.toLowerCase()}">${grade}</span>`;
        }
    }

    // Function to calculate grade
    function calculateGrade(average) {
        if (average >= 90) return 'A+';
        if (average >= 80) return 'A';
        if (average >= 70) return 'B';
        if (average >= 60) return 'C';
        if (average >= 50) return 'D';
        return 'F';
    }

    // Function to save scores
    function saveScores() {
        const selectedClass = classSelect.value;
        const selectedExam = examSelect.value;
        
        if (!selectedClass || !selectedExam) {
            showMessage('Please select both class and exam', 'error');
            return;
        }
        
        const rows = scoreTable.querySelectorAll('tbody tr');
        const results = [];
        
        rows.forEach(row => {
            const studentId = row.dataset.studentId;
            const studentName = row.cells[2].textContent;
            const scoreInputs = row.querySelectorAll('.score-input');
            
            scoreInputs.forEach(input => {
                const score = parseInt(input.value);
                if (!isNaN(score)) {
                    results.push({
                        studentId,
                        studentName,
                        examId: selectedExam,
                        subject: input.dataset.subject,
                        score,
                        date: new Date().toISOString()
                    });
                }
            });
        });
        
        if (results.length > 0) {
            // Save to localStorage
            const existingResults = JSON.parse(localStorage.getItem('results')) || [];
            localStorage.setItem('results', JSON.stringify([...existingResults, ...results]));
            
            showMessage('Scores saved successfully', 'success');
        } else {
            showMessage('No scores to save', 'error');
        }
    }

    // Function to clear table
    function clearTable() {
        const tbody = scoreTable.querySelector('tbody');
        tbody.innerHTML = '';
    }

    // Function to handle search
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = scoreTable.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const studentName = row.cells[2].textContent.toLowerCase();
            const studentId = row.cells[1].textContent.toLowerCase();
            row.style.display = studentName.includes(searchTerm) || studentId.includes(searchTerm) ? '' : 'none';
        });
    }

    // Function to show message
    function showMessage(message, type) {
        const messageContainer = document.getElementById('messageContainer');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        messageContainer.appendChild(messageElement);
        
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }
}); 