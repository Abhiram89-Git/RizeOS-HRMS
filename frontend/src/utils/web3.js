// Web3 Utility — MetaMask + WorkforceLogger Contract
// Replace CONTRACT_ADDRESS after deploying WorkforceLogger.sol

export const CONTRACT_ADDRESS = '0xd9145CCE52D386f254917e481eB44e9943F39138';

export const CONTRACT_ABI = [
  {
    "inputs": [{"internalType":"string","name":"taskId","type":"string"},{"internalType":"string","name":"employeeId","type":"string"},{"internalType":"string","name":"taskTitle","type":"string"}],
    "name": "logTaskCompletion","outputs": [],"stateMutability": "nonpayable","type": "function"
  },
  {
    "inputs": [{"internalType":"string","name":"employeeId","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"currency","type":"string"}],
    "name": "logPayroll","outputs": [],"stateMutability": "nonpayable","type": "function"
  },
  {
    "inputs": [{"internalType":"string","name":"activityType","type":"string"},{"internalType":"string","name":"activityHash","type":"string"}],
    "name": "logActivity","outputs": [],"stateMutability": "nonpayable","type": "function"
  },
  {
    "inputs": [],"name": "getMyTaskLogs",
    "outputs": [{"components":[{"internalType":"string","name":"taskId","type":"string"},{"internalType":"string","name":"employeeId","type":"string"},{"internalType":"string","name":"taskTitle","type":"string"},{"internalType":"address","name":"orgWallet","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"internalType":"struct WorkforceLogger.TaskLog[]","name":"","type":"tuple[]"}],
    "stateMutability": "view","type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"orgWallet","type":"address"}],
    "name": "getTaskCount","outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability": "view","type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed":true,"internalType":"address","name":"orgWallet","type":"address"},{"indexed":true,"internalType":"string","name":"taskId","type":"string"},{"indexed":false,"internalType":"string","name":"employeeId","type":"string"},{"indexed":false,"internalType":"string","name":"taskTitle","type":"string"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],
    "name": "TaskCompleted","type": "event"
  }
];

// Polygon Mumbai Testnet
export const POLYGON_MUMBAI = {
  chainId: '0x13881',
  chainName: 'Polygon Mumbai Testnet',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
  blockExplorerUrls: ['https://mumbai.polygonscan.com/']
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Connect MetaMask wallet — returns connected address
 */
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install it from metamask.io');
  }
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
  await switchToMumbai();
  return accounts[0];
};

/**
 * Get currently connected account
 */
export const getConnectedAccount = async () => {
  if (!isMetaMaskInstalled()) return null;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  return accounts[0] || null;
};

/**
 * Switch MetaMask to Polygon Mumbai testnet
 */
export const switchToMumbai = async () => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_MUMBAI.chainId }]
    });
  } catch (err) {
    // Chain not added yet — add it
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [POLYGON_MUMBAI]
      });
    } else {
      throw err;
    }
  }
};

/**
 * Get ethers provider and signer from MetaMask
 * Uses ethers v5 via CDN (loaded in index.html) or inline
 */
const getProviderAndSigner = async () => {
  // ethers loaded via CDN in public/index.html
  const { ethers } = window;
  if (!ethers) throw new Error('Ethers.js not loaded');
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return { provider, signer };
};

/**
 * Log task completion on-chain
 * @returns transaction hash
 */
export const logTaskOnChain = async (taskId, employeeId, taskTitle) => {
  const { signer } = await getProviderAndSigner();
  const { ethers } = window;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.logTaskCompletion(taskId, employeeId, taskTitle);
  const receipt = await tx.wait();
  return receipt.transactionHash;
};

/**
 * Log payroll proof on-chain
 * @returns transaction hash
 */
export const logPayrollOnChain = async (employeeId, amountInPaise, currency = 'INR') => {
  const { signer } = await getProviderAndSigner();
  const { ethers } = window;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.logPayroll(employeeId, amountInPaise, currency);
  const receipt = await tx.wait();
  return receipt.transactionHash;
};

/**
 * Log generic activity hash on-chain
 * @returns transaction hash
 */
export const logActivityOnChain = async (activityType, activityHash) => {
  const { signer } = await getProviderAndSigner();
  const { ethers } = window;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const tx = await contract.logActivity(activityType, activityHash);
  const receipt = await tx.wait();
  return receipt.transactionHash;
};

/**
 * Fetch all on-chain task logs for connected org wallet
 */
export const fetchOnChainLogs = async () => {
  const { provider } = await getProviderAndSigner();
  const { ethers } = window;
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  const account = await getConnectedAccount();
  const logs = await contract.getMyTaskLogs({ from: account });
  return logs;
};

/**
 * Short address display helper
 */
export const shortAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};