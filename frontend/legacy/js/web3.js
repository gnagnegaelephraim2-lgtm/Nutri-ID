/**
 * NUTRI-ID — Blockchain / Web3 Integration (ethers v5)
 * Handles MetaMask connection, HealthID SBT reads, and HealthRecord IPFS reads.
 */

// ─────────────────────────────────────────────────────────────────────────────
// FULL ABIs (extracted from Hardhat artifacts — kept inline to avoid CORS on
// file:// served pages; run deploy.js to regenerate frontend/contracts/ files)
// ─────────────────────────────────────────────────────────────────────────────

const HEALTH_ID_ABI = [
    "function mintID(address citizen, string _nipHash, string _bloodType, bool _cmu) public",
    "function getMyInfo() public view returns (string, string, bool, uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function walletToTokenId(address) view returns (uint256)",
    "event IDMinted(address indexed patientWallet, uint256 indexed tokenId, string nip)"
];

const HEALTH_RECORD_ABI = [
    "function addRecord(uint256 tokenId, string _ipfsCID, string _documentHash, string _recordType) external",
    "function getRecordCount(uint256 tokenId) external view returns (uint256)",
    "function getRecord(uint256 tokenId, uint256 index) external view returns (tuple(string ipfsCID, string documentHash, uint256 timestamp, address doctor, string recordType))",
    "function setDoctorAuthorization(address doctor, bool status) external",
    "function authorizedDoctors(address) view returns (bool)",
    "event RecordAdded(uint256 indexed tokenId, address indexed doctor, string documentHash, string recordType)"
];

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const NETWORKS = {
    31337: { name: "Hardhat Localhost", explorer: null, color: "#F77F00" },
    80002: { name: "Polygon Amoy Testnet", explorer: "https://amoy.polygonscan.com", color: "#8247E5" },
    137: { name: "Polygon Mainnet", explorer: "https://polygonscan.com", color: "#8247E5" }
};

const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYED ADDRESS LOADER
// Tries fetching contracts/deployed_addresses.json (present after deploy),
// falls back to null so the frontend shows an appropriate offline state.
// ─────────────────────────────────────────────────────────────────────────────

