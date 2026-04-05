/**
 * Entropy Vault - Main Application Logic (Refined)
 * 100% Vanilla JavaScript | Privacy-First | Deterministic
 */

const App = {
    state: {
        images: [],
        audioEntropy: '',
        masterSeed: '',
        activeTab: 'identity',
        stegoMode: 'encode',
        encryptFiles: [],
        decryptFile: null,
        wordlist: [],
        context: 'personal',
        sessionTimeout: 60, // seconds
        timerInterval: null,
        isLocked: false,
        targetTab: null,
        isSecureMode: false,
        cameraStream: null
    },

    async init() {
        this.checkSecureContext();
        this.bindEvents();
        await this.loadWordlist();
        this.checkPWA();
        console.log('Entropy Vault Refined Initialized');
    },

    checkSecureContext() {
        if (!window.isSecureContext) {
            setTimeout(() => {
                this.notify('Insecure Context Detected: Camera, Microphone, and Clipboard APIs may be restricted. Use HTTPS for full functionality.', 'error');
            }, 1000);
        }
    },

    bindEvents() {
        // Navigation
        document.querySelectorAll('.tab-nav .tab-btn').forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });

        // Entropy Engine
        document.getElementById('btn-capture').onclick = () => this.openCamera();
        document.getElementById('file-input').onchange = (e) => this.handleFiles(e.target.files);
        document.getElementById('btn-record-audio').onclick = () => this.recordAudio();
        document.getElementById('btn-audio-entropy').onclick = () => document.getElementById('audio-input').click();
        document.getElementById('audio-input').onchange = (e) => this.handleAudioEntropy(e.target.files[0]);
        document.getElementById('btn-generate').onclick = () => this.initializeVault();
        document.getElementById('btn-reset').onclick = () => location.reload();

        // Home Shortcuts
        document.getElementById('btn-home-locker').onclick = () => {
            this.state.targetTab = 'vault';
            document.getElementById('file-input').click();
        };
        document.getElementById('btn-home-stego').onclick = () => {
            this.state.targetTab = 'ghost';
            document.getElementById('file-input').click();
        };

        // Session Lock
        document.getElementById('btn-unlock').onclick = () => this.unlockSession();
        document.getElementById('lock-timeout').oninput = (e) => this.updateSessionTimeout(e.target.value);

        // Close modals on backdrop click
        document.querySelectorAll('.modal, .legal-modal').forEach(modal => {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    if (modal.id === 'camera-modal') {
                        this.closeCamera();
                    } else {
                        modal.classList.remove('active');
                    }
                }
            };
        });

        // Context Profile & Secure Mode
        document.getElementById('profile-context').onchange = (e) => {
            this.state.context = e.target.value;
            this.notify(`Switched to ${this.state.context} context`, 'info');
            this.setupDashboard();
        };
        document.getElementById('btn-toggle-secure').onclick = () => this.toggleSecureMode();

        // Identity Engine
        document.getElementById('pass-length').oninput = (e) => {
            document.getElementById('pass-length-val').textContent = e.target.value;
            this.updatePasswordStrength();
        };
        document.getElementById('service-name').oninput = () => this.updatePasswordStrength();
        document.getElementById('btn-gen-password').onclick = () => this.generatePassword();
        document.getElementById('btn-regen-passphrase').onclick = () => this.generatePassphrase();
        document.getElementById('passphrase-count').onchange = () => this.generatePassphrase();

        // Vault Engine
        document.getElementById('btn-encrypt-upload').onclick = () => document.getElementById('encrypt-file-input').click();
        document.getElementById('encrypt-file-input').onchange = (e) => this.handleEncryptFiles(e.target.files);
        document.getElementById('btn-encrypt-file-run').onclick = () => this.encryptFilesBatch();

        document.getElementById('btn-decrypt-upload').onclick = () => document.getElementById('decrypt-file-input').click();
        document.getElementById('decrypt-file-input').onchange = (e) => this.handleDecryptFile(e.target.files[0]);
        document.getElementById('btn-decrypt-file-run').onclick = () => this.decryptFile();

        document.getElementById('btn-encrypt-text').onclick = () => this.encryptText();
        document.getElementById('btn-decrypt-text').onclick = () => this.decryptText();
        document.getElementById('btn-save-note').onclick = () => this.saveNote();
        document.getElementById('btn-load-note').onclick = () => this.loadNote();

        // Ghost Layer
        document.querySelectorAll('.stego-mode-toggle .mode-btn').forEach(btn => {
            btn.onclick = () => this.switchStegoMode(btn.dataset.mode);
        });
        document.getElementById('btn-stego-upload').onclick = () => document.getElementById('stego-file-input').click();
        document.getElementById('stego-file-input').onchange = (e) => this.handleStegoFile(e.target.files[0]);
        document.getElementById('btn-stego-process').onclick = () => this.processStego();
        document.getElementById('btn-stego-decode').onclick = () => this.decodeStego();

        // Tools
        document.getElementById('btn-export-qr-preview').onclick = () => this.exportQRPreview();
        document.getElementById('btn-export-json-preview').onclick = () => this.exportJSONPreview();
        document.getElementById('btn-download-qr').onclick = () => this.downloadQR();
        document.getElementById('btn-download-json').onclick = () => this.downloadJSON();
        document.getElementById('btn-import-seed-run').onclick = () => this.importSeed();
        document.getElementById('import-seed-input').oninput = (e) => this.validateImportSeed(e.target.value);
        
        // Paste Seed functionality
        document.getElementById('btn-paste-seed').onclick = async () => {
            try {
                const text = await navigator.clipboard.readText();
                const input = document.getElementById('import-seed-input');
                input.value = text.trim();
                this.validateImportSeed(input.value);
            } catch (err) {
                this.notify('Failed to read clipboard. Please paste manually.', 'error');
            }
        };

        document.getElementById('btn-split-seed').onclick = () => this.splitSeed();
        document.getElementById('btn-reconstruct-ui').onclick = () => {
            document.getElementById('reconstruct-zone').classList.toggle('hidden');
            document.getElementById('split-result').classList.add('hidden');
        };
        document.getElementById('btn-reconstruct-run').onclick = () => this.reconstructSeed();
        document.getElementById('btn-export-backup').onclick = () => this.exportBackup();
        document.getElementById('btn-import-backup-ui').onclick = () => document.getElementById('backup-input').click();
        document.getElementById('backup-input').onchange = (e) => this.importBackup(e.target.files[0]);

        // Utils
        document.getElementById('btn-copy-seed').onclick = (e) => this.copyToClipboard(this.state.masterSeed, e.target);
        document.querySelectorAll('.btn-copy-inline').forEach(btn => {
            btn.onclick = (e) => {
                const resultBox = btn.closest('.result-box') || btn.closest('.card') || btn.closest('.split-part');
                const code = resultBox.querySelector('code') || resultBox.querySelector('#passphrase-result');
                this.copyToClipboard(code.textContent, e.target);
            };
        });

        // Privacy Banner Logic
        if (!localStorage.getItem('privacy_accepted')) {
            document.getElementById('privacy-banner').classList.remove('hidden');
        }
        document.getElementById('btn-accept-privacy').onclick = () => {
            localStorage.setItem('privacy_accepted', 'true');
            document.getElementById('privacy-banner').classList.add('hidden');
        };

        // Legal Modals
        document.getElementById('link-privacy').onclick = (e) => {
            e.preventDefault();
            document.getElementById('privacy-modal').classList.add('active');
        };
        document.getElementById('link-terms').onclick = (e) => {
            e.preventDefault();
            document.getElementById('terms-modal').classList.add('active');
        };
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.onclick = (e) => {
                const modal = e.target.closest('.legal-modal') || e.target.closest('.modal');
                if (modal) modal.classList.remove('active');
            };
        });

        // Activity listener for session timer reset
        window.onclick = () => this.resetSessionTimer();
        window.onkeydown = () => this.resetSessionTimer();
    },

    // --- Notifications ---
    notify(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const toast = document.createElement('div');
        toast.className = `notification ${type}`;
        toast.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // --- Session Management ---
    updateSessionTimeout(val) {
        const seconds = parseInt(val);
        this.state.sessionTimeout = seconds;
        document.getElementById('lock-timeout-val').textContent = seconds === 0 ? 'Disabled' : seconds;
        this.resetSessionTimer();
        if (seconds === 0) {
            this.notify('Session timeout disabled', 'info');
        } else {
            this.notify(`Session timeout set to ${seconds}s`, 'info');
        }
    },

    startSessionTimer() {
        this.state.isLocked = false;
        document.getElementById('session-lock-overlay').classList.add('hidden');
        this.resetSessionTimer();
    },

    resetSessionTimer() {
        if (this.state.isLocked || this.state.sessionTimeout === 0) {
            clearInterval(this.state.timerInterval);
            if (this.state.sessionTimeout === 0) this.updateTimerUI('∞');
            return;
        }
        clearInterval(this.state.timerInterval);
        let timeLeft = this.state.sessionTimeout;
        this.updateTimerUI(timeLeft);

        this.state.timerInterval = setInterval(() => {
            timeLeft--;
            this.updateTimerUI(timeLeft);
            if (timeLeft <= 0) {
                this.lockSession();
            }
        }, 1000);
    },

    updateTimerUI(seconds) {
        const min = Math.floor(seconds / 60).toString().padStart(2, '0');
        const sec = (seconds % 60).toString().padStart(2, '0');
        document.getElementById('session-timer').textContent = `${min}:${sec}`;
    },

    lockSession() {
        this.state.isLocked = true;
        clearInterval(this.state.timerInterval);
        document.getElementById('session-lock-overlay').classList.remove('hidden');
        this.notify('Session locked for security', 'info');
    },

    unlockSession() {
        this.state.isLocked = false;
        document.getElementById('session-lock-overlay').classList.add('hidden');
        this.startSessionTimer();
        this.notify('Session unlocked', 'success');
    },

    toggleSecureMode() {
        this.state.isSecureMode = !this.state.isSecureMode;
        document.body.classList.toggle('secure-mode', this.state.isSecureMode);
        document.getElementById('secure-icon-off').classList.toggle('hidden', this.state.isSecureMode);
        document.getElementById('secure-icon-on').classList.toggle('hidden', !this.state.isSecureMode);
        document.getElementById('secure-mode-badge').classList.toggle('hidden', !this.state.isSecureMode);
        this.notify(`Secure Mode ${this.state.isSecureMode ? 'Enabled' : 'Disabled'}`, 'info');
    },

    // --- Entropy Engine ---
    async handleFiles(files) {
        for (const file of files) {
            try {
                const bitmap = await this.getBitmap(file);
                const hash = await this.extractEntropy(bitmap);
                this.state.images.push({ bitmap, hash });
                this.updateImageSlots();
                this.updateEntropyStats();
                this.updateStegoCapacity();
            } catch (e) {
                console.error('Failed to process image:', e);
                this.notify('Failed to process image: ' + file.name, 'error');
            }
        }
        if (files.length > 0) {
            this.notify(`${files.length} image(s) processed`, 'success');
        }
    },

    /**
     * Cross-browser compatible way to get an image bitmap or element
     */
    async getBitmap(file) {
        if (window.createImageBitmap) {
            try {
                return await createImageBitmap(file);
            } catch (e) {
                console.warn('createImageBitmap failed, falling back to Image object', e);
            }
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    },

    async handleAudioEntropy(file) {
        if (!file) return;
        const buffer = await file.arrayBuffer();
        this.state.audioEntropy = await CryptoEngine.extractAudioEntropy(buffer);
        this.updateEntropyStats();
        this.notify('Audio entropy added to pool', 'success');
        document.getElementById('btn-audio-entropy').classList.add('btn-primary');
        document.getElementById('btn-audio-entropy').classList.remove('btn-outline');
    },

    async recordAudio() {
        if (typeof MediaRecorder === 'undefined') {
            return this.notify('Media Recording is not supported in this browser.', 'error');
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", async () => {
                const audioBlob = new Blob(audioChunks);
                const buffer = await audioBlob.arrayBuffer();
                this.state.audioEntropy = await CryptoEngine.extractAudioEntropy(buffer);
                this.updateEntropyStats();
                this.notify('Audio entropy recorded', 'success');
                
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            });

            const btn = document.getElementById('btn-record-audio');
            const originalText = btn.innerHTML;
            btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg> Stop Recording`;
            btn.classList.add('recording');
            btn.classList.add('btn-primary');
            btn.classList.remove('btn-outline');

            mediaRecorder.start();
            
            btn.onclick = () => {
                mediaRecorder.stop();
                btn.innerHTML = originalText;
                btn.classList.remove('recording');
                btn.onclick = () => this.recordAudio();
            };

        } catch (err) {
            console.error("Error accessing microphone:", err);
            this.notify('Microphone access denied or unavailable', 'error');
        }
    },

    updateEntropyStats() {
        const imgCount = this.state.images.length;
        const hasAudio = !!this.state.audioEntropy;
        
        document.getElementById('count-images').textContent = imgCount;
        document.getElementById('status-audio').textContent = hasAudio ? 'Active' : 'None';
        
        const strengthEl = document.getElementById('entropy-strength');
        if (imgCount === 0 && !hasAudio) {
            strengthEl.textContent = 'None';
            strengthEl.style.color = 'var(--text-secondary)';
        } else if (imgCount < 2 && !hasAudio) {
            strengthEl.textContent = 'Weak';
            strengthEl.style.color = '#ef4444';
        } else if (imgCount < 3 && !hasAudio) {
            strengthEl.textContent = 'Moderate';
            strengthEl.style.color = '#f59e0b';
        } else {
            strengthEl.textContent = 'Strong';
            strengthEl.style.color = '#10b981';
        }

        document.getElementById('btn-generate').disabled = (imgCount === 0 && !hasAudio);
    },

    async extractEntropy(bitmap) {
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hashBuffer = await CryptoEngine.sha256(imageData.data.buffer);
        
        // Cleanup
        canvas.width = 0; canvas.height = 0;
        return CryptoEngine.bufferToHex(hashBuffer);
    },

    updateImageSlots() {
        const container = document.getElementById('image-slots');
        container.innerHTML = '';
        this.state.images.forEach((img, idx) => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 80;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img.bitmap, 0, 0, 80, 80);
            slot.appendChild(canvas);
            container.appendChild(slot);
        });
        const empty = document.createElement('div');
        empty.className = 'slot empty';
        empty.onclick = () => document.getElementById('file-input').click();
        empty.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
        container.appendChild(empty);
    },

    async initializeVault() {
        console.log('Initializing Vault...');
        document.getElementById('btn-generate').disabled = true;
        this.showView('processing');
        this.updateProgress(10);
        
        try {
            // Extract entropy from each image if not already done
            for (let i = 0; i < this.state.images.length; i++) {
                if (!this.state.images[i].hash) {
                    this.updateProgress(10 + (i / this.state.images.length) * 40);
                    this.state.images[i].hash = await this.extractEntropy(this.state.images[i].bitmap);
                }
            }
            
            this.updateProgress(60);
            
            // Combine all entropy (images + audio)
            let combinedHash = this.state.images.map(img => img.hash).join('') + this.state.audioEntropy;
            
            // If no entropy sources, use system random as fallback (though button should be disabled)
            if (!combinedHash) {
                const random = crypto.getRandomValues(new Uint8Array(32));
                combinedHash = CryptoEngine.bufferToHex(random);
            }
            
            // Final master seed derivation
            const finalBuffer = await CryptoEngine.sha256(combinedHash);
            this.state.masterSeed = CryptoEngine.bufferToHex(finalBuffer);
            
            this.updateProgress(80);
            
            // Generate visual heatmap
            try {
                await this.generateHeatmap();
            } catch (e) {
                console.warn('Heatmap generation failed:', e);
            }
            
            this.cleanupMemory();
            this.updateProgress(100);
            
            setTimeout(() => {
                this.setupDashboard();
                this.showView('dashboard');
                if (this.state.targetTab) {
                    this.switchTab(this.state.targetTab);
                    this.state.targetTab = null;
                }
                this.startSessionTimer();
                console.log('Vault Initialized Successfully');
            }, 800);
        } catch (error) {
            console.error('Vault Initialization Failed:', error);
            this.notify('Initialization failed: ' + error.message, 'error');
            this.showView('entry');
            document.getElementById('btn-generate').disabled = false;
        }
    },

    cleanupMemory() {
        this.state.images.forEach(img => {
            if (img.bitmap && img.bitmap.close) {
                try {
                    img.bitmap.close();
                } catch (e) {
                    console.warn('Failed to close bitmap', e);
                }
            }
        });
        // Clear references
        this.state.images = this.state.images.map(img => ({ hash: img.hash }));
        
        // Reset canvas dimensions to free GPU memory
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(c => {
            if (c.id !== 'avatar-canvas' && c.id !== 'qr-canvas') {
                c.width = 0; c.height = 0;
            }
        });
        console.log('Memory cleaned up');
    },

    async generateHeatmap() {
        const canvas = document.getElementById('heatmap-canvas');
        if (this.state.images.length === 0 || !this.state.images[0].bitmap) return;
        const img = this.state.images[0].bitmap;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const width = canvas.width;
        const height = canvas.height;
        const output = new Uint8ClampedArray(data.length);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                let variance = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nIdx = ((y + dy) * width + (x + dx)) * 4;
                        variance += Math.abs(data[idx] - data[nIdx]);
                    }
                }
                const v = Math.min(255, variance * 2);
                output[idx] = 0; output[idx+1] = v; output[idx+2] = v; output[idx+3] = 255;
            }
        }
        ctx.putImageData(new ImageData(output, width, height), 0, 0);
    },

    // --- Identity Engine ---
    async setupDashboard() {
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const checksum = await CryptoEngine.calculateChecksum(this.state.masterSeed);
        
        document.getElementById('display-seed').textContent = contextSeed.slice(0, 16) + '...';
        document.getElementById('seed-checksum').textContent = checksum;
        document.getElementById('active-context-display').textContent = this.state.context;
        
        this.generateShadowIdentity(contextSeed);
        this.generatePassphrase(contextSeed);
        this.generateFingerprint(this.state.masterSeed);
        this.updateStegoCapacity();
        this.updatePasswordStrength();
    },

    async generateShadowIdentity(seed) {
        const prefixes = ['Silent', 'Ghost', 'Neon', 'Cyber', 'Dark', 'Void', 'Zenith', 'Onyx', 'Prism', 'Vector'];
        const suffixes = ['Stalker', 'Runner', 'Protocol', 'Cipher', 'Node', 'Wave', 'Core', 'Link'];
        
        const drng = CryptoEngine.createDRNG(seed);
        const pIdx = Math.floor(drng() * prefixes.length);
        const sIdx = Math.floor(drng() * suffixes.length);
        
        document.getElementById('shadow-username').textContent = `${prefixes[pIdx]}_${suffixes[sIdx]}`;
        document.getElementById('shadow-id').textContent = `ID: ${seed.slice(0, 8)}`;
        this.drawAvatar(seed);
    },

    drawAvatar(seed) {
        const canvas = document.getElementById('avatar-canvas');
        const ctx = canvas.getContext('2d');
        const drng = CryptoEngine.createDRNG(seed);
        
        ctx.clearRect(0, 0, 100, 100);
        ctx.fillStyle = `hsl(${drng() * 360}, 70%, 15%)`;
        ctx.fillRect(0, 0, 100, 100);

        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = `hsl(${drng() * 360}, 60%, 50%)`;
            const x = 10 + drng() * 40;
            const y = 10 + drng() * 80;
            const w = 5 + drng() * 15;
            const h = 5 + drng() * 15;
            ctx.fillRect(x, y, w, h);
            ctx.fillRect(100 - x - w, y, w, h);
        }
    },

    generateFingerprint(seed) {
        const container = document.getElementById('seed-fingerprint');
        container.innerHTML = '';
        const drng = CryptoEngine.createDRNG(seed);
        for (let i = 0; i < 64; i++) {
            const block = document.createElement('div');
            block.className = 'finger-block';
            block.style.backgroundColor = `hsl(${drng() * 360}, 60%, 50%)`;
            container.appendChild(block);
        }
    },

    updatePasswordStrength() {
        const service = document.getElementById('service-name').value;
        const len = parseInt(document.getElementById('pass-length').value);
        const bar = document.getElementById('password-strength-bar');
        
        bar.className = 'strength-bar';
        if (!service) return;

        if (len < 18) bar.classList.add('weak');
        else if (len < 24) bar.classList.add('medium');
        else bar.classList.add('strong');
    },

    async generatePassword() {
        const service = document.getElementById('service-name').value;
        const user = document.getElementById('username-context').value;
        const len = parseInt(document.getElementById('pass-length').value);
        if (!service) return this.notify('Service name required', 'error');
        
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const password = await CryptoEngine.generatePassword(contextSeed, service, user, len);
        document.getElementById('derived-password').textContent = password;
        document.getElementById('password-result').classList.remove('hidden');
        this.notify('Password generated', 'success');
    },

    async generatePassphrase(seed) {
        const s = seed || await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const count = parseInt(document.getElementById('passphrase-count').value) || 4;
        const phrase = await CryptoEngine.generatePassphrase(s, this.state.wordlist, count);
        document.getElementById('passphrase-result').textContent = phrase;
    },

    async loadWordlist() {
        // Check for global Wordlist from wordlist.js
        if (typeof Wordlist !== 'undefined' && Array.isArray(Wordlist) && Wordlist.length > 0) {
            this.state.wordlist = Wordlist;
            console.log(`Wordlist loaded: ${Wordlist.length} words`);
        } else {
            // Fallback system: Internal backup list
            console.warn('External wordlist not found. Using internal fallback.');
            this.state.wordlist = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray', 'yankee', 'zulu', 'nebula', 'pulsar', 'quasar', 'vortex', 'matrix', 'cipher', 'binary', 'crypto', 'secure', 'vault', 'shadow', 'ghost', 'silent', 'vector', 'pixel', 'entropy', 'random', 'logic', 'system', 'node', 'link', 'core', 'wave', 'data'];
        }
    },

    // --- Vault Engine ---
    handleEncryptFiles(files) {
        this.state.encryptFiles = Array.from(files);
        const list = document.getElementById('encrypt-file-list');
        list.innerHTML = '';
        let totalSize = 0;
        this.state.encryptFiles.forEach(f => {
            totalSize += f.size;
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `<span>${f.name}</span> <span>${(f.size/1024).toFixed(1)} KB</span>`;
            list.appendChild(item);
        });
        
        if (totalSize > 50 * 1024 * 1024) {
            this.notify('Warning: Large batch (>50MB). May be slow on mobile.', 'info');
        }
        document.getElementById('encrypt-file-info').classList.remove('hidden');
    },

    async encryptFilesBatch() {
        if (this.state.encryptFiles.length === 0) return;
        this.notify(`Encrypting ${this.state.encryptFiles.length} files...`, 'info');
        
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const key = await CryptoEngine.deriveKey(contextSeed, 'file-vault');

        for (const file of this.state.encryptFiles) {
            const buffer = await file.arrayBuffer();
            const encrypted = await CryptoEngine.encrypt(buffer, key);
            this.downloadBlob(new Blob([encrypted]), file.name + '.vault');
        }
        this.notify('Batch encryption complete', 'success');
    },

    handleDecryptFile(file) {
        if (!file) return;
        this.state.decryptFile = file;
        document.getElementById('decrypt-file-name').textContent = file.name;
        document.getElementById('decrypt-file-info').classList.remove('hidden');
        document.getElementById('decrypt-success').classList.add('hidden');
        document.getElementById('decrypt-error').classList.add('hidden');
    },

    async decryptFile() {
        if (!this.state.decryptFile) return;
        this.notify('Decrypting...', 'info');
        
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const key = await CryptoEngine.deriveKey(contextSeed, 'file-vault');

        try {
            const buffer = await this.state.decryptFile.arrayBuffer();
            const decrypted = await CryptoEngine.decrypt(new Uint8Array(buffer), key);
            const originalName = this.state.decryptFile.name.replace('.vault', '');
            this.downloadBlob(new Blob([decrypted]), originalName);
            document.getElementById('decrypt-success').classList.remove('hidden');
            this.notify('Decryption successful', 'success');
        } catch (e) {
            this.showDecryptError('Decryption failed. Incorrect seed or corrupted file.');
        }
    },

    showDecryptError(msg) {
        const err = document.getElementById('decrypt-error');
        document.getElementById('decrypt-error-text').textContent = msg;
        err.classList.remove('hidden');
        this.notify(msg, 'error');
    },

    async encryptText() {
        const text = document.getElementById('text-locker-input').value;
        if (!text) return;
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const key = await CryptoEngine.deriveKey(contextSeed, 'text-locker');
        const encrypted = await CryptoEngine.encrypt(new TextEncoder().encode(text), key);
        document.getElementById('text-locker-output').textContent = CryptoEngine.bufferToHex(encrypted);
        document.getElementById('text-locker-result').classList.remove('hidden');
        document.getElementById('text-locker-error').classList.add('hidden');
        this.notify('Text encrypted', 'success');
    },

    async decryptText() {
        const hex = document.getElementById('text-locker-input').value.trim();
        if (!hex) return;
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const key = await CryptoEngine.deriveKey(contextSeed, 'text-locker');
        try {
            const decrypted = await CryptoEngine.decrypt(CryptoEngine.hexToBytes(hex), key);
            document.getElementById('text-locker-output').textContent = new TextDecoder().decode(decrypted);
            document.getElementById('text-locker-result').classList.remove('hidden');
            document.getElementById('text-locker-error').classList.add('hidden');
            this.notify('Text decrypted', 'success');
        } catch (e) {
            document.getElementById('text-locker-error').classList.remove('hidden');
            this.notify('Decryption failed', 'error');
        }
    },

    async saveNote() {
        const note = document.getElementById('vault-notes').value;
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const key = await CryptoEngine.deriveKey(contextSeed, 'notes-vault');
        const encrypted = await CryptoEngine.encrypt(new TextEncoder().encode(note), key);
        localStorage.setItem(`vault_note_${this.state.context}`, CryptoEngine.bufferToHex(encrypted));
        this.notify('Note saved encrypted', 'success');
    },

    async loadNote() {
        const stored = localStorage.getItem(`vault_note_${this.state.context}`);
        if (!stored) return this.notify('No saved note for this context', 'info');
        const contextSeed = await CryptoEngine.deriveContextSeed(this.state.masterSeed, this.state.context);
        const key = await CryptoEngine.deriveKey(contextSeed, 'notes-vault');
        try {
            const decrypted = await CryptoEngine.decrypt(CryptoEngine.hexToBytes(stored), key);
            document.getElementById('vault-notes').value = new TextDecoder().decode(decrypted);
            this.notify('Note loaded', 'success');
        } catch (e) {
            this.notify('Failed to decrypt note', 'error');
        }
    },

    // --- Ghost Layer ---
    switchStegoMode(mode) {
        this.state.stegoMode = mode;
        document.querySelectorAll('.stego-mode-toggle .mode-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
        document.getElementById('stego-encode-zone').classList.toggle('hidden', mode !== 'encode');
        document.getElementById('stego-decode-zone').classList.toggle('hidden', mode !== 'decode');
    },

    async handleStegoFile(file) {
        if (!file) return;
        try {
            const bitmap = await this.getBitmap(file);
            this.state.stegoBitmap = bitmap;
            document.getElementById('stego-input-preview').src = URL.createObjectURL(file);
            this.updateStegoCapacity();
            this.notify('Stego image loaded', 'success');
        } catch (e) {
            this.notify('Failed to load stego image', 'error');
        }
    },

    updateStegoCapacity() {
        const bitmap = this.state.stegoBitmap || (this.state.images.length > 0 ? this.state.images[0].bitmap : null);
        if (!bitmap) return;
        const cap = LSBSteganography.calculateCapacity({ length: bitmap.width * bitmap.height * 4 });
        document.getElementById('stego-capacity').textContent = cap;
    },

    async processStego() {
        const message = document.getElementById('stego-message').value;
        const channel = document.getElementById('stego-channel').value;
        const bitmap = this.state.stegoBitmap || (this.state.images.length > 0 ? this.state.images[0].bitmap : null);
        
        if (!message || !bitmap) return this.notify('Message and image source required', 'error');
        
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        
        // Show original preview
        document.getElementById('stego-input-preview').src = canvas.toDataURL('image/png');
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
            const encodedData = LSBSteganography.encode(imageData.data, message, channel);
            ctx.putImageData(new ImageData(encodedData, canvas.width, canvas.height), 0, 0);
            const resultImg = document.getElementById('stego-output-img');
            resultImg.src = canvas.toDataURL('image/png');
            document.getElementById('btn-download-stego').href = resultImg.src;
            document.getElementById('stego-result').classList.remove('hidden');
            this.notify('Message embedded successfully', 'success');
            
            // Cleanup
            canvas.width = 0; canvas.height = 0;
        } catch (e) {
            this.notify(e.message, 'error');
        }
    },

    async decodeStego() {
        const channel = document.getElementById('stego-channel').value;
        const bitmap = this.state.stegoBitmap || (this.state.images.length > 0 ? this.state.images[0].bitmap : null);
        if (!bitmap) return this.notify('Upload a stego image first', 'error');
        
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        try {
            const message = LSBSteganography.decode(imageData.data, channel);
            if (message) {
                document.getElementById('stego-message').value = message;
                this.switchStegoMode('encode');
                this.notify('Message extracted successfully', 'success');
            } else {
                this.notify('No hidden message found', 'error');
            }
            
            // Cleanup
            canvas.width = 0; canvas.height = 0;
        } catch (e) {
            this.notify('No hidden message found', 'error');
        }
    },

    // --- Tools ---
    exportQRPreview() {
        const canvas = document.getElementById('qr-canvas');
        CryptoEngine.generateQR(this.state.masterSeed, canvas, 200);
        document.getElementById('export-preview-zone').classList.remove('hidden');
        document.getElementById('qr-container').classList.remove('hidden');
        document.getElementById('json-preview-container').classList.add('hidden');
        this.notify('QR Preview generated', 'success');
    },

    downloadQR() {
        const canvas = document.getElementById('qr-canvas');
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'vault_seed_qr.png';
        link.href = url;
        link.click();
        this.notify('QR Seed downloaded', 'success');
    },

    async exportJSONPreview() {
        const checksum = await CryptoEngine.calculateChecksum(this.state.masterSeed);
        const data = {
            seed: this.state.masterSeed,
            checksum: checksum,
            version: '2.1',
            timestamp: Date.now()
        };
        const json = JSON.stringify(data, null, 2);
        document.getElementById('json-preview-text').textContent = json;
        document.getElementById('export-preview-zone').classList.remove('hidden');
        document.getElementById('json-preview-container').classList.remove('hidden');
        document.getElementById('qr-container').classList.add('hidden');
        this.state.exportData = data;
        this.notify('JSON Preview generated', 'success');
    },

    downloadJSON() {
        if (!this.state.exportData) return;
        this.downloadBlob(new Blob([JSON.stringify(this.state.exportData, null, 2)], { type: 'application/json' }), 'vault_export.json');
        this.notify('JSON Exported', 'success');
    },

    async validateImportSeed(seed) {
        const msg = document.getElementById('import-validation-msg');
        msg.classList.remove('hidden');
        
        if (!seed) {
            msg.classList.add('hidden');
            return false;
        }

        if (!/^[0-9a-fA-F]{64}$/.test(seed)) {
            msg.textContent = 'Invalid format: Must be 64-char hex';
            msg.className = 'error';
            return false;
        }

        const checksum = await CryptoEngine.calculateChecksum(seed);
        msg.textContent = `Valid Seed. Checksum: ${checksum}`;
        msg.className = 'success';
        return true;
    },

    async importSeed() {
        const seed = document.getElementById('import-seed-input').value.trim();
        const isValid = await this.validateImportSeed(seed);
        
        if (isValid) {
            this.state.masterSeed = seed;
            this.setupDashboard();
            this.showView('dashboard');
            this.startSessionTimer();
            this.notify('Seed imported successfully', 'success');
        } else {
            this.notify('Please enter a valid seed', 'error');
        }
    },

    splitSeed() {
        const parts = CryptoEngine.splitSeed(this.state.masterSeed);
        document.getElementById('seed-part-1').textContent = parts.part1;
        document.getElementById('seed-part-2').textContent = parts.part2;
        document.getElementById('split-result').classList.remove('hidden');
        document.getElementById('reconstruct-zone').classList.add('hidden');
        this.notify('Seed split into 2 parts', 'success');
    },

    reconstructSeed() {
        const p1 = document.getElementById('reconstruct-part-1').value.trim();
        const p2 = document.getElementById('reconstruct-part-2').value.trim();
        if (!p1 || !p2) return this.notify('Both parts required', 'error');
        try {
            const seed = CryptoEngine.reconstructSeed(p1, p2);
            if (/^[0-9a-fA-F]{64}$/.test(seed)) {
                this.state.masterSeed = seed;
                this.setupDashboard();
                this.showView('dashboard');
                this.startSessionTimer();
                this.notify('Seed reconstructed successfully', 'success');
            } else {
                this.notify('Invalid reconstructed seed', 'error');
            }
        } catch (e) {
            this.notify('Reconstruction failed: ' + e.message, 'error');
        }
    },

    async exportBackup() {
        this.notify('Preparing encrypted backup...', 'info');
        const key = await CryptoEngine.deriveKey(this.state.masterSeed, 'backup-vault');
        
        const backupData = {
            seed: this.state.masterSeed,
            notes: {},
            context: this.state.context,
            version: '2.1',
            timestamp: Date.now()
        };

        // Collect all context notes
        ['personal', 'work', 'ghost'].forEach(ctx => {
            const note = localStorage.getItem(`vault_note_${ctx}`);
            if (note) backupData.notes[ctx] = note;
        });

        const encrypted = await CryptoEngine.encrypt(new TextEncoder().encode(JSON.stringify(backupData)), key);
        this.downloadBlob(new Blob([encrypted]), `vault_backup_${Date.now()}.evb`);
        this.notify('Backup exported successfully', 'success');
    },

    async importBackup(file) {
        if (!file) return;
        this.notify('Importing backup...', 'info');
        
        // We need the seed to decrypt the backup, but if we are importing, we might not have it.
        // Usually, backup is for restoring to a new device where you HAVE the seed.
        // If the user doesn't have the seed, they can't decrypt the backup.
        if (!this.state.masterSeed) {
            const seed = prompt('Enter Master Seed to decrypt backup:');
            if (!seed) return;
            this.state.masterSeed = seed;
        }

        const key = await CryptoEngine.deriveKey(this.state.masterSeed, 'backup-vault');
        try {
            const buffer = await file.arrayBuffer();
            const decrypted = await CryptoEngine.decrypt(new Uint8Array(buffer), key);
            const data = JSON.parse(new TextDecoder().decode(decrypted));
            
            // Restore notes
            Object.keys(data.notes).forEach(ctx => {
                localStorage.setItem(`vault_note_${ctx}`, data.notes[ctx]);
            });
            
            this.state.context = data.context || 'personal';
            this.setupDashboard();
            this.showView('dashboard');
            this.startSessionTimer();
            this.notify('Backup restored successfully', 'success');
        } catch (e) {
            this.notify('Backup restoration failed. Incorrect seed or corrupted file.', 'error');
        }
    },

    // --- Camera ---
    async openCamera() {
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-video');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            this.state.cameraStream = stream;
            video.srcObject = stream;
            modal.classList.add('active');

            document.getElementById('btn-camera-shutter').onclick = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg'));
                const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
                this.handleFiles([file]);
                this.closeCamera();
            };

            document.getElementById('btn-camera-close').onclick = () => this.closeCamera();
        } catch (e) {
            this.notify('Camera access denied', 'error');
        }
    },

    closeCamera() {
        if (this.state.cameraStream) {
            this.state.cameraStream.getTracks().forEach(t => t.stop());
            this.state.cameraStream = null;
        }
        document.getElementById('camera-modal').classList.remove('active');
    },

    // --- UI Helpers ---
    showView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + viewId).classList.add('active');
    },

    switchTab(tabId) {
        this.state.activeTab = tabId;
        document.querySelectorAll('.tab-nav .tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.toggle('active', pane.id === 'tab-' + tabId));
    },

    updateProgress(val) {
        document.getElementById('progress-fill').style.width = val + '%';
    },

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    copyToClipboard(text, btn) {
        if (this.state.isSecureMode) {
            this.notify('Copying disabled in Secure Mode', 'error');
            return;
        }

        const onSuccess = () => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied ✓';
            btn.classList.add('success');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('success');
            }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
                this.fallbackCopy(text, onSuccess);
            });
        } else {
            this.fallbackCopy(text, onSuccess);
        }
    },

    fallbackCopy(text, callback) {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) callback();
            else this.notify('Copy failed. Please copy manually.', 'error');
        } catch (err) {
            this.notify('Copy failed. Please copy manually.', 'error');
        }
    },

    checkPWA() {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('Running as PWA');
        }
    }
};

window.onload = () => App.init();
