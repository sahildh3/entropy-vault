# Entropy Vault 🔐

**100% Offline, Deterministic Security Hub.**

Entropy Vault is a professional-grade security tool designed for individuals who demand absolute privacy and control over their digital identities. It transforms physical entropy (images, audio) into a mathematical master seed, which then derives all your passwords, identities, and encryption keys.

## 🚀 Core Features

### 🧠 Entropy Engine
Generate a high-entropy master seed by combining multiple sources. Use photos, camera captures, audio uploads, and live microphone recordings to create a unique cryptographic foundation. The engine provides real-time feedback on entropy strength.

### 🧪 Password Profiles V2
Generate strong, deterministic passwords for any service. Same seed + same service name = same password. No need to store them; just re-generate when needed. Includes a visual strength meter.

### 📜 Passphrase Forge
Create easy-to-remember but hard-to-crack 4-6 word passphrases using a built-in 2048-word dictionary.

### 👻 Ghost Layer (Steganography)
Hide sensitive messages inside images using Least Significant Bit (LSB) steganography. Support for Blue (Stealth) and Alpha (Capacity) channel encoding.

### 🔒 AES File & Text Locker
Military-grade file and text encryption (AES-GCM) that runs entirely in your browser. Encrypt photos, documents, archives, or secret notes without ever uploading them.

### 👤 Shadow Identity
Generate unique "Shadow Identities" (avatars, usernames, bios) tied to your master seed. Perfect for maintaining privacy across different platforms.

### 📦 Seed Vault & Backup
Securely export your master seed as a QR code or JSON backup. Includes a checksum system to verify integrity before recovery. You can also split your seed into parts or export/import full encrypted vault backups.

### 🛡️ Session & Context Management
- **Context Profiles**: Switch between Personal, Work, or Ghost profiles to generate entirely different outputs from the same seed.
- **Secure Mode**: A toggleable mode that disables clipboard operations and hides sensitive UI elements to prevent shoulder surfing.
- **Session Lock**: Automatically locks the vault after a period of inactivity.

## 🛠️ How It Works

1.  **Entropy Collection**: You provide random data (images, audio).
2.  **Seed Derivation**: The app hashes this data (SHA-256) to create a 256-bit Master Seed.
3.  **Deterministic Tools**: All tools use this seed (via PBKDF2 with 200,000 iterations) to derive specific keys and outputs.
4.  **Zero Storage**: The app does not store your seed. You are the vault.

## 📦 Installation & Deployment

### Local Use
1.  Download the repository.
2.  Open `index.html` in any modern web browser.
3.  (Optional) Disconnect from the internet for maximum security.

### Production Hosting
This project is optimized for static hosting (e.g., GitHub Pages, Vercel, Netlify).
- **No Backend**: Runs entirely in the browser.
- **No Build Step**: Pure HTML/CSS/JS.
- **PWA Ready**: Includes a service worker for offline access.

## 🛡️ Security Design

-   **Web Crypto API**: Uses native browser cryptography for maximum performance and security.
-   **AES-GCM**: Authenticated encryption for all file and text operations.
-   **PBKDF2**: Key stretching with 200,000 iterations to resist brute-force attacks.
-   **Deterministic**: No `Math.random()` is used for sensitive outputs. Everything is derived from your seed.

## 🌐 Technology Stack

-   **HTML5 / CSS3**: Modern, responsive UI with a cyber-dark aesthetic.
-   **Vanilla JavaScript**: No frameworks, no dependencies, no build steps.
-   **Canvas API**: For image processing and QR generation.
-   **Web Audio API**: For capturing and processing live audio entropy.

## ⚠️ CRITICAL WARNING: Seed Loss

**If you lose your Master Seed (or the exact sequence of images/audio used to generate it), you will PERMANENTLY lose access to:**
- All derived passwords and passphrases.
- All encrypted files and notes.
- All shadow identities.

**There is NO "Forgot Password" feature.** Entropy Vault does not store your seed anywhere. You are the sole custodian of your cryptographic keys. **Always export a backup of your seed (QR code, JSON, or Split Seed) and store it in a physically secure location.**

## 🔑 Browser Permissions Explained

To function as a 100% offline, client-side application, Entropy Vault requires certain browser permissions. These are only requested when you actively use the corresponding features:

- **Camera**: Required ONLY if you choose to use the "Capture Image" feature to generate entropy from live photos.
- **Microphone**: Required ONLY if you choose to use the "Record Audio" feature to generate entropy from ambient noise.
- **Clipboard**: Required to use the "Copy" buttons for passwords/seeds, and the "Paste" button for importing seeds.
- **Local Storage**: Used strictly to save your encrypted notes (if you use the "Save Encrypted" feature) and to remember that you dismissed the privacy banner. No tracking cookies are used.

## 📄 License & Credits

This project is licensed under the **MIT License**.

- **Idea by**: sahildh3
- **Programming by**: Google AI Studio
- **Designed & Developed by**: sahildh3
- **Powered by**: Web Crypto API & Lucide Icons

## 🔒 Privacy Policy

1. **Data Collection:** Entropy Vault does not collect, store, or transmit any personal data, seeds, or files. All data processing occurs locally within your browser's memory.
2. **Local Storage:** If you use the "Save Encrypted" feature for notes, the data is stored in your browser's `localStorage`, encrypted with a key derived from your master seed. This data never leaves your device.
3. **Third-Party Services:** We do not use any third-party analytics, tracking cookies, or external APIs. The application is completely self-contained.
4. **Security:** While we use industry-standard cryptographic practices, the security of your vault ultimately depends on the strength of your entropy and the physical security of your device.

## ⚖️ Terms & Conditions

1. **Acceptance:** By using Entropy Vault, you agree to these terms. If you do not agree, do not use the application.
2. **No Warranty:** This software is provided "as is" without any warranty of any kind, express or implied. Use at your own risk.
3. **Responsibility:** You are solely responsible for the management and backup of your master seed and entropy sources. Loss of these will result in permanent loss of access to your vault.
4. **Limitation of Liability:** In no event shall the authors or copyright holders be liable for any claim, damages, or other liability arising from the use of this software.

## ⚠️ Disclaimer

Entropy Vault is provided "as is" without warranty of any kind. You are solely responsible for the safety of your master seed. If you lose your seed, you lose access to your derived data.
