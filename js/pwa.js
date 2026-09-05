/**
 * PWA Registration and Install Prompt Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }

    // Install Banner Logic
    let deferredPrompt;
    const installBanner = document.getElementById('install-banner');
    const installBtn = document.getElementById('install-btn');
    const dismissBtn = document.getElementById('dismiss-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later.
        deferredPrompt = e;
        // Update UI to notify the user they can add to home screen
        
        // Don't show if already dismissed in this session (or we could use localStorage)
        if (!sessionStorage.getItem('pwaPromptDismissed')) {
            installBanner.classList.remove('hidden');
        }
    });

    installBtn.addEventListener('click', () => {
        // hide our user interface that shows our A2HS button
        installBanner.classList.add('hidden');
        // Show the prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                } else {
                    console.log('User dismissed the A2HS prompt');
                }
                deferredPrompt = null;
            });
        }
    });
    
    dismissBtn.addEventListener('click', () => {
        installBanner.classList.add('hidden');
        sessionStorage.setItem('pwaPromptDismissed', 'true');
    });

    window.addEventListener('appinstalled', () => {
        installBanner.classList.add('hidden');
        console.log('PWA was installed');
    });
});
