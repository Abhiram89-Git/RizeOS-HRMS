
contract WorkforceLogger {

    // ─── Events ───────────────────────────────────────────────────────────────

    event TaskCompleted(
        address indexed orgWallet,
        string  indexed taskId,
        string  employeeId,
        string  taskTitle,
        uint256 timestamp
    );

    event PayrollLogged(
        address indexed orgWallet,
        string  indexed employeeId,
        uint256 amount,
        string  currency,
        uint256 timestamp
    );

    event ActivityLogged(
        address indexed orgWallet,
        string  activityType,
        string  activityHash,
        uint256 timestamp
    );

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct TaskLog {
        string  taskId;
        string  employeeId;
        string  taskTitle;
        address orgWallet;
        uint256 timestamp;
    }

    struct PayrollLog {
        string  employeeId;
        uint256 amount;
        string  currency;
        address orgWallet;
        uint256 timestamp;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    // orgWallet => list of task logs
    mapping(address => TaskLog[]) private orgTaskLogs;

    // orgWallet => list of payroll logs
    mapping(address => PayrollLog[]) private orgPayrollLogs;

    // orgWallet => total tasks completed
    mapping(address => uint256) public orgTaskCount;

    // ─── Functions ────────────────────────────────────────────────────────────

    /**
     * @notice Log a task completion event on-chain
     * @param taskId MongoDB task ID
     * @param employeeId MongoDB employee ID
     * @param taskTitle Human readable task title
     */
    function logTaskCompletion(
        string calldata taskId,
        string calldata employeeId,
        string calldata taskTitle
    ) external {
        TaskLog memory log = TaskLog({
            taskId:     taskId,
            employeeId: employeeId,
            taskTitle:  taskTitle,
            orgWallet:  msg.sender,
            timestamp:  block.timestamp
        });

        orgTaskLogs[msg.sender].push(log);
        orgTaskCount[msg.sender] += 1;

        emit TaskCompleted(msg.sender, taskId, employeeId, taskTitle, block.timestamp);
    }

    /**
     * @notice Log a payroll proof on-chain
     * @param employeeId MongoDB employee ID
     * @param amount Payroll amount (in smallest unit, e.g. paise)
     * @param currency Currency code e.g. "INR"
     */
    function logPayroll(
        string calldata employeeId,
        uint256 amount,
        string calldata currency
    ) external {
        PayrollLog memory log = PayrollLog({
            employeeId: employeeId,
            amount:     amount,
            currency:   currency,
            orgWallet:  msg.sender,
            timestamp:  block.timestamp
        });

        orgPayrollLogs[msg.sender].push(log);

        emit PayrollLogged(msg.sender, employeeId, amount, currency, block.timestamp);
    }

    /**
     * @notice Log a generic workforce activity hash
     * @param activityType e.g. "check-in", "performance-review"
     * @param activityHash SHA256 hash of the activity data
     */
    function logActivity(
        string calldata activityType,
        string calldata activityHash
    ) external {
        emit ActivityLogged(msg.sender, activityType, activityHash, block.timestamp);
    }

    /**
     * @notice Get all task logs for the calling org
     */
    function getMyTaskLogs() external view returns (TaskLog[] memory) {
        return orgTaskLogs[msg.sender];
    }

    /**
     * @notice Get all payroll logs for the calling org
     */
    function getMyPayrollLogs() external view returns (PayrollLog[] memory) {
        return orgPayrollLogs[msg.sender];
    }

    /**
     * @notice Get task count for any org wallet
     */
    function getTaskCount(address orgWallet) external view returns (uint256) {
        return orgTaskCount[orgWallet];
    }
}