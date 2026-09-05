/**
 * Local Storage Management
 */

const Storage = (function() {
    const KEYS = {
        SETTINGS: 'speedMathSettings',
        HISTORY: 'speedMathHistory',
        STATS: 'speedMathStats',
        BESTS: 'speedMathBestScores',
        STREAK: 'speedMathStreak'
    };

    const DEFAULT_SETTINGS = {
        theme: 'light',
        difficulty: 'easy',
        questions: '10',
        timeMode: 'untimed'
    };

    function get(key, defaultValue) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : defaultValue;
        } catch (e) {
            console.error(`Error reading ${key} from localStorage`, e);
            return defaultValue;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error(`Error writing ${key} to localStorage`, e);
        }
    }

    return {
        getSettings: () => get(KEYS.SETTINGS, DEFAULT_SETTINGS),
        saveSettings: (settings) => set(KEYS.SETTINGS, settings),
        
        getHistory: () => get(KEYS.HISTORY, []),
        saveTestToHistory: (testResult) => {
            const history = get(KEYS.HISTORY, []);
            history.unshift(testResult); // Add to beginning
            // Keep only last 100 to avoid bloat
            if (history.length > 100) history.pop();
            set(KEYS.HISTORY, history);
        },
        clearHistory: () => set(KEYS.HISTORY, []),

        getBests: () => get(KEYS.BESTS, {}),
        saveBests: (bests) => set(KEYS.BESTS, bests),

        getStreak: () => get(KEYS.STREAK, { current: 0, lastDate: null }),
        saveStreak: (streak) => set(KEYS.STREAK, streak)
    };
})();
