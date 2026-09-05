/**
 * Math Question Generator Engine
 */

const Questions = (function() {
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateAddition(difficulty) {
        let min, max;
        switch(difficulty) {
            case 'easy': min = 1; max = 20; break;
            case 'medium': min = 10; max = 100; break;
            case 'hard': min = 100; max = 999; break;
            case 'extreme': min = 100; max = 9999; break;
            default: min = 1; max = 20;
        }
        const a = getRandomInt(min, max);
        const b = getRandomInt(min, max);
        return {
            text: `${a} + ${b} = ?`,
            answer: a + b
        };
    }

    function generateSubtraction(difficulty) {
        let minA, maxA, minB, maxB;
        switch(difficulty) {
            case 'easy': minA = 10; maxA = 50; minB = 1; maxB = 30; break;
            case 'medium': minA = 50; maxA = 200; minB = 10; maxB = 150; break;
            case 'hard': minA = 100; maxA = 999; minB = 50; maxB = 999; break;
            case 'extreme': minA = 500; maxA = 9999; minB = 100; maxB = 5000; break;
            default: minA = 10; maxA = 50; minB = 1; maxB = 30;
        }
        
        let a = getRandomInt(minA, maxA);
        let b = getRandomInt(minB, maxB);
        
        // Ensure positive result by default
        if (b > a) {
            const temp = a;
            a = b;
            b = temp;
        }
        
        return {
            text: `${a} − ${b} = ?`,
            answer: a - b
        };
    }

    function generateMultiplication(difficulty) {
        let minA, maxA, minB, maxB;
        switch(difficulty) {
            case 'easy': minA = 2; maxA = 10; minB = 2; maxB = 10; break;
            case 'medium': minA = 2; maxA = 20; minB = 2; maxB = 20; break;
            case 'hard': minA = 10; maxA = 99; minB = 2; maxB = 20; break;
            case 'extreme': minA = 10; maxA = 99; minB = 10; maxB = 99; break;
            default: minA = 2; maxA = 10; minB = 2; maxB = 10;
        }
        const a = getRandomInt(minA, maxA);
        const b = getRandomInt(minB, maxB);
        return {
            text: `${a} × ${b} = ?`,
            answer: a * b
        };
    }

    function generateDivision(difficulty) {
        // To ensure clean division without decimals, we generate a multiplication first
        // If a * b = c, then c / a = b
        let minA, maxA, minB, maxB;
        switch(difficulty) {
            case 'easy': minA = 2; maxA = 10; minB = 2; maxB = 10; break;
            case 'medium': minA = 3; maxA = 15; minB = 3; maxB = 20; break;
            case 'hard': minA = 5; maxA = 20; minB = 10; maxB = 50; break;
            case 'extreme': minA = 12; maxA = 50; minB = 12; maxB = 99; break;
            default: minA = 2; maxA = 10; minB = 2; maxB = 10;
        }
        
        const divisor = getRandomInt(minA, maxA);
        const answer = getRandomInt(minB, maxB);
        const dividend = divisor * answer;
        
        return {
            text: `${dividend} ÷ ${divisor} = ?`,
            answer: answer
        };
    }

    return {
        generate: function(operation, difficulty, source) {
            if (source === 'sandbox') {
                const sb = Storage.getSandbox();
                const qList = sb[operation] && sb[operation][difficulty] ? sb[operation][difficulty] : [];
                if (qList.length === 0) {
                    return { text: "No custom Qs!", answer: 0, isError: true };
                }
                return qList[getRandomInt(0, qList.length - 1)];
            }
            switch(operation) {
                case 'addition': return generateAddition(difficulty);
                case 'subtraction': return generateSubtraction(difficulty);
                case 'multiplication': return generateMultiplication(difficulty);
                case 'division': return generateDivision(difficulty);
                default: return generateAddition(difficulty);
            }
        }
    };
})();
