# RizeOS Mini AI-HRMS

A full-stack AI-powered Human Resource Management System built for the **RizeOS Core Team Internship Assessment**.

---

## Features

- Organization registration and login with JWT authentication
- Employee management with skills, department, role, and wallet address
- Task creation, assignment, and status tracking (Unassigned → Assigned → In Progress → Completed)
- Workforce dashboard with real-time charts and productivity indicators
- AI-powered Smart Task Assignment — recommends the best employee for any task
- AI Productivity Scoring — calculates employee performance scores from task history
- Web3 workforce logging — MetaMask wallet connection, on-chain task completion and payroll proof via Polygon Mumbai

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Class Components), Custom CSS Design System |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcrypt |
| Charts | Recharts |
| Blockchain | Polygon Mumbai Testnet |
| Wallet | MetaMask |
| Smart Contract | Solidity ^0.8.19 |
| Web3 Library | Ethers.js v5 |

---

## Project Structure

```
ai-hrms/
├── smart-contract/
│   ├── WorkforceLogger.sol       ← Solidity contract for on-chain logging
│   └── DEPLOY.md                 ← Deployment instructions
├── backend/
│   ├── models/
│   │   ├── Organization.js
│   │   ├── Employee.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── employees.js
│   │   ├── tasks.js
│   │   ├── dashboard.js
│   │   └── ai.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── aiEngine.js           ← Core AI logic
│   └── server.js
├── frontend/
│   └── src/
│       ├── context/
│       │   └── AuthContext.js
│       ├── utils/
│       │   └── web3.js           ← MetaMask + contract utilities
│       ├── components/
│       │   └── Layout.js
│       └── pages/
│           ├── Login.js
│           ├── Register.js
│           ├── Dashboard.js
│           ├── Employees.js
│           ├── Tasks.js
│           ├── AIInsights.js
│           └── Web3Page.js       ← Web3 workforce logging UI
├── GTM_Strategy.md
└── README.md
```

---

## Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB running locally or MongoDB Atlas URI
- MetaMask browser extension (for Web3 features)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Environment Variables

**backend/.env**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-hrms
JWT_SECRET=your_secret_key
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register organization |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current org |
| GET | /api/employees | List employees |
| POST | /api/employees | Add employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete employee |
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update / advance status |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/ai/assign/:taskId | Smart task assignment |
| POST | /api/ai/recalculate-scores | Recalculate productivity scores |

---

## AI Engine — Smart Task Assignment

Located in `backend/utils/aiEngine.js`.

Each employee is scored against a task using four weighted factors:

```
Match Score = Skill Match (40%) + Workload (30%) + Productivity (20%) + Completion Rate (10%)
```

| Factor | Weight | Logic |
|--------|--------|-------|
| Skill Match | 40 | Matched skills / required skills |
| Workload | 30 | Fewer active tasks = higher score |
| Productivity | 20 | Based on historical task completion |
| Completion Bonus | 10 | Tasks completed before deadline |

Returns each employee ranked with a match score, recommendation tier (Highly Recommended / Good Match / Available), matched and missing skills, and a per-factor breakdown.

### Productivity Score Formula

```
Score = (Completion Rate × 50%) + (On-time Rate × 30%) + Recency Bonus (max 20)
```

---

## Web3 — WorkforceLogger Smart Contract

**Contract:** `smart-contract/WorkforceLogger.sol`
**Network:** Polygon Mumbai Testnet
**Functions:**

| Function | Description |
|----------|-------------|
| `logTaskCompletion(taskId, employeeId, taskTitle)` | Records task completion on-chain |
| `logPayroll(employeeId, amount, currency)` | Records payroll proof on-chain |
| `logActivity(activityType, activityHash)` | Records SHA-256 hashed activity |
| `getMyTaskLogs()` | Fetches all logs for connected wallet |

**To deploy:**
1. Open [remix.ethereum.org](https://remix.ethereum.org)
2. Paste `WorkforceLogger.sol` → compile with version 0.8.19
3. Deploy using Injected Provider (MetaMask) on Polygon Mumbai
4. Copy contract address → paste into `frontend/src/utils/web3.js`

---

## Scalability Notes

| Challenge | Approach |
|-----------|----------|
| 100K employees | MongoDB indexes on `organization` field + paginated responses |
| 1M task logs | Separate audit log collection with TTL indexes |
| AI performance | Cache scores, async recalculation via job queue |
| Multi-org isolation | Every query scoped by `organization: req.org._id` |
| Web3 at scale | Events indexed on-chain, read via The Graph protocol |

---

## GTM & Monetization

See [GTM_Strategy.md](./GTM_Strategy.md) for the full go-to-market plan including target personas, 3-month onboarding roadmap, ₹5,000 marketing budget breakdown, and revenue streams.

---

*Built by Abhiram Naik — RizeOS Core Team Internship Assessment, 2026*