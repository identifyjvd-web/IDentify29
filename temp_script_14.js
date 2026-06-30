
    (function() {
        let touchstartX = 0;
        let touchstartY = 0;
        const SWIPE_THRESHOLD = 50; 
        const EDGE_THRESHOLD = 50; 

        document.addEventListener('touchstart', e => {
            if (!e.changedTouches || e.changedTouches.length === 0) return;
            touchstartX = e.changedTouches[0].screenX;
            touchstartY = e.changedTouches[0].screenY;
        }, {passive: true});

        document.addEventListener('touchend', e => {
            if (!e.changedTouches || e.changedTouches.length === 0) return;
            const touchendX = e.changedTouches[0].screenX;
            const touchendY = e.changedTouches[0].screenY;
            
            if (touchstartX > EDGE_THRESHOLD) return;
            
            const deltaX = touchendX - touchstartX;
            const deltaY = Math.abs(touchendY - touchstartY);
            
            if (deltaX > SWIPE_THRESHOLD && deltaX > deltaY * 1.5) {
                handleGlobalSwipeBack();
            }
        }, {passive: true});

        // --- Modal State Management System ---
        window.ModalManager = {
            stack: [],
            push: function(modalId, closeFn) {
                this.remove(modalId);
                this.stack.push({ id: modalId, close: closeFn });
            },
            remove: function(modalId) {
                this.stack = this.stack.filter(m => m.id !== modalId);
            },
            pop: function() {
                if (this.stack.length > 0) {
                    const top = this.stack.pop();
                    if (typeof top.close === 'function') top.close();
                    else if (typeof window[top.close] === 'function') window[top.close]();
                    return true;
                }
                return false;
            }
        };

        const modalMap = {
            'crop-modal': 'closeCropModal',
            'custom-modal': 'closeModal',
            'student-detail-popup': 'closeStudentDetailPopup',
            'account-modal': 'closeAccountModal',
            'school-config': 'closeSchoolConfig',
            'import-export-modal': 'closeImportExportModal',
            'student-form-section': 'closeStudentForm'
        };

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const el = mutation.target;
                    const id = el.id;
                    if (modalMap[id]) {
                        const style = window.getComputedStyle(el);
                        const isVisible = style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden' && !el.classList.contains('hidden') && !el.classList.contains('translate-y-full');
                        if (isVisible) {
                            window.ModalManager.push(id, modalMap[id]);
                        } else {
                            window.ModalManager.remove(id);
                        }
                    }
                }
            });
        });

        Object.keys(modalMap).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                observer.observe(el, { attributes: true, attributeFilter: ['class'] });
                // Initial check
                const style = window.getComputedStyle(el);
                const isVisible = style.display !== 'none' && style.opacity !== '0' && style.visibility !== 'hidden' && !el.classList.contains('hidden') && !el.classList.contains('translate-y-full');
                if (isVisible) window.ModalManager.push(id, modalMap[id]);
            }
        });

        function handleGlobalSwipeBack() {
            window.ModalManager.pop();
        }
    })();
    