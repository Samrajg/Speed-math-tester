/**
 * Sound Effects via Web Audio API — no external audio files needed.
 * All sounds are generated programmatically.
 */
const Sounds = (function () {
    let ctx = null;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function tone(freq, type, startOffset, duration, gainVal = 0.25) {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = type;
        osc.frequency.value = freq;
        const t = c.currentTime + startOffset;
        gain.gain.setValueAtTime(gainVal, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.start(t);
        osc.stop(t + duration + 0.02);
    }

    function isEnabled() {
        try {
            const s = localStorage.getItem('speedMathSettings');
            if (!s) return true;
            const parsed = JSON.parse(s);
            return parsed.sound !== false;
        } catch { return true; }
    }

    return {
        /** Short high ping for correct answer */
        correct() {
            if (!isEnabled()) return;
            try { tone(880, 'sine', 0, 0.12, 0.3); } catch (e) {}
        },

        /** Low buzz for wrong answer */
        wrong() {
            if (!isEnabled()) return;
            try {
                tone(220, 'sawtooth', 0, 0.08, 0.15);
                tone(180, 'sawtooth', 0.08, 0.1, 0.1);
            } catch (e) {}
        },

        /** Victory fanfare for test completion */
        complete() {
            if (!isEnabled()) return;
            try {
                tone(523, 'sine', 0, 0.12, 0.25);
                tone(659, 'sine', 0.14, 0.12, 0.25);
                tone(784, 'sine', 0.28, 0.22, 0.3);
            } catch (e) {}
        },

        /** Urgency tick for timer running low */
        tick() {
            if (!isEnabled()) return;
            try { tone(660, 'square', 0, 0.05, 0.1); } catch (e) {}
        }
    };
})();
