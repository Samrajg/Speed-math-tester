/**
 * Statistics and Personal Best Calculator
 */

const Statistics = (function() {
    
    function calculateTestResult(testData) {
        const { questions, totalTimeMs } = testData;
        const total = questions.length;
        
        let correct = 0;
        let totalResponseTime = 0;
        let fastest = Infinity;
        
        questions.forEach(q => {
            if (q.isCorrect) correct++;
            if (q.responseTime < fastest) fastest = q.responseTime;
            totalResponseTime += q.responseTime;
        });

        const accuracy = total > 0 ? (correct / total) * 100 : 0;
        const avgSpeed = total > 0 ? totalResponseTime / total : 0;
        const totalTimeS = totalTimeMs / 1000;
        const qpm = totalTimeS > 0 ? (total / totalTimeS) * 60 : 0;

        return {
            date: new Date().toISOString(),
            operation: testData.operation,
            difficulty: testData.difficulty,
            total,
            correct,
            accuracy: Math.round(accuracy),
            avgSpeed: (avgSpeed / 1000).toFixed(1), // in seconds
            fastest: fastest === Infinity ? 0 : (fastest / 1000).toFixed(1),
            totalTime: Math.round(totalTimeS),
            qpm: qpm.toFixed(1)
        };
    }

    function updatePersonalBests(result) {
        const bests = Storage.getBests();
        const key = `${result.operation}_${result.difficulty}`;
        
        if (!bests[key]) {
            bests[key] = {
                accuracy: result.accuracy,
                fastestAvg: parseFloat(result.avgSpeed),
                maxScore: result.correct
            };
        } else {
            if (result.accuracy > bests[key].accuracy) {
                bests[key].accuracy = result.accuracy;
            }
            if (parseFloat(result.avgSpeed) < bests[key].fastestAvg || bests[key].fastestAvg === 0) {
                bests[key].fastestAvg = parseFloat(result.avgSpeed);
            }
            if (result.correct > bests[key].maxScore) {
                bests[key].maxScore = result.correct;
            }
        }
        
        Storage.saveBests(bests);
    }

    function updateStreak() {
        const streak = Storage.getStreak();
        const today = new Date().toDateString();
        
        if (streak.lastDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (streak.lastDate === yesterday.toDateString()) {
                streak.current += 1;
            } else {
                streak.current = 1; // Reset or start new streak
            }
            streak.lastDate = today;
            Storage.saveStreak(streak);
        }
    }

    return {
        processTest: function(testData) {
            const result = calculateTestResult(testData);
            Storage.saveTestToHistory(result);
            updatePersonalBests(result);
            updateStreak();
            return result;
        },
        
        getTodayStats: function() {
            const history = Storage.getHistory();
            const today = new Date().toDateString();
            
            let tests = 0, totalQ = 0, totalCorrect = 0, totalSpeed = 0;
            
            history.forEach(item => {
                if (new Date(item.date).toDateString() === today) {
                    tests++;
                    totalQ += item.total;
                    totalCorrect += item.correct;
                    totalSpeed += parseFloat(item.avgSpeed) * item.total;
                }
            });
            
            const accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;
            const avgSpeed = totalQ > 0 ? (totalSpeed / totalQ).toFixed(1) : 0;
            
            return { tests, totalQ, accuracy, avgSpeed };
        }
    };
})();
