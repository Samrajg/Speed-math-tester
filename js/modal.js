/**
 * Custom Modal Dialog — replaces native alert() and confirm()
 * Also provides Toast notification utility.
 */

// ── Modal ─────────────────────────────────────────────────────────────────────
const Modal = (function () {
    function show({ message, buttons }) {
        return new Promise((resolve) => {
            const overlay = document.getElementById('modal-overlay');
            document.getElementById('modal-message').innerHTML = message;
            const actionsEl = document.getElementById('modal-actions');
            actionsEl.innerHTML = '';

            buttons.forEach(({ label, value, className }) => {
                const btn = document.createElement('button');
                btn.className = className || 'btn-secondary';
                btn.textContent = label;
                btn.addEventListener('click', () => {
                    overlay.classList.add('hidden');
                    resolve(value);
                });
                actionsEl.appendChild(btn);
            });

            overlay.classList.remove('hidden');
            // Focus first button for keyboard users
            setTimeout(() => actionsEl.querySelector('button')?.focus(), 50);
        });
    }

    return {
        alert(message) {
            return show({
                message,
                buttons: [{ label: 'OK', value: true, className: 'btn-primary' }]
            });
        },
        confirm(message) {
            return show({
                message,
                buttons: [
                    { label: 'Cancel', value: false, className: 'btn-secondary' },
                    { label: 'Yes', value: true, className: 'btn-primary' }
                ]
            });
        }
    };
})();

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = {
    show(message, duration = 3500) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = message;
        container.appendChild(toast);
        // Trigger animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => toast.classList.add('toast-visible'));
        });
        setTimeout(() => {
            toast.classList.remove('toast-visible');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }
};
