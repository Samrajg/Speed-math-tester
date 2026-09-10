/**
 * Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── State ──────────────────────────────────────────────────────────────────
    let currentView      = 'view-home';
    let currentOperation = null;
    let settings         = Storage.getSettings();

    let testState = {
        isActive: false, questions: [], currentQIndex: 0, score: 0,
        startTime: 0, questionStartTime: 0, timerInterval: null, timeRemaining: 0
    };

    // ── DOM Refs ───────────────────────────────────────────────────────────────
    const views    = document.querySelectorAll('.view');
    const body     = document.body;
    const themeMeta = document.getElementById('theme-color-meta');

    // Navigation
    const navHome         = document.getElementById('nav-home');
    const navStats        = document.getElementById('nav-stats');
    const navHistory      = document.getElementById('nav-history');
    const navSettings     = document.getElementById('nav-settings');
    const navSandbox      = document.getElementById('nav-sandbox');
    const navAchievements = document.getElementById('nav-achievements');

    // Setup
    const setupSourceBtns     = document.querySelectorAll('#setup-source .option-btn');
    const setupDifficultyBtns = document.querySelectorAll('#setup-difficulty .option-btn');
    const setupQuestionsBtns  = document.querySelectorAll('#setup-questions .option-btn');
    const setupTimeBtns       = document.querySelectorAll('#setup-time .option-btn');

    // Test
    const qText       = document.getElementById('question-text');
    const ansInput    = document.getElementById('answer-input');
    const btnSubmit   = document.getElementById('btn-submit-answer');
    const qTimerFill  = document.getElementById('q-timer-fill');

    // Sandbox
    const sbOpSelect  = document.getElementById('sandbox-op-select');
    const sbDiffSelect = document.getElementById('sandbox-diff-select');
    const sbQText     = document.getElementById('sb-q-text');
    const sbQAns      = document.getElementById('sb-q-answer');
    const btnAddSb    = document.getElementById('btn-add-sb');
    const sbList      = document.getElementById('sandbox-list');

    // ── Init ───────────────────────────────────────────────────────────────────
    initTheme();
    applySettingsToUI();
    renderDashboard();

    // ── View Navigation ────────────────────────────────────────────────────────
    function switchView(viewId) {
        views.forEach(v => { v.classList.add('hidden'); v.classList.remove('active'); });
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            setTimeout(() => target.classList.add('active'), 10);
            currentView = viewId;
        }
    }

    navHome.addEventListener('click', async () => {
        if (testState.isActive) {
            const ok = await Modal.confirm('End the current test?');
            if (!ok) return;
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
        renderHistory('all');
        switchView('view-history');
    });

    navSandbox.addEventListener('click', () => {
        if (testState.isActive) return;
        renderSandbox();
        switchView('view-sandbox');
    });

    navAchievements.addEventListener('click', () => {
        if (testState.isActive) return;
        renderAchievements();
        switchView('view-achievements');
    });

    navSettings.addEventListener('click', () => {
        if (testState.isActive) return;
        applySettingsToUI();
        switchView('view-settings');
    });

    // ── Home ───────────────────────────────────────────────────────────────────
    document.querySelectorAll('.operation-card').forEach(card => {
        card.addEventListener('click', () => {
            currentOperation = card.dataset.operation;
            const label = currentOperation === 'mixed' ? 'Mixed Mode' : `Setup: ${cap(currentOperation)}`;
            document.getElementById('setup-title').textContent = label;

            // Hide sandbox option for mixed mode (sandbox mixed not supported)
            document.getElementById('setup-source').querySelectorAll('[data-value="sandbox"]').forEach(b => {
                b.style.display = currentOperation === 'mixed' ? 'none' : '';
            });

            applySettingsToSetupUI();
            switchView('view-setup');
        });
    });

    // ── Setup ──────────────────────────────────────────────────────────────────
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

    setupOptionGroup(setupSourceBtns, 'source');
    setupOptionGroup(setupDifficultyBtns, 'difficulty');
    setupOptionGroup(setupQuestionsBtns, 'questions');
    setupOptionGroup(setupTimeBtns, 'timeMode');

    function applySettingsToSetupUI() {
        setupSourceBtns.forEach(b     => b.classList.toggle('selected', b.dataset.value === settings.source));
        setupDifficultyBtns.forEach(b => b.classList.toggle('selected', b.dataset.value === settings.difficulty));
        setupQuestionsBtns.forEach(b  => b.classList.toggle('selected', b.dataset.value === settings.questions));
        setupTimeBtns.forEach(b       => b.classList.toggle('selected', b.dataset.value === settings.timeMode));
    }

    document.getElementById('btn-back-home').addEventListener('click', () => switchView('view-home'));
    document.getElementById('btn-start-test').addEventListener('click', startTest);

    // ── Test Logic ─────────────────────────────────────────────────────────────
    function startTest() {
        if (settings.source === 'sandbox' && currentOperation !== 'mixed') {
            const sb   = Storage.getSandbox();
            const list = sb[currentOperation]?.[settings.difficulty] || [];
            if (list.length === 0) {
                Modal.alert(`No custom questions for ${cap(currentOperation)} (${cap(settings.difficulty)}). Add some in Sandbox first.`);
                return;
            }
        }

        switchView('view-test');
        Questions.resetSession();

        testState = {
            isActive:        true,
            operation:       currentOperation,
            difficulty:      settings.difficulty,
            source:          settings.source,
            targetQuestions: parseInt(settings.questions) || 10,
            timeMode:        settings.timeMode,
            questions:       [],
            currentQIndex:   0,
            score:           0,
            startTime:       Date.now()
        };

        document.getElementById('test-q-total').textContent = testState.targetQuestions;
        document.getElementById('test-score-val').textContent = 0;
        document.getElementById('test-timer').textContent = testState.timeMode === 'untimed' ? '∞' : testState.timeMode;

        const ansContainer = document.querySelector('.answer-container');
        const qTimerBar = document.getElementById('q-timer-bar');
        
        ansContainer.style.visibility = 'hidden';
        qTimerBar.style.visibility = 'hidden';
        
        let countdown = 3;
        qText.textContent = countdown;
        qText.style.fontSize = '4rem';
        document.getElementById('test-q-num').textContent = '-';

        testState.timerInterval = setInterval(() => {
            if (!testState.isActive) {
                clearInterval(testState.timerInterval);
                qText.style.fontSize = '';
                ansContainer.style.visibility = 'visible';
                qTimerBar.style.visibility = 'visible';
                return;
            }
            countdown--;
            if (countdown > 0) {
                qText.textContent = countdown;
            } else if (countdown === 0) {
                qText.textContent = 'GO!';
            } else {
                clearInterval(testState.timerInterval);
                qText.style.fontSize = '';
                ansContainer.style.visibility = 'visible';
                qTimerBar.style.visibility = 'visible';
                
                testState.startTime = Date.now();
                
                if (testState.timeMode !== 'untimed') {
                    testState.timeRemaining = parseInt(testState.timeMode);
                    updateTimerDisplay(testState.timeRemaining);
                    testState.timerInterval = setInterval(() => {
                        if (!testState.isActive) return;
                        testState.timeRemaining--;
                        updateTimerDisplay(testState.timeRemaining);
                        // Tick sound for last 5 seconds
                        if (testState.timeRemaining <= 5 && testState.timeRemaining > 0) Sounds.tick();
                        if (testState.timeRemaining <= 0) endTest();
                    }, 1000);
                }
                
                loadNextQuestion();
            }
        }, 1000);
    }

    function loadNextQuestion() {
        if (testState.currentQIndex >= testState.targetQuestions) { endTest(); return; }

        const q = Questions.generate(testState.operation, testState.difficulty, testState.source);
        testState.currentQuestionData = q;
        testState.questionStartTime   = Date.now();

        document.getElementById('test-q-num').textContent = testState.currentQIndex + 1;
        qText.textContent = q.text;

        ansInput.value = '';
        ansInput.classList.remove('animate-correct', 'animate-incorrect');
        void ansInput.offsetWidth; // force reflow for animation restart

        startTimerBar();
        setTimeout(() => ansInput.focus(), 50);
    }

    // ── Per-question visual timer bar ──────────────────────────────────────────
    function startTimerBar() {
        if (!qTimerFill) return;
        qTimerFill.style.transition = 'none';
        qTimerFill.style.transform  = 'scaleX(0)';
        qTimerFill.className = 'q-timer-bar-fill';
        void qTimerFill.offsetWidth;
        qTimerFill.style.transition = '';
        qTimerFill.classList.add('q-animating');
    }

    // ── Answer submission ──────────────────────────────────────────────────────
    function submitAnswer(skipped = false) {
        if (!testState.isActive) return;

        const val = skipped ? '' : ansInput.value.trim();
        if (!skipped && val === '') return;

        const userAnswer   = skipped ? null : parseFloat(val);
        const isDecimal    = !skipped && testState.currentQuestionData.answer % 1 !== 0;
        const correct      = !skipped && (isDecimal 
                                ? Math.abs(userAnswer - testState.currentQuestionData.answer) < 0.001 
                                : userAnswer === testState.currentQuestionData.answer);
        const responseTime = Date.now() - testState.questionStartTime;

        if (correct) {
            testState.score++;
            document.getElementById('test-score-val').textContent = testState.score;
            ansInput.classList.add('animate-correct');
            Sounds.correct();
        } else {
            ansInput.classList.add('animate-incorrect');
            Sounds.wrong();
        }

        testState.questions.push({
            text:         testState.currentQuestionData.text,
            expected:     testState.currentQuestionData.answer,
            userAnswer:   skipped ? '—' : userAnswer,
            isCorrect:    correct,
            skipped,
            responseTime
        });

        testState.currentQIndex++;

        const delay = settings.autoAdvance ? 80 : 220;
        setTimeout(loadNextQuestion, delay);
    }

    // Auto-advance: if setting is on, auto-submit when user types the correct answer
    ansInput.addEventListener('input', () => {
        if (!settings.autoAdvance || !testState.isActive) return;
        const val = parseFloat(ansInput.value);
        if (isNaN(val)) return;
        
        const isDecimal = testState.currentQuestionData?.answer % 1 !== 0;
        const correct = isDecimal 
            ? Math.abs(val - testState.currentQuestionData?.answer) < 0.001 
            : val === testState.currentQuestionData?.answer;
            
        if (correct) {
            submitAnswer();
        }
    });

    btnSubmit.addEventListener('click', () => submitAnswer());
    ansInput.addEventListener('keypress', e => { if (e.key === 'Enter') submitAnswer(); });

    document.getElementById('btn-skip-question').addEventListener('click', () => submitAnswer(true));

    document.getElementById('btn-end-test').addEventListener('click', async () => {
        const ok = await Modal.confirm('End the test early?');
        if (ok) endTestEarly();
    });

    function endTestEarly() {
        if (testState.timerInterval) clearInterval(testState.timerInterval);
        testState.isActive = false;
        switchView('view-home');
    }

    function endTest() {
        if (testState.timerInterval) clearInterval(testState.timerInterval);
        testState.isActive  = false;
        testState.totalTimeMs = Date.now() - testState.startTime;

        if (testState.questions.length === 0) { switchView('view-home'); return; }

        Sounds.complete();

        const { result, isNewPB, newAchievements } = Statistics.processTest(testState);
        showResult(result, isNewPB, newAchievements);
    }

    function updateTimerDisplay(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        document.getElementById('test-timer').textContent =
            `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // ── Result ─────────────────────────────────────────────────────────────────
    function showResult(result, isNewPB = false, newAchievements = []) {
        document.getElementById('res-correct').textContent   = result.correct;
        document.getElementById('res-total').textContent     = result.total;
        document.getElementById('res-accuracy').textContent  = `${result.accuracy}% Accuracy`;
        document.getElementById('res-avg-speed').textContent = result.avgSpeed;
        document.getElementById('res-fastest').textContent   = result.fastest;
        document.getElementById('res-total-time').textContent = `${result.totalTime}s`;
        document.getElementById('res-qpm').textContent       = result.qpm;

        let msg = 'Keep practicing!';
        if (result.accuracy >= 95 && parseFloat(result.avgSpeed) < 3) msg = 'Excellent! 🔥';
        else if (result.accuracy >= 80) msg = 'Great job! 👍';
        document.getElementById('res-message').textContent = msg;

        // Personal best banner
        document.getElementById('pb-banner').classList.toggle('hidden', !isNewPB);

        // Render wrong-answer review
        renderReviewList(testState.questions);

        switchView('view-result');

        // Achievement toasts (staggered)
        newAchievements.forEach((a, i) => {
            setTimeout(() => {
                Toast.show(`${a.icon} <strong>Achievement Unlocked:</strong> ${a.title}`, 4000);
            }, i * 800);
        });
    }

    function renderReviewList(questions) {
        const list = document.getElementById('review-list');
        list.innerHTML = '';
        questions.forEach((q, i) => {
            const div = document.createElement('div');
            div.className = `review-item ${q.isCorrect ? 'review-correct' : 'review-wrong'}`;
            const icon     = q.skipped ? '⏭️' : q.isCorrect ? '✅' : '❌';
            const time     = (q.responseTime / 1000).toFixed(1);
            const expected = q.skipped ? `Skipped (ans: ${q.expected})` : q.isCorrect ? '' : `Your answer: <strong>${q.userAnswer}</strong> — Correct: <strong>${q.expected}</strong>`;
            div.innerHTML = `
                <span class="review-icon">${icon}</span>
                <div class="review-body">
                    <span class="review-q">${i + 1}. ${q.text}</span>
                    ${expected ? `<span class="review-ans">${expected}</span>` : ''}
                </div>
                <span class="review-time">${time}s</span>
            `;
            list.appendChild(div);
        });
    }

    document.getElementById('btn-review-toggle').addEventListener('click', function () {
        const list    = document.getElementById('review-list');
        const isHidden = list.classList.toggle('hidden');
        this.textContent = isHidden ? 'Review Answers ▼' : 'Hide Review ▲';
    });

    document.getElementById('btn-play-again').addEventListener('click', startTest);
    document.getElementById('btn-change-mode').addEventListener('click', () => switchView('view-setup'));

    // ── History ────────────────────────────────────────────────────────────────
    let historyFilter = 'all';

    document.querySelectorAll('.history-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            historyFilter = btn.dataset.op;
            renderHistory(historyFilter);
        });
    });

    function renderHistory(filter = 'all') {
        const list    = document.getElementById('history-list');
        const history = Storage.getHistory();
        const filtered = filter === 'all' ? history : history.filter(h => h.operation === filter);

        list.innerHTML = '';
        if (filtered.length === 0) {
            list.innerHTML = '<p>No history here yet. Start practicing!</p>';
            return;
        }

        filtered.forEach(item => {
            const date = new Date(item.date).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-main">
                    <span class="history-title">${cap(item.operation)} - ${cap(item.difficulty)}</span>
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

    document.getElementById('btn-clear-history').addEventListener('click', async () => {
        const ok = await Modal.confirm('Clear all practice history? This cannot be undone.');
        if (ok) { Storage.clearHistory(); renderHistory('all'); }
    });

    // ── Statistics ─────────────────────────────────────────────────────────────
    function renderStats() {
        const container = document.getElementById('stats-container');
        const bests     = Storage.getBests();
        container.innerHTML = '';

        if (Object.keys(bests).length === 0) {
            container.innerHTML = '<p>No personal bests yet. Complete a test to start tracking!</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'operations-grid';

        for (const [key, val] of Object.entries(bests)) {
            const [op, diff] = key.split('_');
            const card = document.createElement('div');
            card.className = 'stat-box';
            card.style.cssText = 'border: 1px solid var(--border-color);';
            card.innerHTML = `
                <div class="stat-label" style="font-weight:700; color:var(--text-primary); margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.5rem;">
                    ${cap(op)} — ${cap(diff)}
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                    <span class="stat-label">Best Accuracy</span>
                    <span class="stat-value" style="font-size:1rem">${val.accuracy}%</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem">
                    <span class="stat-label">Fastest Avg</span>
                    <span class="stat-value" style="font-size:1rem">${val.fastestAvg}s</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span class="stat-label">Best Score</span>
                    <span class="stat-value" style="font-size:1rem">${val.maxScore}</span>
                </div>
            `;
            grid.appendChild(card);
        }
        container.appendChild(grid);
    }

    // ── Sandbox ────────────────────────────────────────────────────────────────
    function renderSandbox() {
        const op   = sbOpSelect.value;
        const diff = sbDiffSelect.value;
        const sb   = Storage.getSandbox();
        const list = sb[op]?.[diff] || [];

        sbList.innerHTML = '';
        if (list.length === 0) {
            sbList.innerHTML = `<p>No custom questions for ${cap(op)} — ${cap(diff)} yet.</p>`;
            return;
        }

        list.forEach((q, idx) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-main"><span class="history-title">${q.text}</span></div>
                <div class="history-score" style="display:flex; gap:1rem; align-items:center;">
                    <div class="history-score-val">Ans: ${q.answer}</div>
                    <button class="btn-danger" style="padding:0.25rem 0.75rem; font-size:0.85rem;" data-idx="${idx}">Delete</button>
                </div>
            `;
            sbList.appendChild(div);
        });

        sbList.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', e => {
                Storage.removeSandboxQuestion(op, diff, parseInt(e.target.dataset.idx, 10));
                renderSandbox();
            });
        });
    }

    sbOpSelect.addEventListener('change', renderSandbox);
    sbDiffSelect.addEventListener('change', renderSandbox);

    btnAddSb.addEventListener('click', async () => {
        const text = sbQText.value.trim();
        const ans  = parseInt(sbQAns.value, 10);
        if (!text || isNaN(ans)) {
            await Modal.alert('Please enter a valid question text and a numeric answer.');
            return;
        }
        Storage.addSandboxQuestion(sbOpSelect.value, sbDiffSelect.value, { text, answer: ans });
        sbQText.value = '';
        sbQAns.value  = '';
        renderSandbox();
    });

    // ── Achievements ───────────────────────────────────────────────────────────
    function renderAchievements() {
        const grid    = document.getElementById('achievements-grid');
        const all     = Achievements.getAll();
        const unlocked = Achievements.getUnlocked();
        grid.innerHTML = '';

        all.forEach(a => {
            const isUnlocked = unlocked.includes(a.id);
            const div = document.createElement('div');
            div.className = `achievement-card${isUnlocked ? ' unlocked' : ' locked'}`;
            div.innerHTML = `
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-title">${a.title}</div>
                <div class="achievement-desc">${a.desc}</div>
                ${isUnlocked ? '<div class="achievement-badge">✅ Unlocked</div>' : '<div class="achievement-badge locked-badge">🔒 Locked</div>'}
            `;
            grid.appendChild(div);
        });
    }

    // ── Settings ───────────────────────────────────────────────────────────────
    function applySettingsToUI() {
        document.getElementById('setting-theme').value              = settings.theme;
        document.getElementById('setting-sound').checked            = settings.sound !== false;
        document.getElementById('setting-auto-advance').checked     = !!settings.autoAdvance;
    }

    document.getElementById('setting-theme').addEventListener('change', e => {
        settings.theme = e.target.value;
        Storage.saveSettings(settings);
        applyTheme();
    });

    document.getElementById('setting-sound').addEventListener('change', e => {
        settings.sound = e.target.checked;
        Storage.saveSettings(settings);
    });

    document.getElementById('setting-auto-advance').addEventListener('change', e => {
        settings.autoAdvance = e.target.checked;
        Storage.saveSettings(settings);
    });

    function initTheme()  { applyTheme(); }
    function applyTheme() {
        if (settings.theme === 'dark') {
            body.classList.replace('theme-light', 'theme-dark');
            themeMeta.setAttribute('content', '#0f172a');
        } else {
            body.classList.replace('theme-dark', 'theme-light');
            themeMeta.setAttribute('content', '#ffffff');
        }
    }

    // ── Dashboard ──────────────────────────────────────────────────────────────
    function renderDashboard() {
        const stats  = Statistics.getTodayStats();
        const streak = Storage.getStreak();
        document.getElementById('dashboard-summary').innerHTML = `
            <h3>Today's Progress</h3>
            <div class="result-stats-grid" style="margin-top:1rem;">
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
    }

    // ── Utility ────────────────────────────────────────────────────────────────
    function cap(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
});
