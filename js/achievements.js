/**
 * Achievement System — 10 badges unlocked by gameplay milestones.
 * All data persisted in localStorage.
 */
const Achievements = (function () {
    const STORAGE_KEY = 'speedMathAchievements';

    const ALL = [
        { id: 'first_test',    icon: '🎯', title: 'First Step',        desc: 'Complete your first test' },
        { id: 'perfect_score', icon: '⭐', title: 'Perfect Score',      desc: '100% accuracy in any test' },
        { id: 'speed_demon',   icon: '⚡', title: 'Speed Demon',        desc: 'Average under 2s per question' },
        { id: 'streak_3',      icon: '🔥', title: 'On a Roll',          desc: '3-day practice streak' },
        { id: 'streak_7',      icon: '🏆', title: 'Week Warrior',       desc: '7-day practice streak' },
        { id: 'century',       icon: '💯', title: 'Centurion',          desc: 'Complete a 100-question test' },
        { id: 'all_ops',       icon: '🥷', title: 'Math Ninja',         desc: 'Complete a test in all 4 operations' },
        { id: 'extreme',       icon: '🦅', title: 'Extreme Champion',   desc: 'Finish an Extreme difficulty test' },
        { id: 'flawless',      icon: '✨', title: 'Flawless',           desc: 'Perfect score on 20+ questions' },
        { id: 'mixed_master',  icon: '🎲', title: 'Mixed Master',       desc: 'Complete a Mixed mode test' },
    ];

    function getUnlocked() {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    }

    /** Attempts to unlock an achievement. Returns true if it was newly unlocked. */
    function unlock(id) {
        const list = getUnlocked();
        if (list.includes(id)) return false;
        list.push(id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return true;
    }

    /**
     * Check achievements after a test.
     * @param {object} result - The processed test result.
     * @param {object} streak - Current streak object {current, lastDate}.
     * @returns {Array} Newly unlocked achievement objects.
     */
    function check(result, streak) {
        const newly = [];

        const tryUnlock = (id) => {
            if (unlock(id)) newly.push(ALL.find(a => a.id === id));
        };

        tryUnlock('first_test');

        if (result.accuracy === 100)                              tryUnlock('perfect_score');
        if (parseFloat(result.avgSpeed) < 2.0)                   tryUnlock('speed_demon');
        if ((streak?.current || 0) >= 3)                          tryUnlock('streak_3');
        if ((streak?.current || 0) >= 7)                          tryUnlock('streak_7');
        if (result.total >= 100)                                  tryUnlock('century');
        if (result.difficulty === 'extreme')                      tryUnlock('extreme');
        if (result.accuracy === 100 && result.total >= 20)        tryUnlock('flawless');
        if (result.operation === 'mixed')                         tryUnlock('mixed_master');

        // All 4 operations check (across history)
        try {
            const history = JSON.parse(localStorage.getItem('speedMathHistory') || '[]');
            const ops = new Set(history.map(h => h.operation));
            if (['addition', 'subtraction', 'multiplication', 'division'].every(op => ops.has(op))) {
                tryUnlock('all_ops');
            }
        } catch { /* ignore */ }

        return newly.filter(Boolean);
    }

    return {
        check,
        getAll: () => ALL,
        getUnlocked,
        isUnlocked: (id) => getUnlocked().includes(id)
    };
})();
