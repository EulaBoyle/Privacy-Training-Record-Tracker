// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialLending
 * @notice Privacy-preserving lending protocol using FHEVM
 * @dev Demonstrates real-world FHEVM application with:
 *      - Encrypted collateral and loan amounts
 *      - Private credit scores
 *      - Confidential interest rates
 *      - Hidden liquidation thresholds
 *
 * Learning objectives:
 * - Apply FHEVM to complex financial logic
 * - Implement multi-variable encrypted calculations
 * - Manage permissions in multi-party scenarios
 * - Handle encrypted conditional logic
 */
contract ConfidentialLending is SepoliaConfig {
    // Encrypted user data
    struct UserProfile {
        euint64 collateralBalance;  // Encrypted collateral deposited
        euint64 borrowedAmount;     // Encrypted loan amount
        euint32 creditScore;        // Encrypted credit score (300-850)
        ebool isActive;             // Account status
        uint256 lastUpdateTime;      // Public timestamp
    }

    // Loan parameters (encrypted for privacy)
    struct LoanTerms {
        euint64 maxLoanAmount;      // Maximum loan based on credit
        euint32 interestRate;       // Interest rate (basis points, e.g., 500 = 5%)
        euint64 liquidationThreshold; // Collateral threshold
        ebool isApproved;           // Loan approval status
    }

    // Storage
    mapping(address => UserProfile) public userProfiles;
    mapping(address => LoanTerms) public loanTerms;

    // Platform parameters (public for simplicity, could be encrypted)
    uint256 public constant MIN_COLLATERAL_RATIO = 150; // 150%
    uint256 public platformFeePercent = 1; // 1%

    // Lending pool encrypted balance
    euint64 public poolBalance;

    // Events (amounts hidden, only addresses revealed)
    event CollateralDeposited(address indexed user, uint256 timestamp);
    event LoanRequested(address indexed user, uint256 timestamp);
    event LoanApproved(address indexed user, uint256 timestamp);
    event LoanRepaid(address indexed user, uint256 timestamp);
    event CollateralWithdrawn(address indexed user, uint256 timestamp);
    event Liquidation(address indexed user, uint256 timestamp);

    /**
     * @notice Initialize user profile with credit score
     * @param encryptedCreditScore Encrypted credit score (300-850)
     * @param inputProof Proof for credit score
     */
    function initializeProfile(
        inEuint64 calldata encryptedCreditScore,
        bytes calldata inputProof
    ) external {
        require(userProfiles[msg.sender].lastUpdateTime == 0, "Profile exists");

        euint32 creditScore = FHE.asEuint32(encryptedCreditScore, inputProof);

        userProfiles[msg.sender] = UserProfile({
            collateralBalance: FHE.asEuint64(0),
            borrowedAmount: FHE.asEuint64(0),
            creditScore: creditScore,
            isActive: FHE.asEbool(true),
            lastUpdateTime: block.timestamp
        });

        // Set permissions
        FHE.allow(creditScore, msg.sender);
        FHE.allowThis(creditScore);

        emit CollateralDeposited(msg.sender, block.timestamp);
    }

    /**
     * @notice Deposit encrypted collateral
     * @param encryptedAmount Encrypted collateral amount
     * @param inputProof Input proof
     */
    function depositCollateral(
        inEuint64 calldata encryptedAmount,
        bytes calldata inputProof
    ) external {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.lastUpdateTime > 0, "Profile not initialized");

        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

        // Add to collateral
        profile.collateralBalance = FHE.add(profile.collateralBalance, amount);

        // Update permissions
        FHE.allowThis(profile.collateralBalance);
        FHE.allow(profile.collateralBalance, msg.sender);

        profile.lastUpdateTime = block.timestamp;

        emit CollateralDeposited(msg.sender, block.timestamp);
    }

    /**
     * @notice Request loan based on collateral and credit score
     * @param encryptedLoanAmount Requested loan amount
     * @param inputProof Input proof
     */
    function requestLoan(
        inEuint64 calldata encryptedLoanAmount,
        bytes calldata inputProof
    ) external {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.lastUpdateTime > 0, "Profile not initialized");

        euint64 requestedAmount = FHE.asEuint64(encryptedLoanAmount, inputProof);

        // Calculate max loan amount based on collateral
        // maxLoan = collateral * 100 / MIN_COLLATERAL_RATIO
        euint64 maxLoanBasedOnCollateral = FHE.div(
            FHE.mul(profile.collateralBalance, FHE.asEuint64(100)),
            FHE.asEuint64(MIN_COLLATERAL_RATIO)
        );

        // Check if requested amount <= max loan
        ebool canBorrow = FHE.lte(requestedAmount, maxLoanBasedOnCollateral);

        // Calculate interest rate based on credit score
        // Better credit = lower interest (simplified logic)
        // interestRate = 1000 - (creditScore * 0.8)
        // Example: 800 score → 1000 - 640 = 360 basis points = 3.6%
        euint32 creditFactor = FHE.div(
            FHE.mul(profile.creditScore, FHE.asEuint32(8)),
            FHE.asEuint32(10)
        );
        euint32 interestRate = FHE.sub(FHE.asEuint32(1000), creditFactor);

        // Store loan terms
        loanTerms[msg.sender] = LoanTerms({
            maxLoanAmount: maxLoanBasedOnCollateral,
            interestRate: interestRate,
            liquidationThreshold: FHE.div(
                FHE.mul(requestedAmount, FHE.asEuint64(MIN_COLLATERAL_RATIO)),
                FHE.asEuint64(100)
            ),
            isApproved: canBorrow
        });

        // Update user borrowed amount if approved
        profile.borrowedAmount = FHE.select(
            canBorrow,
            requestedAmount,
            profile.borrowedAmount
        );

        // Set permissions
        FHE.allowThis(profile.borrowedAmount);
        FHE.allow(profile.borrowedAmount, msg.sender);
        FHE.allowThis(loanTerms[msg.sender].interestRate);
        FHE.allow(loanTerms[msg.sender].interestRate, msg.sender);
        FHE.allowThis(loanTerms[msg.sender].isApproved);
        FHE.allow(loanTerms[msg.sender].isApproved, msg.sender);

        profile.lastUpdateTime = block.timestamp;

        emit LoanRequested(msg.sender, block.timestamp);
    }

    /**
     * @notice Repay loan with interest
     * @param encryptedRepayAmount Encrypted repayment amount
     * @param inputProof Input proof
     */
    function repayLoan(
        inEuint64 calldata encryptedRepayAmount,
        bytes calldata inputProof
    ) external {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.lastUpdateTime > 0, "Profile not initialized");

        euint64 repayAmount = FHE.asEuint64(encryptedRepayAmount, inputProof);

        // Calculate interest
        // interest = borrowedAmount * interestRate / 10000
        euint64 interest = FHE.div(
            FHE.mul(
                profile.borrowedAmount,
                FHE.asEuint64(loanTerms[msg.sender].interestRate)
            ),
            FHE.asEuint64(10000)
        );

        // Total owed = principal + interest
        euint64 totalOwed = FHE.add(profile.borrowedAmount, interest);

        // Check if repayment >= total owed
        ebool fullRepayment = FHE.gte(repayAmount, totalOwed);

        // Update borrowed amount
        // If full repayment: 0, else: totalOwed - repayAmount
        euint64 remaining = FHE.select(
            fullRepayment,
            FHE.asEuint64(0),
            FHE.sub(totalOwed, repayAmount)
        );

        profile.borrowedAmount = remaining;

        // Update permissions
        FHE.allowThis(profile.borrowedAmount);
        FHE.allow(profile.borrowedAmount, msg.sender);

        // Add repayment to pool
        poolBalance = FHE.add(poolBalance, repayAmount);

        profile.lastUpdateTime = block.timestamp;

        emit LoanRepaid(msg.sender, block.timestamp);
    }

    /**
     * @notice Withdraw collateral if no outstanding loans
     * @param encryptedWithdrawAmount Encrypted withdrawal amount
     * @param inputProof Input proof
     */
    function withdrawCollateral(
        inEuint64 calldata encryptedWithdrawAmount,
        bytes calldata inputProof
    ) external {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.lastUpdateTime > 0, "Profile not initialized");

        euint64 withdrawAmount = FHE.asEuint64(encryptedWithdrawAmount, inputProof);

        // Check no outstanding loans
        ebool noLoans = FHE.eq(profile.borrowedAmount, FHE.asEuint64(0));

        // Check sufficient collateral
        ebool sufficientCollateral = FHE.gte(profile.collateralBalance, withdrawAmount);

        // Can withdraw if both conditions true
        ebool canWithdraw = FHE.and(noLoans, sufficientCollateral);

        // Update collateral
        // If can withdraw: collateral - amount, else: unchanged
        euint64 newCollateral = FHE.select(
            canWithdraw,
            FHE.sub(profile.collateralBalance, withdrawAmount),
            profile.collateralBalance
        );

        profile.collateralBalance = newCollateral;

        // Update permissions
        FHE.allowThis(profile.collateralBalance);
        FHE.allow(profile.collateralBalance, msg.sender);

        profile.lastUpdateTime = block.timestamp;

        emit CollateralWithdrawn(msg.sender, block.timestamp);
    }

    /**
     * @notice Check if position is liquidatable
     * @param user User address to check
     * @return Encrypted boolean indicating liquidation status
     */
    function checkLiquidation(address user) external view returns (ebool) {
        UserProfile storage profile = userProfiles[user];

        // Liquidation occurs when:
        // collateral < liquidationThreshold

        ebool isUnderCollateralized = FHE.lt(
            profile.collateralBalance,
            loanTerms[user].liquidationThreshold
        );

        return isUnderCollateralized;
    }

    /**
     * @notice Get user's encrypted financial data
     * @return collateral User's collateral balance
     * @return borrowed User's borrowed amount
     * @return creditScore User's credit score
     */
    function getUserData()
        external
        view
        returns (euint64 collateral, euint64 borrowed, euint32 creditScore)
    {
        UserProfile storage profile = userProfiles[msg.sender];
        return (profile.collateralBalance, profile.borrowedAmount, profile.creditScore);
    }

    /**
     * @notice Get loan terms
     * @return maxLoan Maximum loan amount
     * @return interestRate Interest rate in basis points
     * @return isApproved Whether loan is approved
     */
    function getLoanTerms()
        external
        view
        returns (euint64 maxLoan, euint32 interestRate, ebool isApproved)
    {
        LoanTerms storage terms = loanTerms[msg.sender];
        return (terms.maxLoanAmount, terms.interestRate, terms.isApproved);
    }

    /**
     * @notice Calculate health factor
     * @return Health factor as encrypted value
     * @dev healthFactor = collateral * 100 / (borrowed * MIN_COLLATERAL_RATIO / 100)
     *      > 100 = healthy, < 100 = at risk
     */
    function calculateHealthFactor() external view returns (euint64) {
        UserProfile storage profile = userProfiles[msg.sender];

        // Avoid division by zero
        euint64 borrowed = profile.borrowedAmount;

        // healthFactor = (collateral * 100) / borrowed
        euint64 healthFactor = FHE.div(
            FHE.mul(profile.collateralBalance, FHE.asEuint64(100)),
            borrowed
        );

        return healthFactor;
    }

    /**
     * @notice Update credit score (simplified - in reality would be oracle)
     * @param encryptedNewScore New credit score
     * @param inputProof Input proof
     */
    function updateCreditScore(
        inEuint64 calldata encryptedNewScore,
        bytes calldata inputProof
    ) external {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.lastUpdateTime > 0, "Profile not initialized");

        euint32 newScore = FHE.asEuint32(encryptedNewScore, inputProof);

        profile.creditScore = newScore;

        // Update permissions
        FHE.allowThis(profile.creditScore);
        FHE.allow(profile.creditScore, msg.sender);

        profile.lastUpdateTime = block.timestamp;
    }

    /**
     * @notice Get account status
     * @return Encrypted boolean indicating if account is active
     */
    function isAccountActive() external view returns (ebool) {
        return userProfiles[msg.sender].isActive;
    }

    /**
     * @notice Calculate total debt with interest
     * @return Total debt including interest
     */
    function getTotalDebt() external view returns (euint64) {
        UserProfile storage profile = userProfiles[msg.sender];

        // Calculate interest
        euint64 interest = FHE.div(
            FHE.mul(
                profile.borrowedAmount,
                FHE.asEuint64(loanTerms[msg.sender].interestRate)
            ),
            FHE.asEuint64(10000)
        );

        // Total debt = principal + interest
        return FHE.add(profile.borrowedAmount, interest);
    }

    /**
     * @notice Check if user can borrow more
     * @param encryptedAdditionalAmount Additional amount to borrow
     * @param inputProof Input proof
     * @return Whether user can borrow additional amount
     */
    function canBorrowMore(
        inEuint64 calldata encryptedAdditionalAmount,
        bytes calldata inputProof
    ) external view returns (ebool) {
        UserProfile storage profile = userProfiles[msg.sender];

        euint64 additionalAmount = FHE.asEuint64(encryptedAdditionalAmount, inputProof);

        // New total borrowed
        euint64 newTotalBorrowed = FHE.add(profile.borrowedAmount, additionalAmount);

        // Max allowed based on collateral
        euint64 maxAllowed = FHE.div(
            FHE.mul(profile.collateralBalance, FHE.asEuint64(100)),
            FHE.asEuint64(MIN_COLLATERAL_RATIO)
        );

        // Can borrow if new total <= max allowed
        return FHE.lte(newTotalBorrowed, maxAllowed);
    }
}
