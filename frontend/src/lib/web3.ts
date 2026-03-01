// Port of web3.js — ethers v5 + HealthID SBT ABI

import { ethers } from 'ethers';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

export const HEALTH_ID_ABI = [
  'function mintID(address citizen, string _nipHash, string _bloodType, bool _cmu) public',
  'function getMyInfo() public view returns (string, string, bool, uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function walletToTokenId(address) view returns (uint256)',
  'event IDMinted(address indexed patientWallet, uint256 indexed tokenId, string nip)',
];

export const HEALTH_RECORD_ABI = [
  'function addRecord(uint256 tokenId, string _ipfsCID, string _documentHash, string _recordType) external',
  'function getRecordCount(uint256 tokenId) external view returns (uint256)',
  'function getRecord(uint256 tokenId, uint256 index) external view returns (tuple(string ipfsCID, string documentHash, uint256 timestamp, address doctor, string recordType))',
  'function setDoctorAuthorization(address doctor, bool status) external',
  'function authorizedDoctors(address) view returns (bool)',
  'event RecordAdded(uint256 indexed tokenId, address indexed doctor, string documentHash, string recordType)',
];

export const NETWORKS: Record<number, { name: string; explorer: string | null; color: string }> = {
  31337: { name: 'Hardhat Localhost', explorer: null, color: '#F77F00' },
  80002: { name: 'Polygon Amoy Testnet', explorer: 'https://amoy.polygonscan.com', color: '#8247E5' },
  137: { name: 'Polygon Mainnet', explorer: 'https://polygonscan.com', color: '#8247E5' },
};

export interface DeployedAddresses {
  HealthID: string;
  HealthRecord?: string;
  chainId: number;
}

export async function loadDeployedAddresses(): Promise<DeployedAddresses | null> {
  try {
    const res = await fetch('/contracts/deployed_addresses.json');
    if (!res.ok) throw new Error('not found');
    return await res.json() as DeployedAddresses;
  } catch {
    console.warn('[NutriID] deployed_addresses.json not found — contracts not deployed yet.');
    return null;
  }
}

export interface Web3State {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  userAddress: string | null;
  chainId: number | null;
  isConnected: boolean;
  addresses: DeployedAddresses | null;
  healthIDContract: ethers.Contract | null;
}

export async function connectWallet(): Promise<Web3State> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("MetaMask n'est pas installé. Veuillez l'installer pour utiliser votre ID Santé.");
  }
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  const network = await provider.getNetwork();
  const chainId = network.chainId;
  const addresses = await loadDeployedAddresses();
  const healthIDContract = addresses?.HealthID
    ? new ethers.Contract(addresses.HealthID, HEALTH_ID_ABI, signer)
    : null;

  return {
    provider,
    signer,
    userAddress,
    chainId,
    isConnected: true,
    addresses,
    healthIDContract,
  };
}

export async function getMyInfo(contract: ethers.Contract): Promise<{
  nip: string;
  bloodType: string;
  hasCMU: boolean;
  issuedAt: ethers.BigNumber;
  tokenId: ethers.BigNumber;
}> {
  const [nip, bloodType, hasCMU, issuedAt] = await contract.getMyInfo();
  const userAddress = await contract.signer.getAddress();
  const tokenId = await contract.walletToTokenId(userAddress);
  return { nip, bloodType, hasCMU, issuedAt, tokenId };
}
