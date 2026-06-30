
        document.addEventListener('DOMContentLoaded', () => {
            const overlay = document.getElementById('login-overlay');
            if(overlay) {
                const loginCard = overlay.querySelector('.relative.w-full.max-w-\\[340px\\]');
                const inputs = overlay.querySelectorAll('input');
                
                if(loginCard && inputs.length > 0) {
                    inputs.forEach(input => {
                        input.addEventListener('focus', () => {
                            if (window.innerWidth < 640) {
                                loginCard.style.transform = 'translateY(-20vh)';
                                loginCard.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                            }
                        });
                        input.addEventListener('blur', () => {
                            loginCard.style.transform = 'translateY(0)';
                        });
                    });
                }
            }
        });
    