async function loadDeployedAddresses() {
    try {
        const res = await fetch("contracts/deployed_addresses.json");
        if (!res.ok) throw new Error("not found");
        return await res.json();
    } catch (_) {
        console.warn("[NutriID] deployed_addresses.json not found — contracts not deployed yet.");
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB3 MANAGER — MetaMask + HealthID contract
// ─────────────────────────────────────────────────────────────────────────────

class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.chainId = null;
        this.isConnected = false;
        this.addresses = null;   // from deployed_addresses.json
        this.healthIDContract = null;
    }

    /** Called by app.js when health-id page is rendered */
    async init() {
        this.addresses = await loadDeployedAddresses();
        this._bindConnectBtn();
        this._renderNetworkStatus();

        // If already connected (page revisit), restore session
        if (typeof window.ethereum !== "undefined" && window.ethereum.selectedAddress) {
            await this._setupProvider();
            await this.loadHealthID();
        }
    }

    _bindConnectBtn() {
        const btn = document.getElementById("connect-wallet-btn");
        if (btn) btn.addEventListener("click", () => this.connectWallet());
    }

    _renderNetworkStatus() {
        const el = document.getElementById("network-status");
        if (!el) return;
        if (!this.addresses) {
            el.innerHTML = `<span class="badge-offline"><i class='bx bx-error-circle'></i> Contrats non déployés — mode démo</span>`;
        } else {
            const net = NETWORKS[this.addresses.chainId] || { name: `Chain ${this.addresses.chainId}` };
            el.innerHTML = `<span class="badge-pill"><i class='bx bx-link-alt'></i> ${net.name}</span>`;
        }
    }

    async connectWallet() {
        if (typeof window.ethereum === "undefined") {
            this._showError("MetaMask n'est pas installé. Veuillez l'installer pour utiliser votre ID Santé.", "connect-wallet-btn");
            return;
        }
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            await this._setupProvider();
            await this.loadHealthID();
        } catch (err) {
            console.error("[NutriID] Wallet connection failed:", err);
            this._showError("Connexion refusée. Acceptez la demande MetaMask.", "wallet-status");
        }
    }

    async _setupProvider() {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();
        const network = await this.provider.getNetwork();
        this.chainId = network.chainId;
        this.isConnected = true;
        this._updateWalletUI();

        // Build contract instance
        if (this.addresses && this.addresses.HealthID) {
            this.healthIDContract = new ethers.Contract(this.addresses.HealthID, HEALTH_ID_ABI, this.signer);
        }
    }

    _updateWalletUI() {
        const btn = document.getElementById("connect-wallet-btn");
        const status = document.getElementById("wallet-status");
        const addr = this.userAddress;
        if (btn) btn.style.display = "none";
        if (status) {
            status.innerHTML = `<i class='bx bxs-wallet text-green'></i> ${addr.substring(0, 6)}...${addr.substring(38)}`;
            status.classList.add("connected");
        }
        // Network badge update
        const net = NETWORKS[this.chainId] || { name: `Chain ${this.chainId}` };
        const netEl = document.getElementById("network-status");
        if (netEl) netEl.innerHTML = `<span class="badge-pill" style="color:${NETWORKS[this.chainId]?.color || '#fff'}"><i class='bx bx-link-alt'></i> ${net.name}</span>`;
    }

    /** Reads getMyInfo() and populates the Health ID card */
    async loadHealthID() {
        const verEl = document.getElementById("sbt-verification");
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        // Populate card from user profile (works in all modes — online, demo, offline)
        if (window.nutriAuth && window.nutriAuth.user) {
            const user = window.nutriAuth.user;
            const name = user.full_name || user.email.split('@')[0];
            const initials = name.substring(0, 2).toUpperCase();

            set("hid-name", name.toUpperCase());
            if (user.blood_type) set("hid-blood-type", user.blood_type);
            if (user.sex) set("hid-sex", user.sex);
            if (user.national_id) set("hid-nip", user.national_id);
            if (user.date_of_birth) {
                // Convert ISO "1988-05-14" → "14/05/1988"
                const parts = user.date_of_birth.split("-");
                set("hid-dob", parts.length === 3
                    ? `${parts[2]}/${parts[1]}/${parts[0]}`
                    : user.date_of_birth);
            }

            const photoEl = document.getElementById("hid-photo");
            if (photoEl) photoEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=120&background=2d2d2d&color=fff`;

            // Generate QR code from profile data — works in all modes
            this._generateQR(user.national_id || user.email, name, user.blood_type || "—");
        }

        if (!this.addresses) {
            // Demo / offline mode
            if (verEl) verEl.innerHTML = `<span class="badge-demo"><i class='bx bx-info-circle'></i> Mode Démo — déployez les contrats pour activer</span>`;
            return;
        }

        if (!this.healthIDContract) {
            if (verEl) verEl.innerHTML = `<span class="badge-error"><i class='bx bx-error'></i> Contrat non configuré</span>`;
            return;
        }

        try {
            // Check if user has a Health ID
            const balance = await this.healthIDContract.balanceOf(this.userAddress);
            if (balance.eq(0)) {
                if (verEl) verEl.innerHTML = `<span class="badge-error"><i class='bx bx-error-circle'></i> Aucun ID Santé trouvé pour ce portefeuille</span>`;
                return;
            }

            // Fetch on-chain data
            const [nip, bloodType, hasCMU, issuedAt] = await this.healthIDContract.getMyInfo();
            const tokenId = await this.healthIDContract.walletToTokenId(this.userAddress);

            // Populate the Health ID card
            this._populateCard({ nip, bloodType, hasCMU, issuedAt, tokenId });

            // SBT verified badge
            if (verEl) {
                const explorerBase = NETWORKS[this.chainId]?.explorer;
                const explorerLink = explorerBase
                    ? `<a href="${explorerBase}/token/${this.addresses.HealthID}?a=${tokenId}" target="_blank" style="color:inherit"><i class='bx bx-link-external'></i></a>`
                    : "";
                verEl.innerHTML = `<span class="badge-pill bg-verified"><i class='bx bx-check-shield'></i> Identité Blockchain Vérifiée — SBT #${tokenId} ${explorerLink}</span>`;
            }

        } catch (err) {
            console.error("[NutriID] Error fetching Health ID:", err);
            if (verEl) verEl.innerHTML = `<span class="badge-error"><i class='bx bx-error'></i> Erreur de lecture du contrat</span>`;
        }
    }

    _populateCard({ nip, bloodType, hasCMU, issuedAt, tokenId }) {
        // Only update fields if they exist in DOM (they might be in demo-mode)
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

        set("hid-nip", nip || "—");
        set("hid-blood-type", bloodType || "—");
        set("hid-cmu-status", hasCMU ? "Actif ✓" : "Inactif ✗");
        set("hid-token-id", `NID #${tokenId}`);

        if (issuedAt) {
            const date = new Date(Number(issuedAt) * 1000);
            set("hid-issued-at", date.toLocaleDateString("fr-FR"));
        }

        // Color the CMU status
        const cmuEl = document.getElementById("hid-cmu-status");
        if (cmuEl) cmuEl.style.color = hasCMU ? "#009A44" : "#EF4444";
    }

    /** Generates a QR code inside #qr-container using profile data */
    _generateQR(nip, name, bloodType) {
        const container = document.getElementById("qr-container");
        if (!container || !window.QRCode) return;
        container.innerHTML = ""; // clear the placeholder icon
        const qrText = `NUTRI-ID\nNIP:${nip}\n${name.toUpperCase()}\nGS:${bloodType}`;
        new window.QRCode(container, {
            text: qrText,
            width: 80,
            height: 80,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: window.QRCode.CorrectLevel.M,
        });
    }

    _showError(message, nearElementId) {
        const el = document.getElementById(nearElementId);
        if (el) {
            const errDiv = document.createElement("p");
            errDiv.style.cssText = "color:#EF4444;font-size:0.875rem;margin-top:0.5rem;";
            errDiv.textContent = message;
            el.parentNode.insertBefore(errDiv, el.nextSibling);
        }
        alert(message);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH RECORD MANAGER — Reads HealthRecord contract + renders record list
// ─────────────────────────────────────────────────────────────────────────────

class HealthRecordManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.addresses = null;
        this.healthIDContract = null;
        this.healthRecordContract = null;
        this.isConnected = false;
    }

    async init() {
        this.addresses = await loadDeployedAddresses();
        this._bindConnectBtn();

        if (typeof window.ethereum !== "undefined" && window.ethereum.selectedAddress) {
            await this._setupProvider();
            await this.loadRecords();
        }
    }

    _bindConnectBtn() {
        const btn = document.getElementById("records-connect-btn");
        if (btn) btn.addEventListener("click", () => this.connectAndLoad());
    }

    async connectAndLoad() {
        if (typeof window.ethereum === "undefined") {
            alert("MetaMask n'est pas installé.");
            return;
        }
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            await this._setupProvider();
            await this.loadRecords();
        } catch (err) {
            console.error("[NutriID] Records wallet connection failed:", err);
        }
    }

    async _setupProvider() {
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();
        this.isConnected = true;

        const btn = document.getElementById("records-connect-btn");
        const status = document.getElementById("records-wallet-status");
        if (btn) btn.style.display = "none";
        if (status) status.textContent = `${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;

        if (this.addresses) {
            this.healthIDContract = new ethers.Contract(this.addresses.HealthID, HEALTH_ID_ABI, this.signer);
            this.healthRecordContract = new ethers.Contract(this.addresses.HealthRecord, HEALTH_RECORD_ABI, this.signer);
        }
    }

    async loadRecords() {
        const listEl = document.getElementById("records-list");
        const emptyEl = document.getElementById("records-empty");
        const loadingEl = document.getElementById("records-loading");

        if (!listEl) return;

        if (!this.addresses) {
            if (loadingEl) loadingEl.style.display = "none";
            if (emptyEl) emptyEl.style.display = "block";
            if (emptyEl) emptyEl.innerHTML = `<i class='bx bx-info-circle'></i> Mode démo — déployez les contrats pour afficher les dossiers réels.`;
            return;
        }

        if (loadingEl) loadingEl.style.display = "flex";

        try {
            // Get the patient's token ID via HealthID contract
            const tokenId = await this.healthIDContract.walletToTokenId(this.userAddress);
            if (!tokenId || tokenId.eq(0)) {
                if (loadingEl) loadingEl.style.display = "none";
                if (emptyEl) { emptyEl.style.display = "block"; emptyEl.innerHTML = `<i class='bx bx-error-circle'></i> Aucun ID Santé trouvé pour ce portefeuille.`; }
                return;
            }

            const count = await this.healthRecordContract.getRecordCount(tokenId);
            if (loadingEl) loadingEl.style.display = "none";

            if (count.eq(0)) {
                if (emptyEl) { emptyEl.style.display = "block"; emptyEl.innerHTML = `<i class='bx bx-folder-open'></i> Aucun dossier médical enregistré sur la blockchain.`; }
                return;
            }

            listEl.innerHTML = "";
            for (let i = 0; i < count.toNumber(); i++) {
                const record = await this.healthRecordContract.getRecord(tokenId, i);
                listEl.appendChild(this._renderRecord(record, i));
            }

        } catch (err) {
            console.error("[NutriID] Error loading records:", err);
            if (loadingEl) loadingEl.style.display = "none";
            if (emptyEl) { emptyEl.style.display = "block"; emptyEl.innerHTML = `<i class='bx bx-error'></i> Erreur de lecture du contrat.`; }
        }
    }

    _renderRecord(record, index) {
        const date = new Date(Number(record.timestamp) * 1000).toLocaleDateString("fr-FR");
        const typeColors = {
            "PRESCRIPTION": { bg: "#F77F00", icon: "bx-capsule" },
            "VACCINE": { bg: "#009A44", icon: "bxs-shield-plus" },
            "TEST_RESULT": { bg: "#3B82F6", icon: "bx-test-tube" }
        };
        const typeInfo = typeColors[record.recordType] || { bg: "#6B7280", icon: "bx-file" };
        const ipfsUrl = `${IPFS_GATEWAY}${record.ipfsCID}`;
        const shortCID = record.ipfsCID.length > 20 ? `${record.ipfsCID.substring(0, 12)}...${record.ipfsCID.slice(-6)}` : record.ipfsCID;
        const shortDoc = record.documentHash.length > 20 ? `${record.documentHash.substring(0, 10)}...` : record.documentHash;
        const shortDoc2 = record.doctor.substring(0, 6) + "..." + record.doctor.substring(38);

        const div = document.createElement("div");
        div.className = "record-card glass animate-fade-in";
        div.innerHTML = `
            <div class="record-type-badge" style="background:${typeInfo.bg}">
                <i class='bx ${typeInfo.icon}'></i>
                ${record.recordType}
            </div>
            <div class="record-body">
                <div class="record-row">
                    <span class="record-label"><i class='bx bx-calendar'></i> Date</span>
                    <span class="record-val">${date}</span>
                </div>
                <div class="record-row">
                    <span class="record-label"><i class='bx bx-link'></i> IPFS CID</span>
                    <a href="${ipfsUrl}" target="_blank" class="record-val record-link">${shortCID}</a>
                </div>
                <div class="record-row">
                    <span class="record-label"><i class='bx bx-hash'></i> Hash SHA-256</span>
                    <span class="record-val record-hash">${shortDoc}</span>
                </div>
                <div class="record-row">
                    <span class="record-label"><i class='bx bx-user-pin'></i> Médecin</span>
                    <span class="record-val">${shortDoc2}</span>
                </div>
            </div>
            <a href="${ipfsUrl}" target="_blank" class="btn btn-sm btn-secondary mt-2">
                <i class='bx bx-download'></i> Voir le Document
            </a>
        `;
        return div;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL INIT
// ─────────────────────────────────────────────────────────────────────────────

window.addEventListener("DOMContentLoaded", () => {
    window.nutriWeb3 = new Web3Manager();
    window.nutriRecords = new HealthRecordManager();
});
