
        // Initialize customFieldsConfig at top level so all functions can access
        const savedCfg = localStorage.getItem('identifyCustomFields');
        let customFieldsConfig = { customField1: { active: false, label: 'Custom 1' }, customField2: { active: false, label: 'Custom 2' }, customField3: { active: false, label: 'Custom 3' }, customField4: { active: false, label: 'Custom 4' }, customField5: { active: false, label: 'Custom 5' } };
        if (savedCfg) { try { customFieldsConfig = JSON.parse(savedCfg); } catch (e) { } }

        function openFormBuilder() {
            closeSchoolConfig();
            if (typeof previousBlankRecordMode !== 'undefined') previousBlankRecordMode = 'settings';
            setBlankRecordMode('builder');
        }

        async function openManageSchools() {
            closeSchoolConfig();
            if (typeof previousBlankRecordMode !== 'undefined') previousBlankRecordMode = 'settings';
            
            // Fetch the latest config from Firestore to make sure we show the current credentials
            if (typeof fetchSystemConfigFromFirebase === 'function') {
                try {
                    await fetchSystemConfigFromFirebase();
                } catch (e) {
                    console.warn("Could not sync latest config before opening Manage School:", e);
                }
            }
            
            setBlankRecordMode('manage_school');
        }

        function openDataInformation() {
            closeSchoolConfig();
            if (typeof previousBlankRecordMode !== 'undefined') previousBlankRecordMode = 'settings';
            setBlankRecordMode('dataInfo');
        }

        function openSettingsModal() {
            const modal = document.createElement('div');
            modal.id = 'settings-modal';
            modal.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center';
            let html = '<div class="bg-white rounded-2xl p-6 w-[90%] max-w-sm"><h2 class="text-lg font-bold text-slate-800 mb-4">Custom Fields Settings</h2>';
            for (let i = 1; i <= 5; i++) {
                const field = customFieldsConfig['customField' + i];
                html += `<div class="mb-3 flex flex-col gap-1">
                <div class="flex items-center gap-2">
                    <input type="checkbox" id="cfg-active-${i}" ${field.active ? 'checked' : ''} class="w-4 h-4 accent-emerald-600">
                    <span class="text-xs font-bold text-slate-600 uppercase">Enable Field ${i}</span>
                </div>
                <input type="text" id="cfg-label-${i}" placeholder="Enter Label (e.g. Blood Group)" value="${field.label}" class="w-full text-sm border p-2 rounded-lg outline-none focus:border-emerald-500 bg-slate-50">
            </div>`;
            }
            html += '<div class="flex justify-end gap-2 mt-4 pt-4 border-t"><button onclick="document.getElementById(\'settings-modal\').remove()" class="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg text-sm font-bold">Cancel</button><button onclick="saveSettings()" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold">Save</button></div></div>';
            modal.innerHTML = html;
            document.body.appendChild(modal);
        }
        function saveSettings() {
            for (let i = 1; i <= 5; i++) {
                customFieldsConfig['customField' + i].active = document.getElementById('cfg-active-' + i).checked;
                customFieldsConfig['customField' + i].label = document.getElementById('cfg-label-' + i).value || `Custom ${i}`;
            }
            localStorage.setItem('identifyCustomFields', JSON.stringify(customFieldsConfig));
            document.getElementById('settings-modal').remove();
            showToast('Settings Saved');
        }

        // Toast notification for non-blocking feedback
        function showToast(message, duration = 2200) {
            // Do not sync toast messages to footer notifications anymore

            let toast = document.getElementById('_global_toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = '_global_toast';
                // Button-like Toast Styling (Green Variation, No Glow)
                toast.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%) scale(0.85) translateY(-20px);background:#059669;color:#ffffff;height:36px;padding:0 24px;border-radius:999px;font-size:14.5px;font-weight:700;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transition:all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);pointer-events:none;white-space:nowrap;display:flex;align-items:center;justify-content:center;';
                // Removed the yellow dot indicator
                toast.innerHTML = `<span id="_global_toast_msg"></span>`;
                document.body.appendChild(toast);
            }

            document.getElementById('_global_toast_msg').innerHTML = message;

            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateX(-50%) scale(1) translateY(0)';
                clearTimeout(toast._hideTimer);
                toast._hideTimer = setTimeout(() => {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateX(-50%) scale(0.85) translateY(-20px)';
                }, duration);
            });
        }

        function setSyncStatus(msg, progress = null) {
            const wrapper = document.getElementById('footer-notification-wrapper');
            if (!wrapper) return;
            if (!msg) {
                wrapper.innerHTML = '';
                wrapper.classList.add('hidden');
                return;
            }
            const mLower = msg.toLowerCase();
            // Block connection, sync, server, save, and photo status notifications in footer
            if (mLower.includes('connect') || mLower.includes('sync') || mLower.includes('server') || mLower.includes('save') || mLower.includes('photo')) {
                wrapper.innerHTML = '';
                wrapper.classList.add('hidden');
                return;
            }
            wrapper.classList.remove('hidden');
            let progressHtml = (progress !== null) ? `<span class="ml-2 text-emerald-600 font-black italic text-[10px]">${progress}%</span>` : '';
            if (mLower.includes('required') || mLower.includes('error') || mLower.includes('failed')) {
                wrapper.innerHTML = `<span class="text-[10.5px] font-black text-rose-500 uppercase italic animate-pulse">${msg}</span>`;
            } else {
                wrapper.innerHTML = `<span class="text-[10.5px] font-black text-emerald-600 uppercase italic animate-pulse"><i class="fa-solid fa-rotate mr-1 fa-spin"></i> ${msg}</span>${progressHtml}`;
            }
        }

        const FB_STANDARD_FIELDS = [
            { id: 'photo', type: 'image', label: 'Student Photo' },
            { id: 'sclass', type: 'select', label: 'Class' },
            { id: 'gender', type: 'select', label: 'Gender' },
            { id: 'studentName', type: 'text', label: 'Student Name' },
            { id: 'fatherName', type: 'text', label: "Father's Name" },
            { id: 'dob', type: 'date', label: 'Date of Birth' },
            { id: 'mobile', type: 'number', label: 'Mobile Number' },
            { id: 'aadhar', type: 'number', label: 'Aadhar Number' },
            { id: 'address', type: 'text', label: 'Address' }
        ];
        const FB_DEFAULT_SELECT_OPTIONS = {
            sclass: ['General', 'Nursery', 'KG-1', 'KG-2', 'Class 1', 'Class 2', 'Class 3'],
            gender: ['Male', 'Female', 'Other']
        };
        const FB_FIXED_TOP_FIELDS = [];

        let fb_standard_config = {};
        let fb_form_order = [];
        let fb_standard_labels = {};
        let fb_standard_meta = {};
        const FB_CUSTOM_LIMIT = 5;
        let fb_filter_mode = 'all';
        let fb_search_term = '';
        let fb_editor_draft = null;

        function fb_bootFromStorage() {
            const saved = localStorage.getItem('identify_fb_fields');
            if (saved) {
                try { fb_fields = JSON.parse(saved); } catch (e) { fb_fields = []; }
            } else {
                fb_fields = [];
            }
            if (!Array.isArray(fb_fields)) fb_fields = [];
            if (fb_fields.length > FB_CUSTOM_LIMIT) fb_fields = fb_fields.slice(0, FB_CUSTOM_LIMIT);

            const savedRemoved = localStorage.getItem('identify_fb_removed');
            if (savedRemoved) {
                try { fb_removed = JSON.parse(savedRemoved); } catch (e) { fb_removed = []; }
            } else {
                fb_removed = [];
            }
            if (!Array.isArray(fb_removed)) fb_removed = [];

            const savedStd = localStorage.getItem('identify_fb_std_config');
            if (savedStd) {
                try { fb_standard_config = JSON.parse(savedStd); } catch (e) { fb_standard_config = {}; }
            } else {
                fb_standard_config = {};
            }

            const savedStdLabels = localStorage.getItem('identify_fb_std_labels');
            if (savedStdLabels) {
                try { fb_standard_labels = JSON.parse(savedStdLabels); } catch (e) { fb_standard_labels = {}; }
            } else {
                fb_standard_labels = {};
            }

            const savedStdMeta = localStorage.getItem('identify_fb_std_meta');
            if (savedStdMeta) {
                try { fb_standard_meta = JSON.parse(savedStdMeta); } catch (e) { fb_standard_meta = {}; }
            } else {
                fb_standard_meta = {};
            }

            FB_STANDARD_FIELDS.forEach(f => {
                if (!(f.id in fb_standard_config)) {
                    fb_standard_config[f.id] = { enabled: true, required: ['studentName', 'fatherName', 'sclass', 'photo'].includes(f.id) };
                }
            });
            FB_FIXED_TOP_FIELDS.forEach(fid => {
                if (!(fid in fb_standard_config)) fb_standard_config[fid] = { enabled: true, required: false };
                fb_standard_config[fid].enabled = true;
            });

            const savedOrder = localStorage.getItem('identify_fb_form_order');
            const savedStdOrder = localStorage.getItem('identify_fb_std_order');
            const defaultOrder = FB_STANDARD_FIELDS.map(f => f.id);
            if (savedOrder) {
                try { fb_form_order = JSON.parse(savedOrder); } catch (e) { fb_form_order = defaultOrder.slice(); }
            } else if (savedStdOrder) {
                try { fb_form_order = JSON.parse(savedStdOrder); } catch (e) { fb_form_order = defaultOrder.slice(); }
            } else {
                fb_form_order = defaultOrder.slice();
            }
            const validStdIds = new Set(defaultOrder);
            
            // Ensure all standard fields exist
            defaultOrder.forEach(id => { if (!fb_form_order.includes(id)) fb_form_order.push(id); });
            
            // Ensure all custom fields exist
            fb_fields.forEach(f => {
                if (!fb_form_order.includes(f.id)) fb_form_order.push(f.id);
            });
            
            // Cleanup deleted fields (keep only standard or existing custom)
            fb_form_order = fb_form_order.filter(id => validStdIds.has(id) || fb_fields.some(f => f.id === id));
            
            const tail = fb_form_order.filter(id => !FB_FIXED_TOP_FIELDS.includes(id));
            fb_form_order = [...FB_FIXED_TOP_FIELDS, ...tail];
            fb_applySelectOptionsToHiddenInputs();
        }

        function fb_loadActiveFormToBuilder() {
            fb_bootFromStorage();

            fb_renderForm();
            
            // Set QR toggle state on load
            const qrEnabled = localStorage.getItem('identify_qr_enabled') === 'true';
            const qrEl = document.getElementById('fb_qr_enable');
            if (qrEl) qrEl.checked = qrEnabled;
        }

        function fb_toggleQrEnable(checked) {
            localStorage.setItem('identify_qr_enabled', checked ? 'true' : 'false');
            showToast(checked ? '<span class="material-symbols-outlined text-[18px] mr-2" style="font-variation-settings: \'FILL\' 1; vertical-align: middle;">qr_code_2</span> QR Code Saving Enabled' : '<span class="material-symbols-outlined text-[18px] mr-2" style="font-variation-settings: \'FILL\' 1; vertical-align: middle;">qr_code_2</span> QR Code Saving Disabled');
            
            if (checked && !localStorage.getItem('identify_qr_fields')) {
                let savedFields = ['id'];
                fb_form_order.forEach(id => {
                    let f = null;
                    const isStandard = FB_STANDARD_FIELDS.some(sf => sf.id === id);
                    if (isStandard) {
                        const stdField = FB_STANDARD_FIELDS.find(sf => sf.id === id);
                        const config = fb_standard_config[id] || { enabled: true };
                        if (!config.enabled) return;
                        f = { id: id, type: stdField.type };
                    } else {
                        f = fb_fields.find(cf => cf.id === id);
                    }
                    if (f && f.type !== 'section' && f.type !== 'image' && id !== 'photo') {
                        savedFields.push(f.id);
                    }
                });
                localStorage.setItem('identify_qr_fields', JSON.stringify(savedFields));
            }
            fb_renderForm();
        }

        function fb_toggleFieldQr(id) {
            let savedFields = JSON.parse(localStorage.getItem('identify_qr_fields') || '["id"]');
            if (savedFields.includes(id)) {
                savedFields = savedFields.filter(f => f !== id);
            } else {
                savedFields.push(id);
            }
            if (savedFields.length === 0) savedFields = ['id']; // ensure at least one field is selected
            localStorage.setItem('identify_qr_fields', JSON.stringify(savedFields));
            fb_renderForm();
        }

        function fb_resetBuilderView(silent = false) {
            fb_filter_mode = 'all';
            fb_search_term = '';
            const input = document.getElementById('fb_searchInput');
            if (input) input.value = '';
            if (!silent) fb_renderForm();
        }

        function fb_setFilter(mode) {
            fb_filter_mode = mode || 'all';
            fb_renderForm();
        }

        function fb_setSearch(value) {
            fb_search_term = (value || '').trim();
            fb_renderForm();
        }

        function fb_findField(id) {
            return fb_fields.find(f => String(f.id) === String(id));
        }

        // Ported from source builder: keep app state synced after each builder action.
        function fb_syncToAppData() {
            const limitedFields = (Array.isArray(fb_fields) ? fb_fields : []).slice(0, FB_CUSTOM_LIMIT);
            localStorage.setItem('identify_fb_fields', JSON.stringify(limitedFields));
            localStorage.setItem('identify_fb_removed', JSON.stringify(Array.isArray(fb_removed) ? fb_removed : []));
            localStorage.setItem('identify_fb_std_config', JSON.stringify(fb_standard_config || {}));
            localStorage.setItem('identify_fb_form_order', JSON.stringify(Array.isArray(fb_form_order) ? fb_form_order : []));
            localStorage.setItem('identify_fb_std_labels', JSON.stringify(fb_standard_labels || {}));
            localStorage.setItem('identify_fb_std_meta', JSON.stringify(fb_standard_meta || {}));

            for (let i = 1; i <= 5; i++) {
                const f = limitedFields[i - 1];
                customFieldsConfig[`customField${i}`] = {
                    active: !!f,
                    label: f ? (f.label || `Custom ${i}`) : `Custom ${i}`
                };
            }
            localStorage.setItem('identifyCustomFields', JSON.stringify(customFieldsConfig));
            fb_applySelectOptionsToHiddenInputs();
        }

        function fb_removeAllCustom() {
            if (fb_fields.length === 0) {
                showToast('No custom fields to clear.');
                return;
            }
            showModal('confirm', 'Clear All Custom Fields?', 'All custom fields will move to Recently Removed.', () => {
                fb_removed = [...fb_fields, ...fb_removed];
                fb_fields = [];
                fb_renderForm();
                fb_syncToAppData();
                showToast('Custom fields cleared.');
            }, 'Clear');
        }

        function fb_updateBuilderStats() {
            const stdEnabled = FB_STANDARD_FIELDS.filter(f => (fb_standard_config[f.id] || { enabled: true, required: false }).enabled).length;
            const requiredTotal = FB_STANDARD_FIELDS.filter(f => (fb_standard_config[f.id] || { enabled: true, required: false }).enabled && (fb_standard_config[f.id] || { enabled: true, required: false }).required).length + fb_fields.filter(f => !!f.required).length;

            const statStd = document.getElementById('fb_stat_standard');
            const statCustom = document.getElementById('fb_stat_custom');
            const statRequired = document.getElementById('fb_stat_required');
            const limit = document.getElementById('fb_limit_label');
            if (statStd) statStd.textContent = String(stdEnabled);
            if (statCustom) statCustom.textContent = String(fb_fields.length);
            if (statRequired) statRequired.textContent = String(requiredTotal);
            if (limit) limit.textContent = `${fb_fields.length} / ${FB_CUSTOM_LIMIT} used`;
        }

        function fb_updateFilterButtons() {
            const btns = [
                { id: 'fb_filter_all', mode: 'all' },
                { id: 'fb_filter_standard', mode: 'standard' },
                { id: 'fb_filter_custom', mode: 'custom' },
                { id: 'fb_filter_required', mode: 'required' }
            ];
            btns.forEach(cfg => {
                const btn = document.getElementById(cfg.id);
                if (!btn) return;
                if (fb_filter_mode === cfg.mode) {
                    btn.className = 'h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition bg-emerald-600 text-white';
                } else {
                    btn.className = 'h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition bg-slate-100 text-slate-600';
                }
            });
        }

        function fb_getTypeLabel(type) {
            if (type === 'text') return 'Text';
            if (type === 'number') return 'Number';
            if (type === 'date') return 'Date';
            if (type === 'select') return 'Dropdown';
            if (type === 'image') return 'Image';
            return 'Field';
        }

        function fb_getStandardLabel(id, fallback = '') {
            return (fb_standard_labels && fb_standard_labels[id]) ? fb_standard_labels[id] : fallback;
        }

        function fb_getFieldIcon(field) {
            const id = String((field && field.id) || '').toLowerCase();
            const type = String((field && field.type) || '').toLowerCase();
            const label = String((field && field.label) || '').toLowerCase();
            if (id === 'studentname' || label.includes('student')) return 'fa-user';
            if (id === 'fathername' || label.includes('father')) return 'fa-user-plus';
            if (id === 'dob' || label.includes('dob') || label.includes('date')) return 'fa-calendar-days';
            if (id === 'mobile' || label.includes('mobile') || label.includes('phone')) return 'fa-phone';
            if (id === 'aadhar' || label.includes('aadhar') || label.includes('aadhaar')) return 'fa-id-card';
            if (id === 'address' || label.includes('address')) return 'fa-map-location-dot';
            if (id === 'sclass' || label.includes('class')) return 'fa-book-open';
            if (id === 'gender' || label.includes('gender')) return 'fa-users';
            if (type === 'select') return 'fa-caret-down';
            if (type === 'number') return 'fa-hashtag';
            if (type === 'date') return 'fa-calendar-days';
            if (type === 'image') return 'fa-camera';
            return 'fa-circle-info';
        }

        function fb_getStandardSelectOptions(fieldId) {
            const defaults = Array.isArray(FB_DEFAULT_SELECT_OPTIONS[fieldId]) ? FB_DEFAULT_SELECT_OPTIONS[fieldId] : [];
            const meta = (fb_standard_meta && Array.isArray(fb_standard_meta[fieldId]?.options)) ? fb_standard_meta[fieldId].options : [];
            const source = meta.length ? meta : defaults;
            const clean = source.map(v => String(v || '').trim()).filter(Boolean);
            return clean.length ? clean : defaults.slice();
        }

        function fb_applySelectOptionsToHiddenInputs() {
            const applyOptions = (selectEl, options, fallbackValue) => {
                if (!selectEl) return;
                const currentValue = String(selectEl.value || '').trim();
                const clean = (Array.isArray(options) ? options : []).map(v => String(v || '').trim()).filter(Boolean);
                const merged = clean.length ? clean.slice() : [fallbackValue];
                if (currentValue && !merged.includes(currentValue)) merged.push(currentValue);
                if (!merged.length) merged.push(fallbackValue);
                const previous = currentValue || fallbackValue;
                selectEl.innerHTML = merged.map(opt => `<option value="${String(opt).replace(/"/g, '&quot;')}">${opt}</option>`).join('');
                selectEl.value = merged.includes(previous) ? previous : merged[0];
            };

            applyOptions(document.getElementById('in-sclass'), fb_getStandardSelectOptions('sclass'), 'General');
            applyOptions(document.getElementById('in-gender'), fb_getStandardSelectOptions('gender'), 'Other');
        }

        function fb_renderForm() {
            const container = document.getElementById('fb_formContainer');
            const emptyState = document.getElementById('fb_emptyState');
            if (!container) return;
            container.innerHTML = '';
            fb_updateBuilderStats();
            fb_updateFilterButtons();

            if (emptyState) emptyState.classList.add('hidden');

            const term = fb_search_term.toLowerCase();
            const matches = (txt) => !term || String(txt || '').toLowerCase().includes(term);
            const allowStandard = fb_filter_mode === 'all' || fb_filter_mode === 'standard' || fb_filter_mode === 'required';
            const allowCustom = fb_filter_mode === 'all' || fb_filter_mode === 'custom' || fb_filter_mode === 'required';
            let renderedCount = 0;
            const qrEnabled = localStorage.getItem('identify_qr_enabled') === 'true';
            const qrFields = JSON.parse(localStorage.getItem('identify_qr_fields') || '["id"]');

            // UNIFIED RENDER LOOP
            if (Array.isArray(fb_form_order)) fb_form_order.forEach((id, orderIndex) => {
                const isStandard = FB_STANDARD_FIELDS.some(f => f.id === id);
                if (isStandard && allowStandard) {
                    const field = FB_STANDARD_FIELDS.find(f => f.id === id);
                    const config = fb_standard_config[field.id] || { enabled: true, required: false };
                    const isEnabled = config.enabled;
                    const isRequired = config.required;
                    const displayLabel = fb_getStandardLabel(field.id, field.label);
                    const stdMeta = fb_standard_meta[field.id] || {};
                    const effectiveType = stdMeta.type || field.type;
                    const effectiveField = { ...field, label: displayLabel, type: effectiveType };
                    const isFixedTopField = FB_FIXED_TOP_FIELDS.includes(field.id);
                    if (!isEnabled) return;
                    if (fb_filter_mode === 'required' && !isRequired) return;
                    if (!matches(displayLabel) && !matches('standard')) return;

                    const div = document.createElement('div');
                    div.className = 'w-full mb-3';
                    div.innerHTML = `<div class="system-card p-4 rounded-2xl flex flex-col gap-3 transition-all ${isEnabled ? 'border-emerald-100 hover:border-emerald-300 bg-white' : 'opacity-60 bg-slate-50'}">
                    <div class="flex items-center gap-3">
                        <div class="flex-1">
                            <div class="text-[13px] font-black text-slate-800 tracking-tight flex items-center gap-2">
                                <i class="fa-solid ${fb_getFieldIcon(effectiveField)} text-[13px] ${isEnabled ? 'text-emerald-600' : 'text-slate-400'}"></i>
                                <span>${displayLabel}</span>
                            </div>
                        </div>
                        <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            ${fb_getTypeLabel(effectiveType)}
                        </div>
                    </div>
                    <div class="flex items-center justify-end gap-2 border-t border-slate-50 pt-3">
                        ${qrEnabled && effectiveType !== 'image' && field.id !== 'photo' && effectiveType !== 'section' ? `
                        <button onclick="fb_toggleFieldQr('${field.id}')" class="w-9 h-9 rounded-full border-2 transition active:scale-95 hover:shadow-sm ${qrFields.includes(field.id) ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200'}" title="Include in QR Code">
                            <i class="fa-solid fa-qrcode text-[11px]"></i>
                        </button>
                        ` : ''}
                        <button onclick="fb_openStandardEditor('${field.id}')" class="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition active:scale-95" title="Edit">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="fb_removeStandardField('${field.id}')" class="w-9 h-9 rounded-full border ${isFixedTopField ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:shadow-sm'} transition active:scale-95" title="${isFixedTopField ? 'This field is fixed' : 'Delete'}">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                        <button onclick="fb_toggleStandardRequired('${field.id}')" class="w-9 h-9 rounded-full border-2 transition active:scale-95 hover:shadow-sm ${isRequired ? 'border-rose-500 bg-rose-500 text-white' : 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'}" title="Required">
                            <i class="fa-solid fa-asterisk text-[10px]"></i>
                        </button>
                        <button onclick="fb_moveFieldInOrder(${orderIndex}, -1)" class="w-9 h-9 rounded-full border ${isFixedTopField ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm'} transition active:scale-95" title="${isFixedTopField ? 'This field is fixed' : 'Move Up'}">
                            <i class="fa-solid fa-arrow-up text-xs"></i>
                        </button>
                        <button onclick="fb_moveFieldInOrder(${orderIndex}, 1)" class="w-9 h-9 rounded-full border ${isFixedTopField ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm'} transition active:scale-95" title="${isFixedTopField ? 'This field is fixed' : 'Move Down'}">
                            <i class="fa-solid fa-arrow-down text-xs"></i>
                        </button>
                    </div>
                    </div>`;
                    container.appendChild(div);
                    renderedCount++;
                } else if (!isStandard && allowCustom) {
                    const field = fb_fields.find(f => f.id === id);
                    if (!field) return;
                    if (fb_filter_mode === 'required' && !field.required) return;
                    if (!matches(field.label) && !matches(field.type) && !matches('custom')) return;
                    const div = document.createElement('div');
                    div.className = 'w-full group mb-3';
                    const isEditing = fb_currentEditingId === field.id;
                    div.innerHTML = `
                    <div class="system-card p-4 rounded-2xl transition-all border ${isEditing ? 'border-emerald-500 bg-emerald-50/20 shadow-lg' : 'hover:border-emerald-300'}">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-3">
                                <div>
                                    <div class="text-[13px] font-black text-slate-800 tracking-tight flex items-center gap-2">
                                        <i class="fa-solid ${fb_getFieldIcon(field)} text-[13px] text-emerald-600"></i>
                                        <span>${field.label} <span class="text-[10px] text-emerald-500 font-normal">(Custom)</span></span>
                                    </div>
                                </div>
                            </div>
                            <div class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                ${fb_getTypeLabel(field.type)}
                            </div>
                        </div>
                        <div class="mt-4 flex items-center justify-end gap-2 border-t border-slate-50 pt-3">
                            ${qrEnabled && field.type !== 'image' && field.type !== 'section' ? `
                            <button onclick="fb_toggleFieldQr('${field.id}')" class="w-9 h-9 rounded-full border-2 transition active:scale-95 hover:shadow-sm ${qrFields.includes(field.id) ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 text-slate-400 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200'}" title="Include in QR Code">
                                <i class="fa-solid fa-qrcode text-[11px]"></i>
                            </button>
                            ` : ''}
                            <button onclick="fb_openEditor('${field.id}')" class="w-9 h-9 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm transition active:scale-95" title="Edit">
                                <i class="fa-solid fa-pen text-xs"></i>
                            </button>
                            <button onclick="fb_deleteField('${field.id}')" class="w-9 h-9 rounded-full border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:shadow-sm transition active:scale-95" title="Delete">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                            <button onclick="fb_toggleRequired('${field.id}')" class="w-9 h-9 rounded-full border-2 transition active:scale-95 hover:shadow-sm ${field.required ? 'border-rose-500 bg-rose-500 text-white' : 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'}" title="Required">
                                <i class="fa-solid fa-asterisk text-[10px]"></i>
                            </button>
                            <button onclick="fb_moveFieldInOrder(${orderIndex}, -1)" class="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm transition active:scale-95" title="Move Up">
                                <i class="fa-solid fa-arrow-up text-xs"></i>
                            </button>
                            <button onclick="fb_moveFieldInOrder(${orderIndex}, 1)" class="w-9 h-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-sm transition active:scale-95" title="Move Down">
                                <i class="fa-solid fa-arrow-down text-xs"></i>
                            </button>
                        </div>
                    </div>`;
                    container.appendChild(div);
                    renderedCount++;
                }
            });

            if (emptyState) {
                emptyState.classList.toggle('hidden', renderedCount > 0);
                emptyState.classList.toggle('flex', renderedCount === 0);
            }

            fb_renderRemoved();
        }

        function fb_toggleStandardEnabled(id) {
            if (FB_FIXED_TOP_FIELDS.includes(id)) {
                if (!(id in fb_standard_config)) fb_standard_config[id] = { enabled: true, required: false };
                fb_standard_config[id].enabled = true;
                fb_renderForm();
                fb_syncToAppData();
                return;
            }
            if (!(id in fb_standard_config)) fb_standard_config[id] = { enabled: true, required: false };
            fb_standard_config[id].enabled = !fb_standard_config[id].enabled;
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_toggleStandardRequired(id) {
            if (!(id in fb_standard_config)) fb_standard_config[id] = { enabled: true, required: false };
            fb_standard_config[id].required = !fb_standard_config[id].required;
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_removeStandardField(id) {
            if (FB_FIXED_TOP_FIELDS.includes(id)) {
                showToast('Photo, Class and Gender are fixed fields.');
                return;
            }
            if (!(id in fb_standard_config)) fb_standard_config[id] = { enabled: true, required: false };
            fb_standard_config[id].enabled = false;
            const base = FB_STANDARD_FIELDS.find(f => f.id === id);
            const meta = fb_standard_meta[id] || {};
            const key = `standard:${id}`;
            const exists = fb_removed.find(r => String(r.__key || '') === key);
            if (!exists && base) {
                fb_removed.unshift({
                    __key: key,
                    __source: 'standard',
                    id: id,
                    label: fb_getStandardLabel(id, base.label),
                    type: meta.type || base.type,
                    options: Array.isArray(meta.options) ? meta.options.slice() : [],
                    required: !!fb_standard_config[id].required
                });
            }
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_moveFieldInOrder(orderIndex, dir) {
            if (!Array.isArray(fb_form_order)) return;
            let targetIndex = orderIndex + dir;
            
            // Find next visible field index
            while(targetIndex >= 0 && targetIndex < fb_form_order.length) {
                const id = fb_form_order[targetIndex];
                const isStandard = FB_STANDARD_FIELDS.some(f => f.id === id);
                let isVisible = true;
                if (isStandard) {
                    const config = fb_standard_config[id] || { enabled: true };
                    isVisible = config.enabled;
                } else {
                    const exists = fb_fields.some(f => f.id === id);
                    isVisible = exists;
                }
                if (isVisible) break;
                targetIndex += dir;
            }
            
            if (targetIndex < 0 || targetIndex >= fb_form_order.length) return;
            
            if (FB_FIXED_TOP_FIELDS.includes(fb_form_order[orderIndex]) || FB_FIXED_TOP_FIELDS.includes(fb_form_order[targetIndex])) {
                showToast('Photo, Class and Gender position is fixed.');
                return;
            }
            [fb_form_order[orderIndex], fb_form_order[targetIndex]] = [fb_form_order[targetIndex], fb_form_order[orderIndex]];
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_addField(type, customLabel, customOptions) {
            if (fb_fields.length >= FB_CUSTOM_LIMIT) {
                showToast(`Custom field limit reached (${FB_CUSTOM_LIMIT})`);
                return;
            }
            const id = String(Date.now());
            let label = customLabel || 'New Field';
            if (type === 'text') label = customLabel || 'New Name';
            if (type === 'number') label = customLabel || 'New Number';
            if (type === 'date') label = customLabel || 'New Date';
            if (type === 'select') label = customLabel || 'New Dropdown';
            if (type === 'image') label = customLabel || 'New Capture';

            const selectOptions = Array.isArray(customOptions) ? customOptions : ['Option 1', 'Option 2'];
            const newField = { id, type, label, placeholder: '', required: false, options: type === 'select' ? selectOptions : [] };
            fb_fields.push(newField);
            fb_form_order.push(id);
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_openQuickAdd() {
            const backdrop = document.getElementById('fb_quickAddBackdrop');
            if (backdrop) backdrop.classList.add('active');
            const typeEl = document.getElementById('fb_quickAddType');
            const labelEl = document.getElementById('fb_quickAddLabel');
            const optList = document.getElementById('fb_quickAddOptionsList');
            if (typeEl) typeEl.value = 'text';
            if (labelEl) labelEl.value = '';
            if (optList) optList.innerHTML = '';
            fb_toggleQuickAddOptions('text');
            fb_updateFieldNameSuggestions();
        }

        function fb_closeQuickAdd(evt) {
            if (evt && evt.target && evt.target.id !== 'fb_quickAddBackdrop') return;
            const backdrop = document.getElementById('fb_quickAddBackdrop');
            if (backdrop) backdrop.classList.remove('active');
        }

        function fb_updateFieldNameSuggestions() {
            const list = document.getElementById('fb_field_suggestions');
            if (!list) return;
            const presets = {
                text: ['Mother Name', 'Aadhaar No', 'Blood Group', 'Guardian Name', 'Nationality'],
                number: ['Roll No', 'Registration No', 'Scholar No', 'ID Card No'],
                select: ['Religion', 'Category', 'House', 'Section', 'Transport'],
                date: ['Admission Date', 'Registration Date']
            };
            const type = document.getElementById('fb_quickAddType').value;
            const names = presets[type] || [];
            list.innerHTML = names.map(n => `<option value="${n}"></option>`).join('');
        }

        function fb_toggleQuickAddOptions(type) {
            const wrap = document.getElementById('fb_quickAddOptionsWrap');
            if (wrap) wrap.classList.toggle('hidden', type !== 'select');
            if (type === 'select') fb_quickAddEnsureOptions();
        }

        function fb_quickAddEnsureOptions() {
            const list = document.getElementById('fb_quickAddOptionsList');
            if (list && list.children.length === 0) {
                fb_quickAddAddOption('Option 1');
                fb_quickAddAddOption('Option 2');
            }
        }

        function fb_quickAddAddOption(value = '') {
            const list = document.getElementById('fb_quickAddOptionsList');
            if (!list) return;
            const div = document.createElement('div');
            div.className = 'flex gap-2 items-center';
            div.innerHTML = `
            <input type="text" value="${value}" class="app-input py-2 text-sm flex-1 font-bold" placeholder="New Option">
            <button class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center" onclick="this.parentElement.remove()"><i class="fa-solid fa-times text-xs"></i></button>
        `;
            list.appendChild(div);
        }

        function fb_quickAddGetOptions() {
            const list = document.getElementById('fb_quickAddOptionsList');
            if (!list) return [];
            return Array.from(list.querySelectorAll('input')).map(i => (i.value || '').trim()).filter(Boolean);
        }

        function fb_confirmQuickAdd() {
            if (fb_fields.length >= FB_CUSTOM_LIMIT) {
                showToast(`Only ${FB_CUSTOM_LIMIT} custom fields supported.`);
                return;
            }
            const type = document.getElementById('fb_quickAddType').value;
            const label = document.getElementById('fb_quickAddLabel').value.trim();
            if (!label) {
                showToast('Please enter field name.');
                return;
            }
            const opts = type === 'select' ? fb_quickAddGetOptions() : [];
            if (type === 'select' && opts.length < 2) {
                showToast('Dropdown needs at least 2 options.');
                return;
            }
            fb_addField(type, label || undefined, opts);
            fb_closeQuickAdd();
            showToast('Custom field added.');
        }

        function fb_openEditor(id) {
            const field = fb_fields.find(f => String(f.id) === String(id));
            if (!field) return;
            fb_currentEditingId = id;
            fb_editor_draft = JSON.parse(JSON.stringify(field));
            const backdrop = document.getElementById('fb_edit_backdrop');
            if (backdrop) backdrop.classList.add('active');
            fb_renderEditor();
            fb_renderForm();
        }

        function fb_openStandardEditor(id) {
            const base = FB_STANDARD_FIELDS.find(f => f.id === id);
            if (!base) return;
            if (!(id in fb_standard_config)) fb_standard_config[id] = { enabled: true, required: false };
            const meta = fb_standard_meta[id] || {};
            fb_currentEditingId = `std:${id}`;
            fb_editor_draft = {
                __source: 'standard',
                id: id,
                type: meta.type || base.type,
                label: fb_getStandardLabel(id, base.label),
                required: !!fb_standard_config[id].required,
                enabled: !!fb_standard_config[id].enabled,
                options: Array.isArray(meta.options) && meta.options.length ? meta.options.slice() : fb_getStandardSelectOptions(id)
            };
            const backdrop = document.getElementById('fb_edit_backdrop');
            if (backdrop) backdrop.classList.add('active');
            fb_renderEditor();
            fb_renderForm();
        }

        function fb_closeEditor(evt) {
            if (evt && evt.target && evt.target.id !== 'fb_edit_backdrop') return;
            fb_currentEditingId = null;
            fb_editor_draft = null;
            const backdrop = document.getElementById('fb_edit_backdrop');
            if (backdrop) backdrop.classList.remove('active');
            fb_renderForm();
        }

        function fb_renderEditor() {
            const content = document.getElementById('fb_edit_content');
            if (!content || !fb_editor_draft) return;

            const field = fb_editor_draft;
            if (field.__source === 'standard') {
                const isFixedTopField = FB_FIXED_TOP_FIELDS.includes(String(field.id || ''));
                const typeOptions = ['text', 'number', 'date', 'select', 'image'].map(type => `<option value="${type}" ${field.type === type ? 'selected' : ''}>${type.toUpperCase()}</option>`).join('');
                const optionsHtml = (field.type === 'select')
                    ? `
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Dropdown Options</label>
                            <button onclick="fb_editorAddOption()" class="text-[10px] text-emerald-600 font-black uppercase tracking-widest">+ Add Option</button>
                        </div>
                        <div class="space-y-2">
                            ${(field.options || []).map((opt, idx) => `
                                <div class="flex gap-2 items-center">
                                    <input type="text" value="${String(opt).replace(/"/g, '&quot;')}" class="app-input py-2 text-sm flex-1 font-bold" oninput="fb_editorSetOption(${idx}, this.value)" placeholder="Option ${idx + 1}">
                                    <button class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center" onclick="fb_editorRemoveOption(${idx})"><i class="fa-solid fa-times text-xs"></i></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `
                    : '';
                content.innerHTML = `
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Field Label</label>
                    <input type="text" value="${String(field.label || '').replace(/"/g, '&quot;')}" class="app-input text-slate-700 font-bold" oninput="fb_editorSetLabel(this.value)" placeholder="Field label">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Field Type</label>
                    ${isFixedTopField
                        ? `<div class="app-input text-slate-500 font-bold bg-slate-100 cursor-not-allowed">${fb_getTypeLabel(field.type)} (Fixed)</div>`
                        : `<select class="app-input text-slate-700 font-bold" onchange="fb_editorSetType(this.value)">${typeOptions}</select>`
                    }
                </div>
                <div class="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between">
                    <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Field</div>
                    <button onclick="fb_editorToggleRequired()" class="h-8 px-3 rounded-xl border-2 ${field.required ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm' : 'border-slate-100 text-slate-500 bg-white'} text-[9px] font-black uppercase transition active:scale-95">
                        ${field.required ? 'ON' : 'OFF'}
                    </button>
                </div>
                ${optionsHtml}
                <button onclick="fb_applyEditor()" class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm active:scale-95 transition shadow-sm">APPLY CHANGES</button>
            `;
                return;
            }

            const typeOptions = ['text', 'number', 'date', 'select', 'image'].map(type => `<option value="${type}" ${field.type === type ? 'selected' : ''}>${type.toUpperCase()}</option>`).join('');
            const optionsHtml = field.type === 'select'
                ? `
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <label class="block text-[10px] font-black text-slate-400 uppercase ml-1">Dropdown Options</label>
                        <button onclick="fb_editorAddOption()" class="text-[10px] text-emerald-600 font-black uppercase tracking-widest">+ Add Option</button>
                    </div>
                    <div class="space-y-2">
                        ${(field.options || []).map((opt, idx) => `
                            <div class="flex gap-2 items-center">
                                <input type="text" value="${String(opt).replace(/"/g, '&quot;')}" class="app-input py-2 text-sm flex-1 font-bold" oninput="fb_editorSetOption(${idx}, this.value)" placeholder="Option ${idx + 1}">
                                <button class="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center" onclick="fb_editorRemoveOption(${idx})"><i class="fa-solid fa-times text-xs"></i></button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `
                : '';

            content.innerHTML = `
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Field Label</label>
                <input type="text" value="${String(field.label || '').replace(/"/g, '&quot;')}" class="app-input text-slate-700 font-bold" oninput="fb_editorSetLabel(this.value)" placeholder="Field label">
            </div>
            <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Field Type</label>
                <select class="app-input text-slate-700 font-bold" onchange="fb_editorSetType(this.value)">${typeOptions}</select>
            </div>
            <div class="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Required Field</div>
                <button onclick="fb_editorToggleRequired()" class="h-8 px-3 rounded-xl border-2 ${field.required ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm' : 'border-slate-100 text-slate-500 bg-white'} text-[9px] font-black uppercase transition active:scale-95">
                    ${field.required ? 'ON' : 'OFF'}
                </button>
            </div>
            ${optionsHtml}
            <button onclick="fb_applyEditor()" class="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm active:scale-95 transition shadow-sm">APPLY CHANGES</button>
        `;
        }

        function fb_editorSetLabel(value) {
            if (!fb_editor_draft) return;
            fb_editor_draft.label = value;
        }

        function fb_editorSetType(type) {
            if (!fb_editor_draft) return;
            fb_editor_draft.type = type;
            if (type === 'select') {
                if (!Array.isArray(fb_editor_draft.options) || fb_editor_draft.options.length < 2) {
                    fb_editor_draft.options = ['Option 1', 'Option 2'];
                }
            } else {
                fb_editor_draft.options = [];
            }
            fb_renderEditor();
        }

        function fb_editorToggleRequired() {
            if (!fb_editor_draft) return;
            fb_editor_draft.required = !fb_editor_draft.required;
            fb_renderEditor();
        }

        function fb_editorSetOption(index, value) {
            if (!fb_editor_draft || !Array.isArray(fb_editor_draft.options)) return;
            fb_editor_draft.options[index] = value;
        }

        function fb_editorAddOption() {
            if (!fb_editor_draft || fb_editor_draft.type !== 'select') return;
            if (!Array.isArray(fb_editor_draft.options)) fb_editor_draft.options = [];
            fb_editor_draft.options.push(`Option ${fb_editor_draft.options.length + 1}`);
            fb_renderEditor();
        }

        function fb_editorRemoveOption(index) {
            if (!fb_editor_draft || !Array.isArray(fb_editor_draft.options)) return;
            fb_editor_draft.options.splice(index, 1);
            fb_renderEditor();
        }

        function fb_applyEditor() {
            if (!fb_editor_draft) return;
            const label = String(fb_editor_draft.label || '').trim();
            if (!label) {
                showToast('Field label cannot be empty.');
                return;
            }

            if (fb_editor_draft.__source === 'standard') {
                const sid = String(fb_editor_draft.id || '');
                const base = FB_STANDARD_FIELDS.find(f => String(f.id) === sid);
                const cleanType = FB_FIXED_TOP_FIELDS.includes(sid)
                    ? String((base && base.type) || 'text')
                    : (String(fb_editor_draft.type || '').trim() || 'text');
                let cleanOptions = [];
                if (cleanType === 'select') {
                    cleanOptions = (fb_editor_draft.options || []).map(o => String(o || '').trim()).filter(Boolean);
                    if (cleanOptions.length < 1) {
                        showToast('Please keep at least 1 dropdown option.');
                        return;
                    }
                }
                fb_standard_labels[sid] = label;
                if (!(sid in fb_standard_config)) fb_standard_config[sid] = { enabled: true, required: false };
                fb_standard_config[sid].required = !!fb_editor_draft.required;
                fb_standard_meta[sid] = {
                    type: cleanType,
                    options: cleanType === 'select' ? cleanOptions : []
                };
                fb_syncToAppData();
                fb_closeEditor();
                showToast('Field updated.');
                return;
            }

            fb_editor_draft.label = label;
            if (fb_editor_draft.type === 'select') {
                const cleanOptions = (fb_editor_draft.options || []).map(o => String(o || '').trim()).filter(Boolean);
                if (cleanOptions.length < 2) {
                    showToast('Dropdown needs at least 2 options.');
                    return;
                }
                fb_editor_draft.options = cleanOptions;
            } else {
                fb_editor_draft.options = [];
            }
            const idx = fb_fields.findIndex(f => String(f.id) === String(fb_editor_draft.id));
            if (idx === -1) return;
            fb_fields[idx] = { ...fb_fields[idx], ...fb_editor_draft };
            fb_syncToAppData();
            fb_closeEditor();
            showToast('Field updated.');
        }

        // Ported compatibility helpers from source builder.
        function fb_togglePreview() {
            fb_isPreview = !fb_isPreview;
            fb_renderForm();
        }

        function fb_toggleWidth(id) {
            const field = fb_findField(id);
            if (!field) return;
            field.width = field.width === 'half' ? 'full' : 'half';
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_addOptionSimple(id) {
            const field = fb_findField(id);
            if (!field || field.type !== 'select') return;
            const value = prompt('Add option:');
            if (!value) return;
            field.options = Array.isArray(field.options) ? field.options : [];
            field.options.push(String(value).trim());
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_updateField(id, key, value) {
            const field = fb_findField(id);
            if (field) { field[key] = value; fb_renderForm(); fb_syncToAppData(); }
        }

        function fb_addOptionInline(id) {
            const field = fb_findField(id);
            if (field && field.options) { field.options.push(`Option ${field.options.length + 1}`); fb_renderForm(); fb_syncToAppData(); }
        }

        function fb_updateOption(id, index, value) {
            const field = fb_findField(id);
            if (field && field.options) { field.options[index] = value; fb_syncToAppData(); }
        }

        function fb_removeOption(id, index) {
            const field = fb_findField(id);
            if (field && field.options) { field.options.splice(index, 1); fb_renderForm(); fb_syncToAppData(); }
        }

        function fb_deleteField(id) {
            const index = fb_fields.findIndex(f => String(f.id) === String(id));
            if (index !== -1) {
                const removed = fb_fields.splice(index, 1)[0];
                removed.__source = 'custom';
                removed.__key = `custom:${removed.id}`;
                fb_removed.unshift(removed);
                fb_renderForm();
                fb_syncToAppData();
            }
        }

        function fb_restoreField(id) {
            const idx = fb_removed.findIndex(f => String(f.id) === String(id));
            if (idx === -1) return;
            const item = fb_removed[idx];
            if (item.__source === 'standard') {
                if (!(item.id in fb_standard_config)) fb_standard_config[item.id] = { enabled: true, required: false };
                fb_standard_config[item.id].enabled = true;
                if (typeof item.required === 'boolean') fb_standard_config[item.id].required = item.required;
                if (item.label) fb_standard_labels[item.id] = item.label;
                if (item.type || item.options) {
                    fb_standard_meta[item.id] = {
                        type: item.type || (fb_standard_meta[item.id] && fb_standard_meta[item.id].type) || 'text',
                        options: Array.isArray(item.options) ? item.options.slice() : []
                    };
                }
                fb_removed.splice(idx, 1);
                fb_renderForm();
                fb_syncToAppData();
                return;
            }

            if (fb_fields.length >= FB_CUSTOM_LIMIT) {
                showToast(`Limit reached. Remove one field to restore.`);
                return;
            }
            fb_fields.push(fb_removed.splice(idx, 1)[0]);
            fb_renderForm();
            fb_syncToAppData();
        }

        function fb_permanentlyDeleteField(id) {
            const idx = fb_removed.findIndex(f => String(f.id) === String(id));
            if (idx === -1) return;
            const item = fb_removed[idx];
            if (item.__source === 'standard') {
                if (!confirm(`Are you sure you want to permanently delete "${item.label || item.id}"?`)) {
                    return;
                }
            }
            fb_removed.splice(idx, 1);
            fb_renderForm();
            fb_syncToAppData();
            showToast(`Field permanently deleted`);
        }

        function fb_moveField(index, dir) {
            const next = index + dir;
            if (next >= 0 && next < fb_fields.length) {
                [fb_fields[index], fb_fields[next]] = [fb_fields[next], fb_fields[index]];
                fb_renderForm();
                fb_syncToAppData();
            }
        }

        function fb_toggleRequired(id) {
            const field = fb_findField(id);
            if (field) { field.required = !field.required; fb_renderForm(); fb_syncToAppData(); }
        }

        function fb_renderRemoved() {
            const section = document.getElementById('fb_removed_section');
            const list = document.getElementById('fb_removed_list');
            if (!section || !list) return;
            if (fb_removed.length === 0) { section.classList.add('hidden'); return; }
            section.classList.remove('hidden');
            list.innerHTML = fb_removed.map(f => `
            <div class="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                <span class="text-[11px] font-black text-slate-700 uppercase">${f.label || f.id}</span>
                <div class="flex gap-2">
                    <button onclick="fb_restoreField('${f.id}')" class="text-[9px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 px-3 py-1.5 rounded-lg active:scale-95 transition">RESTORE</button>
                    ${f.__source === 'standard' ? '' : `<button onclick="fb_permanentlyDeleteField('${f.id}')" class="text-[9px] font-black text-rose-600 uppercase tracking-widest border border-rose-100 px-3 py-1.5 rounded-lg active:scale-95 transition">DELETE</button>`}
                </div>
            </div>
        `).join('');
        }

        async function fb_saveForm() {
            const btn = document.querySelector('button[onclick="fb_saveForm()"]');
            const origText = btn ? btn.innerHTML : '';
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Saving...';
                btn.disabled = true;
            }

            localStorage.setItem('identify_fb_fields', JSON.stringify(fb_fields));
            localStorage.setItem('identify_fb_removed', JSON.stringify(fb_removed));
            localStorage.setItem('identify_fb_std_config', JSON.stringify(fb_standard_config));

            // Map to customFieldsConfig for backwards compatibility
            fb_fields.forEach((f, idx) => {
                if (idx < 5) {
                    customFieldsConfig[`customField${idx + 1}`] = { active: true, label: f.label };
                }
            });
            localStorage.setItem('identifyCustomFields', JSON.stringify(customFieldsConfig));

            // Sync to server if available
            const fbDataToSave = {
                fields: fb_fields,
                standardConfig: fb_standard_config,
                removed: fb_removed,
                formOrder: fb_form_order,
                standardLabels: typeof fb_standard_labels !== 'undefined' ? fb_standard_labels : {},
                standardMeta: typeof fb_standard_meta !== 'undefined' ? fb_standard_meta : {}
            };
            serverCallSilent('saveFormFields', [fbDataToSave], () => {
                if (btn) btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Saved';
                setTimeout(() => {
                    if (btn) {
                        btn.innerHTML = origText;
                        btn.disabled = false;
                    }
                    setBlankRecordMode('none');
                    showToast('Form updated successfully!');
                }, 1000);
            }, (err) => {
                console.error('Failed to sync fields to server', err);
                if (btn) btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Saved Locally';
                setTimeout(() => {
                    if (btn) {
                        btn.innerHTML = origText;
                        btn.disabled = false;
                    }
                    setBlankRecordMode('none');
                    showToast('Fields saved locally.');
                }, 1000);
            });
        }
            let cropperInstance = null;
            function openCropModal() {
                const img = document.getElementById('blank-photo-preview-img');
                if (!img || !img.src) return;

                const modal = document.getElementById('crop-modal');
                const cropImg = document.getElementById('crop-modal-img');

                cropImg.src = img.src;
                modal.classList.remove('hidden');
                modal.classList.add('flex');

                const pMeta = (typeof fb_standard_meta !== 'undefined' ? fb_standard_meta['photo'] : null) || (schoolConfig && schoolConfig.formMeta && schoolConfig.formMeta['photo']) || {};
                const cWidth = pMeta.width || 600;
                const cHeight = pMeta.height || 800;

                if (cropperInstance) { cropperInstance.destroy(); }
                cropperInstance = new Cropper(cropImg, {
                    aspectRatio: cWidth / cHeight,
                    viewMode: 1,
                    autoCropArea: 1,
                });
            }

            function closeCropModal() {
                const modal = document.getElementById('crop-modal');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
                if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
            }

            function applyCrop() {
                if (!cropperInstance) return;
                const pMeta = (typeof fb_standard_meta !== 'undefined' ? fb_standard_meta['photo'] : null) || (schoolConfig && schoolConfig.formMeta && schoolConfig.formMeta['photo']) || {};
                const cWidth = pMeta.width || 600;
                const cHeight = pMeta.height || 800;
                const canvas = cropperInstance.getCroppedCanvas({
                    width: cWidth,
                    height: cHeight,
                });
                if (canvas) {
                    // Use 0.6 quality to ensure base64 image fits comfortably in Firestore 1MB limit
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    photoData = dataUrl;
                    showPhotoPreview(photoData);
                    if (typeof queueServerDraftSync === 'function') queueServerDraftSync();
                    renderCurrentRecordsPage();
                }
                closeCropModal();
            }
    