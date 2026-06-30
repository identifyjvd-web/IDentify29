
    let ie_importParsedData = [];
    let ie_importHeaders = [];

    function buildImportExportHtml() {
        return `
            <div class="p-6 bg-white rounded-3xl system-card flex flex-col items-start w-full max-w-md mx-auto mb-20">
                <div class="w-full space-y-4">
                    
                    <!-- Import Content -->
                    <div id="ie-content-import" class="space-y-4 block w-full">
                        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm w-full">
                            <h3 class="text-[11px] font-black text-slate-800 mb-3 uppercase tracking-wider flex items-center gap-2"><i class="fa-solid fa-file-excel text-emerald-500"></i> Upload Excel File</h3>
                            <label id="ie-upload-label" class="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-emerald-100 transition group w-full text-center gap-3">
                                <i class="fa-solid fa-cloud-arrow-up text-emerald-600 text-lg"></i>
                                <span class="text-xs font-bold text-slate-700">Select File</span>
                                <input type="file" id="ie-import-file" accept=".xlsx, .xls" class="hidden" onchange="ie_handleFileUpload(event)">
                            </label>
                            <div id="ie-import-file-details" class="hidden mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 relative group">
                                <div class="flex items-center gap-2 mb-1">
                                    <i class="fa-solid fa-file-excel text-emerald-500 text-sm"></i>
                                    <p id="ie-import-filename" class="text-xs font-bold text-slate-800 truncate pr-6"></p>
                                </div>
                                <div class="flex justify-between items-center text-[10px] text-slate-500 font-medium pl-6">
                                    <span id="ie-import-filesize"></span>
                                    <span id="ie-import-rowcount" class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold"></span>
                                </div>
                                <button type="button" onclick="ie_removeImportFile()" class="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Remove File">
                                    <i class="fa-solid fa-xmark text-xs"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div id="ie-import-mapping-container" class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hidden w-full">
                            <h3 class="text-[11px] font-black text-slate-800 mb-1.5 uppercase tracking-wider flex items-center gap-2"><i class="fa-solid fa-list-check text-emerald-500"></i> Select Columns to Import</h3>
                            <p class="text-[10px] text-slate-500 mb-3 leading-tight">We found these columns in your Excel file. Select the ones you want to import.</p>
                            
                            <div class="flex items-center gap-2 px-3 mb-2">
                                <span class="w-1/2 text-[10px] font-black text-slate-500 uppercase tracking-wider pl-6">Excel Column</span>
                                <span class="w-1/2 text-[10px] font-black text-slate-500 uppercase tracking-wider pl-4">System Field</span>
                            </div>

                            <div id="ie-import-columns-grid" class="grid grid-cols-2 gap-2">
                                <!-- Injected by JS -->
                            </div>
                        </div>
                        
                        <button onclick="ie_runImport()" id="ie-btn-import" class="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-black text-[13px] uppercase tracking-widest hover:bg-emerald-700 transition active:scale-[0.98] shadow-md flex items-center justify-center gap-2 hidden mt-2">
                            <i class="fa-solid fa-upload"></i> Import Now
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function openImportExportModal() {
        setBlankRecordMode('import_export');
    }
    
    function closeImportExportModal() {
        // Obsolete
    }
    
    function ie_switchTab(tab) {
        // Obsolete
    }
    

    function ie_removeImportFile() {
        document.getElementById('ie-import-file').value = '';
        const label = document.getElementById('ie-upload-label');
        if (label) label.classList.remove('hidden');
        document.getElementById('ie-import-file-details').classList.add('hidden');
        document.getElementById('ie-import-mapping-container').classList.add('hidden');
        document.getElementById('ie-btn-import').classList.add('hidden');
        document.getElementById('ie-import-columns-grid').innerHTML = '';
        ie_importParsedData = [];
        ie_importHeaders = [];
    }
    
    function ie_handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const label = document.getElementById('ie-upload-label');
        if (label) label.classList.add('hidden');
        
        document.getElementById('ie-import-filename').textContent = file.name;
        document.getElementById('ie-import-filesize').textContent = (file.size / 1024).toFixed(1) + ' KB';
        document.getElementById('ie-import-file-details').classList.remove('hidden');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            ie_importParsedData = XLSX.utils.sheet_to_json(worksheet, {defval: ""});
            
            document.getElementById('ie-import-rowcount').textContent = ie_importParsedData.length + ' Rows';
            
            if (ie_importParsedData.length > 0) {
                ie_importHeaders = Object.keys(ie_importParsedData[0]);
                
                let optionsHtml = '<option value="">-- Ignore Column --</option>';
                if (typeof FB_STANDARD_FIELDS !== 'undefined') {
                    FB_STANDARD_FIELDS.forEach(sf => {
                        optionsHtml += `<option value="${sf.id}">${sf.label}</option>`;
                    });
                }
                if (typeof fb_fields !== 'undefined') {
                    fb_fields.forEach(cf => {
                        if (cf.type !== 'section' && cf.type !== 'image' && cf.id !== 'photo') {
                            optionsHtml += `<option value="${cf.id}">${cf.label}</option>`;
                        }
                    });
                }
                
                let html = '';
                ie_importHeaders.forEach((h, idx) => {
                    const hLower = h.toLowerCase().trim();
                    let matchedId = '';
                    
                    if (typeof FB_STANDARD_FIELDS !== 'undefined') {
                        FB_STANDARD_FIELDS.forEach(sf => {
                            if (sf.label.toLowerCase() === hLower || sf.id.toLowerCase() === hLower) matchedId = sf.id;
                        });
                    }
                    if (!matchedId && typeof fb_fields !== 'undefined') {
                        fb_fields.forEach(cf => {
                            if (cf.label.toLowerCase() === hLower || cf.id.toLowerCase() === hLower) matchedId = cf.id;
                        });
                    }
                    
                    let selectHtml = optionsHtml;
                    if (matchedId) {
                        selectHtml = selectHtml.replace(`value="${matchedId}"`, `value="${matchedId}" selected`);
                    }
                    
                    html += `
                        <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                            <label class="flex items-center gap-2 flex-1 cursor-pointer w-1/2 overflow-hidden">
                                <input type="checkbox" value="${h}" id="ie-cb-${idx}" class="ie-import-cb accent-emerald-600 w-3.5 h-3.5 shrink-0" checked>
                                <span class="text-[11px] font-bold text-slate-700 truncate" title="${h}">${h}</span>
                            </label>
                            <i class="fa-solid fa-arrow-right-long text-slate-300 text-[10px] shrink-0"></i>
                            <select id="ie-sel-${idx}" class="ie-import-sel flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-1/2 truncate shrink-0">
                                ${selectHtml}
                            </select>
                        </div>
                    `;
                });
                
                const grid = document.getElementById('ie-import-columns-grid');
                grid.className = 'flex flex-col gap-2 max-h-60 overflow-y-auto custom-scroll pr-1';
                grid.innerHTML = html;
                document.getElementById('ie-import-mapping-container').classList.remove('hidden');
                document.getElementById('ie-btn-import').classList.remove('hidden');
            } else {
                showToast("The selected Excel file is empty.", true);
            }
        };
        reader.readAsArrayBuffer(file);
    }
    
    async function ie_runImport() {
        const btn = document.getElementById('ie-btn-import');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importing...';
        btn.disabled = true;
        
        try {
            const selectedInputs = Array.from(document.querySelectorAll('.ie-import-cb:checked'));
            if (selectedInputs.length === 0) throw new Error("No columns selected for import.");
            
            const mapping = {};
            selectedInputs.forEach(cb => {
                const col = cb.value;
                const idx = cb.id.replace('ie-cb-', '');
                const sel = document.getElementById('ie-sel-' + idx);
                let matchedId = sel ? sel.value : null;
                
                mapping[col] = matchedId || col.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            });
            
            let importCount = 0;
            const schoolId = (schoolConfig && schoolConfig.loginId) ? schoolConfig.loginId : (currentUser ? currentUser.userId : 'anonymous');
            
            for (let i = 0; i < ie_importParsedData.length; i++) {
                const row = ie_importParsedData[i];
                const record = {
                    createdAt: Date.now(),
                    schoolId: schoolId,
                    deviceId: localStorage.getItem('device_id') || 'web-import',
                    syncStatus: 'synced'
                };
                
                let hasPhoto = false;
                
                selectedInputs.forEach(cb => {
                    const col = cb.value;
                    const val = row[col];
                    const sysId = mapping[col];
                    record[sysId] = val;
                    
                    if (sysId === 'photoData' || sysId === 'docUrl' || col.toLowerCase() === 'photo' || col.toLowerCase() === 'image') {
                        if (val && val.length > 5) {
                            record.docUrl = val;
                            hasPhoto = true;
                        }
                    }
                });
                
                if (hasPhoto) {
                    record.status = 'unverified';
                    record.verified = false; 
                    record.returned = false;
                } else {
                    record.status = 'pending';
                    record.verified = false;
                    record.returned = false;
                }
                
                record.id = 'draft_' + Date.now() + '_' + Math.floor(Math.random() * 1000000) + '_' + i;
                db.unshift(record);
                serverCallSilent('addRecord', [record], ()=>{}, ()=>{});
                importCount++;
                
                // Update UI every 10 records and yield
                if (importCount > 0 && importCount % 10 === 0) {
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Importing ${importCount} / ${ie_importParsedData.length}`;
                    await new Promise(r => setTimeout(r, 0));
                }
            }
            
            filterRecords();
            renderHomeAnalysis();
            closeImportExportModal();
            showModal('success', 'Import Successful', `Successfully imported ${importCount} records into the pending list.`);
            ie_removeImportFile();
        } catch(err) {
            console.error(err);
            showToast("Import failed: " + err.message, true);
        } finally {
            btn.innerHTML = origHTML;
            btn.disabled = false;
        }
    }

    let tempPreviewPhotoData = null;

    window.openPreviewPhotoActionModal = function() {
        if (!previewRecord) return;
        const modal = document.getElementById('custom-modal');
        const iconDiv = document.getElementById('modal-icon');
        const actions = document.getElementById('modal-actions');
        const closeIcon = document.getElementById('modal-close-icon');
        
        modal.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.remove('hidden');

        document.getElementById('modal-title').textContent = previewRecord.studentName || 'Student';
        document.getElementById('modal-msg').textContent = 'Upload or capture a new photo.';
        iconDiv.className = "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100";
        iconDiv.innerHTML = '<i class="fa-solid fa-user-tie text-4xl"></i>';
        
        actions.innerHTML = `
            <div class="flex flex-col gap-3 w-full">
                <button onclick="closeModal(); triggerPreviewPopupUpload(false);" class="premium-btn-green py-3 !rounded-[18px] w-full flex items-center justify-center gap-2">
                    <i class="fa-solid fa-cloud-arrow-up text-sm"></i> Upload
                </button>
                <button onclick="closeModal(); triggerPreviewPopupUpload(true);" class="premium-btn-green py-3 !rounded-[18px] w-full flex items-center justify-center gap-2">
                    <i class="fa-solid fa-camera text-sm"></i> Capture
                </button>
            </div>
        `;
    };

    window.triggerPreviewPopupUpload = function(capture) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (capture) input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            setUploadFieldProgress('Compressing...', 10, true);
            compressImage(file, (compFile, dataUrl) => {
                tempPreviewPhotoData = dataUrl;
                showPreviewPhotoOptionsModal();
            });
        };
        input.click();
    };

    window.showPreviewPhotoOptionsModal = function() {
        const modal = document.getElementById('custom-modal');
        const iconDiv = document.getElementById('modal-icon');
        const actions = document.getElementById('modal-actions');
        
        modal.classList.remove('hidden');
        document.getElementById('modal-title').textContent = 'Photo Selected';
        document.getElementById('modal-msg').textContent = 'What would you like to do with this photo?';
        
        iconDiv.className = "w-32 h-32 rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-emerald-100 bg-black";
        iconDiv.innerHTML = `<img src="${tempPreviewPhotoData}" class="w-full h-full object-contain">`;
        
        actions.innerHTML = `
            <button onclick="closeModal(); openPreviewCropModal();" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-[13px]"><i class="fa-solid fa-crop-simple mr-1"></i> Crop</button>
            <button onclick="closeModal(); savePreviewPopupPhoto();" class="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 text-[13px]"><i class="fa-solid fa-check mr-1"></i> Save</button>
            <button onclick="closeModal(); tempPreviewPhotoData = null; openPreviewPhotoActionModal();" class="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 text-[13px]"><i class="fa-solid fa-trash mr-1"></i> Delete</button>
        `;
    };

    window.openPreviewCropModal = function() {
        if (!tempPreviewPhotoData) return;
        const modal = document.getElementById('crop-modal');
        const cropImg = document.getElementById('crop-modal-img');

        cropImg.src = tempPreviewPhotoData;
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const pMeta = (typeof fb_standard_meta !== 'undefined' ? fb_standard_meta['photo'] : null) || (schoolConfig && schoolConfig.formMeta && schoolConfig.formMeta['photo']) || {};
        const cWidth = pMeta.width || 600;
        const cHeight = pMeta.height || 800;

        if (window.cropperInstance) { window.cropperInstance.destroy(); }
        window.cropperInstance = new Cropper(cropImg, {
            aspectRatio: cWidth / cHeight,
            viewMode: 1,
            autoCropArea: 1,
        });

        const originalApplyCrop = window.applyCrop;
        const originalCloseCropModal = window.closeCropModal;

        window.applyCrop = function() {
            if (!window.cropperInstance) return;
            const pMeta = (typeof fb_standard_meta !== 'undefined' ? fb_standard_meta['photo'] : null) || (schoolConfig && schoolConfig.formMeta && schoolConfig.formMeta['photo']) || {};
            const cWidth = pMeta.width || 600;
            const cHeight = pMeta.height || 800;
            const canvas = window.cropperInstance.getCroppedCanvas({ width: cWidth, height: cHeight });
            if (canvas) {
                tempPreviewPhotoData = canvas.toDataURL('image/jpeg', 0.6);
            }
            // Restore original functions
            window.applyCrop = originalApplyCrop;
            window.closeCropModal = originalCloseCropModal;
            originalCloseCropModal();
            showPreviewPhotoOptionsModal();
        };

        window.closeCropModal = function() {
            // Restore original functions
            window.applyCrop = originalApplyCrop;
            window.closeCropModal = originalCloseCropModal;
            originalCloseCropModal();
            showPreviewPhotoOptionsModal();
        };
    };

    window.savePreviewPopupPhoto = function() {
        if (!previewRecord || !tempPreviewPhotoData) return;
        commitUnsavedPreviewRecord();
        
        previewRecord.docUrl = tempPreviewPhotoData;
        previewRecord.photoData = tempPreviewPhotoData;
        previewRecord._displayPhotoSrc = tempPreviewPhotoData;
        
        // Move to unverified section
        previewRecord.verified = false;
        previewRecord.status = 'Pending';
        previewRecord.returned = false;
        
        storeRecordInDb(previewRecord);
        if (typeof queueServerDraftSync === 'function') queueServerDraftSync();
        if (!String(previewRecord.id).startsWith('draft_') && !String(previewRecord.id).startsWith('TEMP_')) {
            serverCallSilent('updateRecord', [previewRecord]);
        }
        
        showToast('Photo saved. Card moved to Unverified.');
        
        tempPreviewPhotoData = null;
        setBlankRecordMode('none');
        renderCurrentRecordsPage();
    };
    
    // Expose necessary functions to the global scope for inline HTML handlers
    
    