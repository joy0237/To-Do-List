document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskButton = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const filters = document.querySelectorAll('.filter');
    const themeToggle = document.getElementById('theme-toggle');
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const voiceCommandBtn = document.getElementById('voice-command');
    const streakDisplay = document.getElementById('streaks');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let streak = parseInt(localStorage.getItem('streak')) || 0;
    let currentFilter = 'all';

    // Load tasks and streaks
    updateProgress();
    streakDisplay.textContent = `🔥 Streak: ${streak} Days`;
    tasks.forEach(task => addTaskElement(task));

    // Theme toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // Add new task
    addTaskButton.addEventListener('click', () => {
        const taskText = taskInput.value.trim();
        if (taskText) {
            const parsedTask = parseTaskInput(taskText);
            tasks.push(parsedTask);
            addTaskElement(parsedTask);
            saveTasks();
            taskInput.value = '';
            updateProgress();
        }
    });

    // Add task via voice command
    voiceCommandBtn.addEventListener('click', () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.onresult = function(event) {
            const voiceInput = event.results[0][0].transcript;
            const parsedTask = parseTaskInput(voiceInput);
            tasks.push(parsedTask);
            addTaskElement(parsedTask);
            saveTasks();
            updateProgress();
        };
        recognition.start();
    });

    // Add task to DOM
    function addTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.innerHTML = `
            <span>${task.text}</span>
            <button>Delete</button>
        `;
        taskItem.classList.add(determinePriority(task.dueDate));
        if (task.completed) taskItem.classList.add('completed');

        // Mark task as completed
        taskItem.addEventListener('click', () => {
            task.completed = !task.completed;
            taskItem.classList.toggle('completed');
            saveTasks();
            updateProgress();
        });

        // Delete task
        taskItem.querySelector('button').addEventListener('click', e => {
            e.stopPropagation();
            tasks = tasks.filter(t => t !== task);
            taskItem.remove();
            saveTasks();
            updateProgress();
        });

        taskList.appendChild(taskItem);
    }

    // Parse natural language input
    function parseTaskInput(text) {
        const regex = /(.+)(tomorrow|at (\d{1,2}(?:AM|PM)?))/;
        const match = text.match(regex);
        let dueDate = null;

        if (match) {
            dueDate = match[2] === 'tomorrow' ? new Date(Date.now() + 86400000) : new Date();
        }
        
        return { text, completed: false, dueDate };
    }

    // Determine task priority
    function determinePriority(dueDate) {
        const now = new Date();
        if (dueDate) {
            const timeDiff = (new Date(dueDate) - now) / (1000 * 60 * 60 * 24);
            if (timeDiff <= 1) return 'priority-today';
            if (timeDiff <= 3) return 'priority-upcoming';
        }
        return '';
    }

    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Update progress and streaks
    function updateProgress() {
        const completedTasks = tasks.filter(t => t.completed).length;
        const progress = Math.floor((completedTasks / tasks.length) * 100);
        progressBar.style.width = `${progress}%`;
        progressPercentage.textContent = `${progress || 0}%`;

        if (completedTasks === tasks.length && tasks.length > 0) {
            streak++;
            streakDisplay.textContent = `🔥 Streak: ${streak} Days`;
            localStorage.setItem('streak', streak);
        }
    }

    // Filter tasks
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            filters.forEach(btn => btn.classList.remove('active'));
            filter.classList.add('active');
            currentFilter = filter.dataset.filter;
            renderTasks();
        });
    });

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach(task => {
            if (currentFilter === 'all' ||
                (currentFilter === 'active' && !task.completed) ||
                (currentFilter === 'completed' && task.completed) ||
                (currentFilter === 'today' && task.dueDate && determinePriority(task.dueDate) === 'priority-today')) {
                addTaskElement(task);
            }
        });
    }

    renderTasks();
});
