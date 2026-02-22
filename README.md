# RizeOS Mini AI-HRMS

A full-stack AI-powered Human Resource Management System built for the **RizeOS Core Team Internship Assessment**.

🌐 **Live Demo:** https://rize-os-hrms.vercel.app  
🔧 **Backend API:** https://rizeos-hrms-production.up.railway.app/api  
👤 **Admin Portal:** https://rize-os-hrms.vercel.app/login  
👷 **Employee Portal:** https://rize-os-hrms.vercel.app/employee  

---

## Features

- Organization registration and login with JWT authentication
- Separate Admin and Employee portals with role-based access
- Employee management — skills, department, role, wallet address, password
- Task lifecycle tracking — Assigned → In Progress → Completed
- Employee self-service — update profile, skills and change password
- Workforce dashboard with real-time charts and productivity indicators
- AI Smart Task Assignment — scores and ranks best employee for any task
- AI Productivity Scoring — auto-calculated from task history
- Web3 workforce logging — MetaMask wallet, on-chain task and payroll proof via Polygon Mumbai

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Class Components), Custom CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT + bcrypt |
| Charts | Recharts |
| Blockchain | Polygon Mumbai Testnet |
| Wallet | MetaMask |
| Smart Contract | Solidity ^0.8.19 |
| Web3 Library | Ethers.js v5 |
| Deployment | Vercel (Frontend) + Railway (Backend) |

---

## Project Structure

```
ai-hrms/
├── smart-contract/
│   ├── WorkforceLogger.sol
│   └── DEPLOY.md
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
│   │   ├── ai.js
│   │   └── employeeAuth.js
│   ├── middleware/auth.js
│   ├── utils/aiEngine.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── context/AuthContext.js
│       ├── utils/web3.js
│       ├── components/Layout.js
│       └── pages/
│           ├── Login.js / Register.js
│           ├── Dashboard.js
│           ├── AdminPanel.js
│           ├── Employees.js
│           ├── Tasks.js
│           ├── AIInsights.js
│           ├── Web3Page.js
│           └── EmployeePortal.js
├── GTM_Strategy.md
└── README.md
```

---

## Two Separate Portals

### Admin Portal — `/login`
- Register organization → login
- Add employees and set their login password
- Create tasks and assign to specific employees
- AI Smart Assignment — get ranked recommendations
- Dashboard — workforce analytics and charts
- Web3 — log task completion and payroll on-chain

### Employee Portal — `/employee`
- Login with email + password (set by admin)
- View personal task checklist
- Update status: Assigned → In Progress → Completed
- Edit own profile, skills, wallet address
- Change own password

---

## Local Setup

### Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-hrms
JWT_SECRET=your_secret_key
```

```bash
npm run dev
```

### Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
```

```bash
npm start
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register organization |
| POST | /api/auth/login | Admin login |
| GET | /api/employees | List employees |
| POST | /api/employees | Add employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete employee |
| GET | /api/tasks | List tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| GET | /api/dashboard | Dashboard stats |
| GET | /api/ai/assign/:taskId | AI smart assignment |
| POST | /api/employee-auth/login | Employee login |
| GET | /api/employee-auth/my-tasks | Employee tasks |
| PUT | /api/employee-auth/my-tasks/:id | Update task status |
| PUT | /api/employee-auth/profile | Update profile |
| PUT | /api/employee-auth/change-password | Change password |

---

## AI Engine

**File:** `backend/utils/aiEngine.js`

```
Match Score = Skill Match (40%) + Workload (30%) + Productivity (20%) + Completion Rate (10%)
```

| Factor | Weight | Logic |
|--------|--------|-------|
| Skill Match | 40% | Matched skills ÷ required skills × 40 |
| Workload | 30% | Fewer active tasks = higher score |
| Productivity | 20% | Historical task completion score |
| Completion Rate | 10% | % of tasks completed on time |

**Productivity Score Formula:**
```
Score = (Completion Rate × 50%) + (On-time Rate × 30%) + Recency Bonus (max 20)
```

---

## Web3 — WorkforceLogger Smart Contract

**File:** `smart-contract/WorkforceLogger.sol`  
**Network:** Polygon Mumbai Testnet

| Function | Description |
|----------|-------------|
| `logTaskCompletion()` | Records task completion on-chain |
| `logPayroll()` | Records payroll proof on-chain |
| `logActivity()` | Records SHA-256 hashed activity |
| `getMyTaskLogs()` | Fetch all logs for connected wallet |

---

## Deployment

| Service | URL |
|---------|-----|
| Frontend | https://rize-os-hrms.vercel.app |
| Backend | https://rizeos-hrms-production.up.railway.app |
| Database | MongoDB Atlas — AWS Mumbai |

---

## Scalability Notes

| Challenge | Solution |
|-----------|----------|
| 100K employees | MongoDB indexes on `organization` field + pagination |
| 1M task logs | Separate audit collection with TTL indexes |
| AI at scale | Cache scores, async recalculation via BullMQ |
| Multi-org isolation | All queries scoped by `organization: req.org._id` |
| Web3 at scale | Events indexed on-chain, read via The Graph protocol |

---

*Built by Abhiram Naik — RizeOS Assessment 2026*