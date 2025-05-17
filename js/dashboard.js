document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Get DOM elements
    const userName = document.getElementById('userName');
    const currentDate = document.getElementById('currentDate');
    const totalStudents = document.getElementById('totalStudents');
    const totalClasses = document.getElementById('totalClasses');
    const totalExams = document.getElementById('totalExams');
    const averageScore = document.getElementById('averageScore');
    const upcomingExams = document.getElementById('upcomingExams');
    const recentResults = document.getElementById('recentResults');
    const searchInput = document.getElementById('searchInput');

    // Set user name and current date
    userName.textContent = user.name;
    currentDate.textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Load dashboard data
    loadStatistics();
    loadUpcomingExams();
    loadRecentResults();
    initializePerformanceChart();

    // Handle search
    searchInput.addEventListener('input', handleSearch);

    // Function to load statistics
    function loadStatistics() {
        // Get data from localStorage
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const results = JSON.parse(localStorage.getItem('results')) || [];

        // Update statistics
        totalStudents.textContent = students.length;
        totalClasses.textContent = classes.length;
        totalExams.textContent = exams.length;

        // Calculate average score
        const avgScore = results.length > 0
            ? results.reduce((sum, result) => sum + Number(result.score), 0) / results.length
            : 0;
        averageScore.textContent = `${avgScore.toFixed(1)}%`;
    }

    // Function to load upcoming exams
    function loadUpcomingExams() {
        const exams = JSON.parse(localStorage.getItem('exams')) || [];
        const now = new Date();
        
        // Filter and sort upcoming exams
        const upcoming = exams
            .filter(exam => new Date(exam.date) > now)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        // Display upcoming exams
        upcomingExams.innerHTML = upcoming.length > 0
            ? upcoming.map(exam => `
                <div class="exam-item">
                    <div class="exam-info">
                        <h4>${exam.title}</h4>
                        <p>${exam.subject} - ${exam.class}</p>
                    </div>
                    <div class="exam-date">
                        ${new Date(exam.date).toLocaleDateString()}
                    </div>
                </div>
            `).join('')
            : '<p class="no-data">No upcoming exams</p>';
    }

    // Function to load recent results
    function loadRecentResults() {
        const results = JSON.parse(localStorage.getItem('results')) || [];
        
        // Sort results by date (most recent first) and take top 5
        const recent = results
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        // Display recent results
        recentResults.innerHTML = recent.length > 0
            ? recent.map(result => `
                <div class="result-item">
                    <div class="result-info">
                        <h4>${result.studentName}</h4>
                        <p>${result.examTitle} - ${result.subject}</p>
                    </div>
                    <div class="result-score">
                        ${result.score}%
                    </div>
                </div>
            `).join('')
            : '<p class="no-data">No recent results</p>';
    }

    // Function to initialize performance chart
    function initializePerformanceChart() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        const results = JSON.parse(localStorage.getItem('results')) || [];
        
        // Group results by subject and calculate averages
        const subjectAverages = results.reduce((acc, result) => {
            if (!acc[result.subject]) {
                acc[result.subject] = { sum: 0, count: 0 };
            }
            acc[result.subject].sum += Number(result.score);
            acc[result.subject].count++;
            return acc;
        }, {});

        const subjects = Object.keys(subjectAverages);
        const averages = subjects.map(subject => 
            subjectAverages[subject].sum / subjectAverages[subject].count
        );

        // Create chart
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: subjects,
                datasets: [{
                    label: 'Average Score',
                    data: averages,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Score (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Subject'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Function to handle search
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.dashboard-card');

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    // User menu toggle
    const userMenuToggle = document.getElementById('userMenuToggle');
    const userDropdown = document.querySelector('.user-dropdown');
    
    if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener('click', () => {
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!userMenuToggle.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }

    // Update active navigation item
    const currentPage = window.location.pathname.split('/').pop();
    const navItems = document.querySelectorAll('.sidebar-nav a');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.parentElement.classList.add('active');
        } else {
            item.parentElement.classList.remove('active');
        }
    });
}); 