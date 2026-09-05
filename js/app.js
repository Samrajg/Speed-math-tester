/**
 * Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State ---
    let currentView = 'view-home';
    let currentOperation = null;
    let settings = Storage.getSettings();
    
    // Test State
    let testState = {
        isActive: false,
        questions: [],
        currentQIndex: 0,
        score: 0,
        startTime: 0,
        questionStartTime: 0,
        timerInterval: null,
        timeRemaining: 0 // For timed mode
    };

    // --- DOM Elements ---
    const views = document.querySelectorAll('.view');
    const body = document.body;
    const themeMeta = document.getElementById('theme-color-meta');
    
    // Navigation
    const navHome = document.getElementById('nav-home');
    const navStats = document.getElementById('nav-stats');
    const navHistory = document.getElementById('nav-history');
    const navSettings = document.getElementById('nav-settings');
    const navSandbox = document.getElementById('nav-sandbox');
    
    // Setup
    const setupDifficultyBtns = document.querySelectorAll('#setup-difficulty .option-btn');
    const setupQuestionsBtns = document.querySelectorAll('#setup-questions .option-btn');
    const setupTimeBtns = document.querySelectorAll('#setup-time .option-btn');
    
    // Test
    const qText = document.getElementById('question-text');
    const ansInput = document.getElementById('answer-input');
    const btnSubmitAns = document.getElementById('btn-submit-answer');
    
    // Sandbox
    const sbOpSelect = document.getElementById('sandbox-op-select');
    const sbQText = document.getElementById('sb-q-text');
    const sbQAns = document.getElementById('sb-q-answer');
    const btnAddSb = document.getElementById('btn-add-sb');
    const sbList = document.getElementById('sandbox-list');
    
    // --- Initialization ---
    initTheme();
    renderDashboard();
    
    // --- View Navigation ---
    function switchView(viewId) {
        views.forEach(v => v.classList.add('hidden'));
        views.forEach(v => v.classList.remove('active'));
        
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            // Slight delay for animation
            setTimeout(() => target.classList.add('active'), 10);
            currentView = viewId;
        }
    }

    navHome.addEventListener('click', () => {
        if (testState.isActive) {
            if (!confirm('End current test?')) return;
            endTestEarly();
        }
        renderDashboard();
        switchView('view-home');
    });
    
    navStats.addEventListener('click', () => {
        if (testState.isActive) return;
        renderStats();
        switchView('view-stats');
    });
    
    navHistory.addEventListener('click', () => {
        if (testState.isActive) return;
        renderHistory();
        switchView('view-history');
    });
    
    navSandbox.addEventListener('click', () => {
        if (testState.isActive) return;
        renderSandbox();
        switchView('view-sandbox');
    });
    
    navSettings.addEventListener('click', () => {
        if (testState.isActive) return;
        document.getElementById('setting-theme').value = settings.theme;
        switchView('view-settings');
    });

    // --- Home ---
    document.querySelectorAll('.operation-card').forEach(card => {
        card.addEventListener('click', () => {
            currentOperation = card.dataset.operation;
            document.getElementById('setup-title').innerText = `Setup: ${capitalize(currentOperation)}`;
            applySettingsToSetupUI();
            switchView('view-setup');
        });
    });

    // --- Setup ---
    function setupOptionGroup(buttons, settingKey) {
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                settings[settingKey] = btn.dataset.value;
                Storage.saveSettings(settings);
            });
        });
    }
    
    setupOptionGroup(setupDifficultyBtns, 'difficulty');
    setupOptionGroup(setupQuestionsBtns, 'questions');
    setupOptionGroup(setupTimeBtns, 'timeMode');

    function applySettingsToSetupUI() {
        setupDifficultyBtns.forEach(b => b.classList.toggle('selected', b.dataset.value === settings.difficulty));
        setupQuestionsBtns.forEach(b => b.classList.toggle('selected', b.dataset.value === settings.questions));
        setupTimeBtns.forEach(b => b.classList.toggle('selected', b.dataset.value === settings.timeMode));
    }

    document.getElementById('btn-back-home').addEventListener('click', () => switchView('view-home'));
    document.getElementById('btn-start-test').addEventListener('click', startTest);

    // --- Test Logic ---
    function startTest() {
        if (settings.difficulty === 'sandbox') {
            const sb = Storage.getSandbox();
            if (!sb[currentOperation] || sb[currentOperation].length === 0) {
                alert(`No custom questions found for ${capitalize(currentOperation)} in Sandbox mode! Add some first.`);
                return;
            }
        }

        switchView('view-test');
        
        testState = {
            isActive: true,
            operation: currentOperation,
            difficulty: settings.difficulty,
            targetQuestions: parseInt(settings.questions) || 10,
            timeMode: settings.timeMode,
            questions: [],
            currentQIndex: 0,
            score: 0,
            startTime: Date.now()
        };

        document.getElementById('test-q-total').innerText = testState.targetQuestions;
        document.getElementById('test-score-val').innerText = 0;
        
        if (testState.timeMode !== 'untimed') {
            testState.timeRemaining = parseInt(testState.timeMode);
            updateTimerDisplay(testState.timeRemaining);
            testState.timerInterval = setInterval(() => {
                testState.timeRemaining--;
                updateTimerDisplay(testState.timeRemaining);
                if (testState.timeRemaining <= 0) {
                    endTest();
                }
            }, 1000);
        } else {
            document.getElementById('test-timer').innerText = '∞';
        }

        loadNextQuestion();
    }

    function loadNextQuestion() {
        if (testState.currentQIndex >= testState.targetQuestions) {
            endTest();
            return;
        }

        const q = Questions.generate(testState.operation, testState.difficulty);
        testState.currentQuestionData = q;
        testState.questionStartTime = Date.now();
        
        document.getElementById('test-q-num').innerText = testState.currentQIndex + 1;
        qText.innerText = q.text;
        
        ansInput.value = '';
        ansInput.classList.remove('animate-correct', 'animate-incorrect');
        // Force reflow for animation restart
        void ansInput.offsetWidth;
        
        setTimeout(() => ansInput.focus(), 50);
    }

    function submitAnswer() {
        if (!testState.isActive) return;
        
        const val = ansInput.value.trim();
        if (val === '') return;
        
        const userAnswer = parseInt(val, 10);
        const correct = userAnswer === testState.currentQuestionData.answer;
        const responseTime = Date.now() - testState.questionStartTime;
        
        if (correct) {
            testState.score++;
            document.getElementById('test-score-val').innerText = testState.score;
            ansInput.classList.add('animate-correct');
        } else {
            ansInput.classList.add('animate-incorrect');
        }

        testState.questions.push({
            text: testState.currentQuestionData.text,
            expected: testState.currentQuestionData.answer,
            userAnswer: userAnswer,
            isCorrect: correct,
            responseTime: responseTime
        });

        testState.currentQIndex++;
        
        // Small delay for visual feedback before next question
        setTimeout(loadNextQuestion, 200);
    }

    btnSubmitAns.addEventListener('click', submitAnswer);
    ansInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitAnswer();
    });
    
    document.getElementById('btn-end-test').addEventListener('click', () => {
        if (confirm('Are you sure you want to end early?')) endTestEarly();
    });

    function endTestEarly() {
        if (testState.timerInterval) clearInterval(testState.timerInterval);
        testState.isActive = false;
        switchView('view-home');
    }

    function endTest() {
        if (testState.timerInterval) clearInterval(testState.timerInterval);
        testState.isActive = false;
        testState.totalTimeMs = Date.now() - testState.startTime;
        
        if (testState.questions.length === 0) {
            switchView('view-home');
            return;
        }

        const result = Statistics.processTest(testState);
        showResult(result);
    }
    
    function updateTimerDisplay(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        document.getElementById('test-timer').innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // --- Result ---
    function showResult(result) {
        document.getElementById('res-correct').innerText = result.correct;
        document.getElementById('res-total').innerText = result.total;
        document.getElementById('res-accuracy').innerText = `${result.accuracy}% Accuracy`;
        
        document.getElementById('res-avg-speed').innerText = result.avgSpeed;
        document.getElementById('res-fastest').innerText = result.fastest;
        document.getElementById('res-total-time').innerText = `${result.totalTime}s`;
        document.getElementById('res-qpm').innerText = result.qpm;
        
        let msg = "Keep practicing!";
        if (result.accuracy >= 95 && result.avgSpeed < 3) msg = "Excellent! 🔥";
        else if (result.accuracy >= 80) msg = "Great job! 👍";
        document.getElementById('res-message').innerText = msg;
        
        switchView('view-result');
    }

    document.getElementById('btn-play-again').addEventListener('click', startTest);
    document.getElementById('btn-change-mode').addEventListener('click', () => switchView('view-setup'));

    // --- History ---
    function renderHistory() {
        const list = document.getElementById('history-list');
        list.innerHTML = '';
        const history = Storage.getHistory();
        
        if (history.length === 0) {
            list.innerHTML = '<p>No history yet. Start practicing!</p>';
            return;
        }
        
        history.forEach(item => {
            const date = new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-main">
                    <span class="history-title">${capitalize(item.operation)} - ${capitalize(item.difficulty)}</span>
                    <span class="history-date">${date}</span>
                </div>
                <div class="history-score">
                    <div class="history-score-val">${item.correct}/${item.total} (${item.accuracy}%)</div>
                    <div class="history-speed">${item.avgSpeed}s avg</div>
                </div>
            `;
            list.appendChild(div);
        });
    }

    document.getElementById('btn-clear-history').addEventListener('click', () => {
        if (confirm('Clear all practice history? This cannot be undone.')) {
            Storage.clearHistory();
            renderHistory();
        }
    });

    // --- Settings & Dashboard ---
    document.getElementById('setting-theme').addEventListener('change', (e) => {
        settings.theme = e.target.value;
        Storage.saveSettings(settings);
        applyTheme();
    });

    function initTheme() {
        applyTheme();
    }
    
    function applyTheme() {
        if (settings.theme === 'dark') {
            body.classList.replace('theme-light', 'theme-dark');
            themeMeta.setAttribute('content', '#0f172a');
        } else {
            body.classList.replace('theme-dark', 'theme-light');
            themeMeta.setAttribute('content', '#ffffff');
        }
    }

    function renderDashboard() {
        const stats = Statistics.getTodayStats();
        const streak = Storage.getStreak();
        
        const html = `
            <h3>Today's Progress</h3>
            <div class="result-stats-grid" style="margin-top: 1rem;">
                <div class="stat-box">
                    <div class="stat-label">Tests</div>
                    <div class="stat-value">${stats.tests}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Questions</div>
                    <div class="stat-value">${stats.totalQ}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Accuracy</div>
                    <div class="stat-value">${stats.accuracy}%</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Streak</div>
                    <div class="stat-value">🔥 ${streak.current}</div>
                </div>
            </div>
        `;
        document.getElementById('dashboard-summary').innerHTML = html;
    }

    function renderStats() {
        const container = document.getElementById('stats-container');
        const bests = Storage.getBests();
        container.innerHTML = '';
        
        if (Object.keys(bests).length === 0) {
            container.innerHTML = '<p>No personal bests yet.</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'operations-grid'; // reuse grid style
        
        for (const [key, val] of Object.entries(bests)) {
            const [op, diff] = key.split('_');
            const card = document.createElement('div');
            card.className = 'stat-box';
            card.style.border = '1px solid var(--border-color)';
            card.innerHTML = `
                <div class="stat-label" style="font-weight:bold; color:var(--text-primary); margin-bottom: 1rem; border-bottom:1px solid var(--border-color); padding-bottom: 0.5rem;">
                    ${capitalize(op)} - ${capitalize(diff)}
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                    <span class="stat-label">Best Accuracy</span>
                    <span class="stat-value" style="font-size:1rem">${val.accuracy}%</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                    <span class="stat-label">Fastest Avg</span>
                    <span class="stat-value" style="font-size:1rem">${val.fastestAvg}s</span>
                </div>
            `;
            grid.appendChild(card);
        }
        container.appendChild(grid);
    }

    // --- Sandbox UI Logic ---
    function renderSandbox() {
        const op = sbOpSelect.value;
        const sb = Storage.getSandbox();
        const list = sb[op] || [];
        
        sbList.innerHTML = '';
        if (list.length === 0) {
            sbList.innerHTML = '<p>No custom questions added for this operation yet.</p>';
            return;
        }
        
        list.forEach((q, idx) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-main">
                    <span class="history-title">${q.text}</span>
                </div>
                <div class="history-score" style="display:flex; gap: 1rem; align-items:center;">
                    <div class="history-score-val">Ans: ${q.answer}</div>
                    <button class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;" data-idx="${idx}">Delete</button>
                </div>
            `;
            sbList.appendChild(div);
        });
        
        // Add delete listeners
        sbList.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.idx;
                Storage.removeSandboxQuestion(op, idx);
                renderSandbox();
            });
        });
    }

    sbOpSelect.addEventListener('change', renderSandbox);

    btnAddSb.addEventListener('click', () => {
        const text = sbQText.value.trim();
        const ans = parseInt(sbQAns.value, 10);
        if (!text || isNaN(ans)) {
            alert('Please enter a valid question and numerical answer.');
            return;
        }
        Storage.addSandboxQuestion(sbOpSelect.value, { text: text, answer: ans });
        sbQText.value = '';
        sbQAns.value = '';
        renderSandbox();
    });

    // Utils
    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
