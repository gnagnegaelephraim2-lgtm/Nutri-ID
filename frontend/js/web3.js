/**
 * NUTRI-ID - Web3 & MetaMask Integration
 */

// Contract ABI (Simplified for HealthID)
const healthIdABI = [
    "function mintID(address citizen, string _nipHash, string _bloodType, bool _cmu) public",
    "function getMyInfo() public view returns (string, string, bool, uint256)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)"
];

// Placeholder address from deployment
const CONTRACT_ADDRESS = "0xYourDeployedPolygonAddressHere";

class Web3Manager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.isConnected = false;

        this.init();
    }

    init() {
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.userAddress = accounts[0];

                // Set up Ethers provider
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = this.provider.getSigner();
                this.isConnected = true;

                this.updateUI();
                await this.checkHealthID();
            } catch (error) {
                console.error("User denied account access", error);
                alert("Please connect your MetaMask wallet to access your Health ID.");
            }
        } else {
            alert("MetaMask is not installed. Please install it to use the digital Health ID.");
        }
    }

    updateUI() {
        const statusEl = document.getElementById('wallet-status');
        const connectBtn = document.getElementById('connect-wallet-btn');

        if (this.isConnected && statusEl) {
            statusEl.innerHTML = `<i class='bx bxs-wallet text-green'></i> Connected: ${this.userAddress.substring(0, 6)}...${this.userAddress.substring(38)}`;
            if (connectBtn) connectBtn.style.display = 'none';
        }
    }

    async checkHealthID() {
        try {
            const contract = new ethers.Contract(CONTRACT_ADDRESS, healthIdABI, this.signer);
            const balance = await contract.balanceOf(this.userAddress);

            const verificationEl = document.getElementById('sbt-verification');

            if (balance > 0 && verificationEl) {
                verificationEl.innerHTML = `<span class="badge-pill bg-green px-2 py-1"><i class='bx bx-check-shield'></i> Identité Blockchain Vérifiée (Polygon SBT)</span>`;
            }
        } catch (e) {
            console.log("Not on connected network, or contract not deployed locally yet.");
        }
    }
}

// Bind to window for global access
window.addEventListener('DOMContentLoaded', () => {
    // We defer initialization until routing creates the DOM elements
    window.nutriWeb3 = new Web3Manager();
});
