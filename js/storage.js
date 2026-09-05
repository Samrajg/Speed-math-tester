/**
 * Local Storage Management
 */

const Storage = (function() {
    const KEYS = {
        SETTINGS: 'speedMathSettings',
        HISTORY: 'speedMathHistory',
        STATS: 'speedMathStats',
        BESTS: 'speedMathBestScores',
        STREAK: 'speedMathStreak',
        SANDBOX: 'speedMathSandbox'
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

    function getEmptySandbox() {
        return {
            addition: { easy: [], medium: [], hard: [], extreme: [] },
            subtraction: { easy: [], medium: [], hard: [], extreme: [] },
            multiplication: { easy: [], medium: [], hard: [], extreme: [] },
            division: { easy: [], medium: [], hard: [], extreme: [] }
        };
    }

    return {
        getSettings: () => get(KEYS.SETTINGS, DEFAULT_SETTINGS),
        saveSettings: (settings) => set(KEYS.SETTINGS, settings),
        
        getHistory: () => get(KEYS.HISTORY, []),
        saveTestToHistory: (testResult) => {
            const history = get(KEYS.HISTORY, []);
            history.unshift(testResult); // Add to beginning
            if (history.length > 100) history.pop();
            set(KEYS.HISTORY, history);
        },
        clearHistory: () => set(KEYS.HISTORY, []),

        getBests: () => get(KEYS.BESTS, {}),
        saveBests: (bests) => set(KEYS.BESTS, bests),

        getStreak: () => get(KEYS.STREAK, { current: 0, lastDate: null }),
        saveStreak: (streak) => set(KEYS.STREAK, streak),
        
        getSandbox: () => {
            let data = get(KEYS.SANDBOX, getEmptySandbox());
            // Migration for old array structure
            if (Array.isArray(data.addition)) {
                const oldAdd = data.addition;
                data = getEmptySandbox();
                data.addition.easy = oldAdd;
                set(KEYS.SANDBOX, data);
            }
            
            // Default injections if empty
            if (data.addition.easy.length === 0 && typeof DEFAULT_ADDITION_SANDBOX !== 'undefined') {
                data.addition.easy = DEFAULT_ADDITION_SANDBOX;
                set(KEYS.SANDBOX, data);
            }
            if (data.addition.medium.length === 0 && typeof DEFAULT_ADDITION_SANDBOX_MEDIUM !== 'undefined') {
                data.addition.medium = DEFAULT_ADDITION_SANDBOX_MEDIUM;
                set(KEYS.SANDBOX, data);
            }
            if (data.addition.hard.length === 0 && typeof DEFAULT_ADDITION_SANDBOX_HARD !== 'undefined') {
                data.addition.hard = DEFAULT_ADDITION_SANDBOX_HARD;
                set(KEYS.SANDBOX, data);
            }
            if (data.subtraction.easy.length === 0 && typeof DEFAULT_SUBTRACTION_SANDBOX_EASY !== 'undefined') {
                data.subtraction.easy = DEFAULT_SUBTRACTION_SANDBOX_EASY;
                set(KEYS.SANDBOX, data);
            }
            
            return data;
        },
        saveSandbox: (sandbox) => set(KEYS.SANDBOX, sandbox),
        addSandboxQuestion: (op, diff, question) => {
            const sb = Storage.getSandbox();
            if (!sb[op]) sb[op] = { easy: [], medium: [], hard: [], extreme: [] };
            if (!sb[op][diff]) sb[op][diff] = [];
            sb[op][diff].push(question);
            set(KEYS.SANDBOX, sb);
        },
        removeSandboxQuestion: (op, diff, index) => {
            const sb = Storage.getSandbox();
            if (sb[op] && sb[op][diff] && sb[op][diff][index]) {
                sb[op][diff].splice(index, 1);
                set(KEYS.SANDBOX, sb);
            }
        }
    };
})();
