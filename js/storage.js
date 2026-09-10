/**
 * Local Storage Management
 */

const Storage = (function () {
    const KEYS = {
        SETTINGS: 'speedMathSettings',
        HISTORY:  'speedMathHistory',
        BESTS:    'speedMathBestScores',
        STREAK:   'speedMathStreak',
        SANDBOX:  'speedMathSandbox'
    };

    const DEFAULT_SETTINGS = {
        theme:       'light',
        difficulty:  'easy',
        questions:   '10',
        timeMode:    'untimed',
        source:      'auto',
        sound:       true,
        autoAdvance: false
    };

    // ── Compact inline seed data (replaces 73 KB of static files) ─────────────
    const DEFAULT_SANDBOX = {
        addition: {
            easy:    [{text:'12 + 15 = ?',answer:27},{text:'23 + 14 = ?',answer:37},{text:'31 + 16 = ?',answer:47},{text:'42 + 17 = ?',answer:59},{text:'25 + 13 = ?',answer:38}],
            medium:  [{text:'45 + 67 = ?',answer:112},{text:'83 + 49 = ?',answer:132},{text:'76 + 58 = ?',answer:134},{text:'91 + 65 = ?',answer:156},{text:'53 + 78 = ?',answer:131}],
            hard:    [{text:'234 + 567 = ?',answer:801},{text:'489 + 312 = ?',answer:801},{text:'671 + 248 = ?',answer:919},{text:'345 + 678 = ?',answer:1023},{text:'512 + 389 = ?',answer:901}],
            extreme: [{text:'2345 + 6789 = ?',answer:9134},{text:'4812 + 3967 = ?',answer:8779},{text:'7654 + 2891 = ?',answer:10545},{text:'3219 + 5678 = ?',answer:8897},{text:'6123 + 4587 = ?',answer:10710}]
        },
        subtraction: {
            easy:    [{text:'25 − 12 = ?',answer:13},{text:'47 − 23 = ?',answer:24},{text:'38 − 15 = ?',answer:23},{text:'50 − 27 = ?',answer:23},{text:'43 − 18 = ?',answer:25}],
            medium:  [{text:'145 − 67 = ?',answer:78},{text:'203 − 89 = ?',answer:114},{text:'178 − 93 = ?',answer:85},{text:'256 − 134 = ?',answer:122},{text:'312 − 145 = ?',answer:167}],
            hard:    [{text:'756 − 389 = ?',answer:367},{text:'912 − 578 = ?',answer:334},{text:'845 − 467 = ?',answer:378},{text:'634 − 289 = ?',answer:345},{text:'501 − 247 = ?',answer:254}],
            extreme: [{text:'8765 − 3987 = ?',answer:4778},{text:'6543 − 2876 = ?',answer:3667},{text:'9012 − 4567 = ?',answer:4445},{text:'7890 − 3456 = ?',answer:4434},{text:'5678 − 2345 = ?',answer:3333}]
        },
        multiplication: {
            easy:    [{text:'6 × 7 = ?',answer:42},{text:'8 × 4 = ?',answer:32},{text:'9 × 6 = ?',answer:54},{text:'7 × 8 = ?',answer:56},{text:'6 × 9 = ?',answer:54}],
            medium:  [{text:'13 × 7 = ?',answer:91},{text:'15 × 8 = ?',answer:120},{text:'12 × 9 = ?',answer:108},{text:'14 × 6 = ?',answer:84},{text:'11 × 13 = ?',answer:143}],
            hard:    [{text:'34 × 12 = ?',answer:408},{text:'27 × 15 = ?',answer:405},{text:'43 × 11 = ?',answer:473},{text:'56 × 13 = ?',answer:728},{text:'38 × 17 = ?',answer:646}],
            extreme: [{text:'67 × 43 = ?',answer:2881},{text:'89 × 56 = ?',answer:4984},{text:'72 × 38 = ?',answer:2736},{text:'54 × 67 = ?',answer:3618},{text:'83 × 79 = ?',answer:6557}]
        },
        division: {
            easy:    [{text:'42 ÷ 6 = ?',answer:7},{text:'32 ÷ 8 = ?',answer:4},{text:'54 ÷ 9 = ?',answer:6},{text:'56 ÷ 7 = ?',answer:8},{text:'72 ÷ 8 = ?',answer:9}],
            medium:  [{text:'91 ÷ 7 = ?',answer:13},{text:'120 ÷ 8 = ?',answer:15},{text:'108 ÷ 9 = ?',answer:12},{text:'143 ÷ 11 = ?',answer:13},{text:'84 ÷ 6 = ?',answer:14}],
            hard:    [{text:'408 ÷ 12 = ?',answer:34},{text:'405 ÷ 15 = ?',answer:27},{text:'473 ÷ 11 = ?',answer:43},{text:'728 ÷ 13 = ?',answer:56},{text:'646 ÷ 17 = ?',answer:38}],
            extreme: [{text:'2881 ÷ 43 = ?',answer:67},{text:'4984 ÷ 56 = ?',answer:89},{text:'2736 ÷ 38 = ?',answer:72},{text:'3618 ÷ 54 = ?',answer:67},{text:'6557 ÷ 79 = ?',answer:83}]
        },
        percentages: {
            easy:    [{text:'1/2 = ? %',answer:50},{text:'1/4 = ? %',answer:25},{text:'3/4 = ? %',answer:75},{text:'1/5 = ? %',answer:20},{text:'1/10 = ? %',answer:10}],
            medium:  [{text:'1/3 = ? %',answer:33.33},{text:'2/3 = ? %',answer:66.67},{text:'1/8 = ? %',answer:12.5},{text:'3/8 = ? %',answer:37.5},{text:'5/8 = ? %',answer:62.5}],
            hard:    [{text:'1/6 = ? %',answer:16.67},{text:'5/6 = ? %',answer:83.33},{text:'1/7 = ? %',answer:14.29},{text:'1/9 = ? %',answer:11.11},{text:'1/12 = ? %',answer:8.33}],
            extreme: [{text:'1/11 = ? %',answer:9.09},{text:'1/16 = ? %',answer:6.25},{text:'1/24 = ? %',answer:4.17},{text:'5/12 = ? %',answer:41.67},{text:'7/12 = ? %',answer:58.33}]
        }
    };

    // ── Private helpers ────────────────────────────────────────────────────────
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
            addition:       { easy: [], medium: [], hard: [], extreme: [] },
            subtraction:    { easy: [], medium: [], hard: [], extreme: [] },
            multiplication: { easy: [], medium: [], hard: [], extreme: [] },
            division:       { easy: [], medium: [], hard: [], extreme: [] },
            percentages:    { easy: [], medium: [], hard: [], extreme: [] }
        };
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    return {
        getSettings: () => ({ ...DEFAULT_SETTINGS, ...get(KEYS.SETTINGS, {}) }),
        saveSettings: (s) => set(KEYS.SETTINGS, s),

        getHistory: () => get(KEYS.HISTORY, []),
        saveTestToHistory(result) {
            const h = get(KEYS.HISTORY, []);
            h.unshift(result);
            if (h.length > 200) h.pop();
            set(KEYS.HISTORY, h);
        },
        clearHistory: () => set(KEYS.HISTORY, []),

        getBests: () => get(KEYS.BESTS, {}),
        saveBests: (b) => set(KEYS.BESTS, b),

        getStreak: () => get(KEYS.STREAK, { current: 0, lastDate: null }),
        saveStreak: (s) => set(KEYS.STREAK, s),

        getSandbox() {
            let data = get(KEYS.SANDBOX, null);

            if (!data) {
                // First launch — seed with compact defaults
                data = DEFAULT_SANDBOX;
                set(KEYS.SANDBOX, data);
            } else {
                // Migration: Ensure percentages exist
                if (!data.percentages) {
                    data.percentages = { easy: [], medium: [], hard: [], extreme: [] };
                    set(KEYS.SANDBOX, data);
                }
            }

            // Migration: old array structure (addition was a flat array)
            if (Array.isArray(data.addition)) {
                const old = data.addition;
                data = getEmptySandbox();
                data.addition.easy = old;
                set(KEYS.SANDBOX, data);
            }

            // Seed any empty slots with defaults
            Object.keys(DEFAULT_SANDBOX).forEach(op => {
                if (!data[op]) data[op] = { easy: [], medium: [], hard: [], extreme: [] };
                Object.keys(DEFAULT_SANDBOX[op]).forEach(diff => {
                    if (!data[op][diff] || data[op][diff].length === 0) {
                        data[op][diff] = [...DEFAULT_SANDBOX[op][diff]];
                    }
                });
            });

            return data;
        },

        saveSandbox: (sb) => set(KEYS.SANDBOX, sb),

        addSandboxQuestion(op, diff, question) {
            const sb = Storage.getSandbox();
            if (!sb[op]) sb[op] = { easy: [], medium: [], hard: [], extreme: [] };
            if (!sb[op][diff]) sb[op][diff] = [];
            sb[op][diff].push(question);
            set(KEYS.SANDBOX, sb);
        },

        removeSandboxQuestion(op, diff, index) {
            const sb = Storage.getSandbox();
            if (sb[op]?.[diff]?.[index] !== undefined) {
                sb[op][diff].splice(index, 1);
                set(KEYS.SANDBOX, sb);
            }
        }
    };
})();
