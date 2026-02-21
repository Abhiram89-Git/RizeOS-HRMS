# Smart Contract — WorkforceLogger

## Contract Details

- **Network:** Polygon Mumbai Testnet (chainId: 80001)
- **Language:** Solidity ^0.8.19
- **File:** `WorkforceLogger.sol`

---

## How to Deploy (Using Remix IDE — Easiest)

1. Go to [https://remix.ethereum.org](https://remix.ethereum.org)
2. Create a new file → paste the contents of `WorkforceLogger.sol`
3. Go to **Solidity Compiler** tab → select version `0.8.19` → click **Compile**
4. Go to **Deploy & Run** tab:
   - Environment: **Injected Provider - MetaMask**
   - Make sure MetaMask is on **Polygon Mumbai** testnet
   - Click **Deploy**
5. Copy the **deployed contract address** — paste it into `frontend/src/utils/web3.js`

## Get Mumbai Testnet MATIC (free)
- https://faucet.polygon.technology/
- https://mumbaifaucet.com/

---

## Contract ABI (paste into web3.js)

```json
[
  {
    "inputs": [{"internalType":"string","name":"taskId","type":"string"},{"internalType":"string","name":"employeeId","type":"string"},{"internalType":"string","name":"taskTitle","type":"string"}],
    "name": "logTaskCompletion",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"string","name":"employeeId","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"string","name":"currency","type":"string"}],
    "name": "logPayroll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"string","name":"activityType","type":"string"},{"internalType":"string","name":"activityHash","type":"string"}],
    "name": "logActivity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMyTaskLogs",
    "outputs": [{"components":[{"internalType":"string","name":"taskId","type":"string"},{"internalType":"string","name":"employeeId","type":"string"},{"internalType":"string","name":"taskTitle","type":"string"},{"internalType":"address","name":"orgWallet","type":"address"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"internalType":"struct WorkforceLogger.TaskLog[]","name":"","type":"tuple[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"orgWallet","type":"address"}],
    "name": "getTaskCount",
    "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed":true,"internalType":"address","name":"orgWallet","type":"address"},{"indexed":true,"internalType":"string","name":"taskId","type":"string"},{"indexed":false,"internalType":"string","name":"employeeId","type":"string"},{"indexed":false,"internalType":"string","name":"taskTitle","type":"string"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],
    "name": "TaskCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed":true,"internalType":"address","name":"orgWallet","type":"address"},{"indexed":true,"internalType":"string","name":"employeeId","type":"string"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"string","name":"currency","type":"string"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],
    "name": "PayrollLogged",
    "type": "event"
  }
]
```