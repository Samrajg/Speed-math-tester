/**
 * Math Question Generator Engine
 * Supports: addition, subtraction, multiplication, division, mixed
 * Features: session-level deduplication to prevent repeat questions
 */

const Questions = (function () {

    // ── Session deduplication ──────────────────────────────────────────────────
    const sessionSeen = new Set();

    function resetSession() {
        sessionSeen.clear();
    }

    // ── Random helpers ─────────────────────────────────────────────────────────
    function ri(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ── Generators ────────────────────────────────────────────────────────────
    function generateAddition(difficulty) {
        let min, max;
        switch (difficulty) {
            case 'easy':    min = 1;   max = 20;   break;
            case 'medium':  min = 10;  max = 100;  break;
            case 'hard':    min = 100; max = 999;  break;
            case 'extreme': min = 100; max = 9999; break;
            default:        min = 1;   max = 20;
        }
        const a = ri(min, max), b = ri(min, max);
        return { text: `${a} + ${b} = ?`, answer: a + b };
    }

    function generateSubtraction(difficulty) {
        let minA, maxA, minB, maxB;
        switch (difficulty) {
            case 'easy':    minA = 10;  maxA = 50;   minB = 1;   maxB = 30;   break;
            case 'medium':  minA = 50;  maxA = 200;  minB = 10;  maxB = 150;  break;
            case 'hard':    minA = 100; maxA = 999;  minB = 50;  maxB = 999;  break;
            case 'extreme': minA = 500; maxA = 9999; minB = 100; maxB = 5000; break;
            default:        minA = 10;  maxA = 50;   minB = 1;   maxB = 30;
        }
        let a = ri(minA, maxA), b = ri(minB, maxB);
        if (b > a) { const t = a; a = b; b = t; }
        return { text: `${a} − ${b} = ?`, answer: a - b };
    }

    function generateMultiplication(difficulty) {
        let minA, maxA, minB, maxB;
        switch (difficulty) {
            case 'easy':    minA = 2;  maxA = 10; minB = 2;  maxB = 10; break;
            case 'medium':  minA = 2;  maxA = 20; minB = 2;  maxB = 20; break;
            case 'hard':    minA = 10; maxA = 99; minB = 2;  maxB = 20; break;
            case 'extreme': minA = 10; maxA = 99; minB = 10; maxB = 99; break;
            default:        minA = 2;  maxA = 10; minB = 2;  maxB = 10;
        }
        const a = ri(minA, maxA), b = ri(minB, maxB);
        return { text: `${a} × ${b} = ?`, answer: a * b };
    }

    function generateDivision(difficulty) {
        // Generate dividend as divisor × answer to guarantee clean division
        let minA, maxA, minB, maxB;
        switch (difficulty) {
            case 'easy':    minA = 2;  maxA = 10; minB = 2;  maxB = 10; break;
            case 'medium':  minA = 3;  maxA = 15; minB = 3;  maxB = 20; break;
            case 'hard':    minA = 5;  maxA = 20; minB = 10; maxB = 50; break;
            case 'extreme': minA = 12; maxA = 50; minB = 12; maxB = 99; break;
            default:        minA = 2;  maxA = 10; minB = 2;  maxB = 10;
        }
        const divisor = ri(minA, maxA);
        const answer  = ri(minB, maxB);
        return { text: `${divisor * answer} ÷ ${divisor} = ?`, answer };
    }

    const OPERATIONS = ['addition', 'subtraction', 'multiplication', 'division'];

    function generateForOp(operation, difficulty) {
        switch (operation) {
            case 'addition':       return generateAddition(difficulty);
            case 'subtraction':    return generateSubtraction(difficulty);
            case 'multiplication': return generateMultiplication(difficulty);
            case 'division':       return generateDivision(difficulty);
            default:               return generateAddition(difficulty);
        }
    }

    // ── Public API ─────────────────────────────────────────────────────────────
    return {
        resetSession,

        generate(operation, difficulty, source) {
            // Sandbox mode: pick a random question from custom list
            if (source === 'sandbox') {
                const sb    = Storage.getSandbox();
                const op    = operation === 'mixed' ? OPERATIONS[ri(0, 3)] : operation;
                const qList = sb[op]?.[difficulty] || [];
                if (qList.length === 0) return { text: 'No custom Qs!', answer: 0, isError: true };
                return { ...qList[ri(0, qList.length - 1)], operation: op };
            }

            // Auto-generate with deduplication (up to 10 retries)
            const op = operation === 'mixed' ? OPERATIONS[ri(0, 3)] : operation;
            let q, attempts = 0;
            do {
                q = generateForOp(op, difficulty);
                q.operation = op;
                attempts++;
            } while (sessionSeen.has(q.text) && attempts < 10);

            sessionSeen.add(q.text);
            return q;
        }
    };
})();
