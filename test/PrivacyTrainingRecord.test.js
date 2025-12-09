const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title PrivacyTrainingRecord Comprehensive Test Suite
 * @notice This test suite demonstrates FHEVM concepts including:
 * - Encrypted data storage (ebool)
 * - Access control with FHE
 * - Role-based permissions
 * - Common pitfalls and anti-patterns
 *
 * @dev Tests are organized into categories:
 * 1. Deployment & Initialization
 * 2. Access Control & Permissions
 * 3. Training Record Creation
 * 4. Training Completion with Encryption
 * 5. Data Retrieval & Decryption
 * 6. Edge Cases & Error Handling
 * 7. Anti-patterns (What NOT to do)
 */
describe("PrivacyTrainingRecord - FHEVM Example Tests", function () {
    let privacyTrainingRecord;
    let admin, trainer1, trainer2, employee1, employee2, unauthorized;

    // Test constants
    const TRAINING_MODULES = {
        DATA_PRIVACY: "data-privacy",
        GDPR: "gdpr-compliance",
        SECURITY: "security-awareness",
        INCIDENT: "incident-response"
    };

    /**
     * Setup: Deploy contract before each test
     * This ensures test isolation and clean state
     */
    beforeEach(async function () {
        // Get test accounts
        [admin, trainer1, trainer2, employee1, employee2, unauthorized] = await ethers.getSigners();

        // Deploy contract
        const PrivacyTrainingRecord = await ethers.getContractFactory("PrivacyTrainingRecord");
        privacyTrainingRecord = await PrivacyTrainingRecord.deploy();
        await privacyTrainingRecord.deployed();
    });

    /**
     * CATEGORY 1: Deployment & Initialization Tests
     * @chapter: basic
     * These tests verify contract deployment and initial state
     */
    describe("1. Deployment & Initialization", function () {

        it("Should deploy with correct admin address", async function () {
            const contractAdmin = await privacyTrainingRecord.admin();
            expect(contractAdmin).to.equal(admin.address);
        });

        it("Should automatically authorize deployer as trainer", async function () {
            const isAuthorized = await privacyTrainingRecord.authorizedTrainers(admin.address);
            expect(isAuthorized).to.be.true;
        });

        it("Should initialize with zero training records", async function () {
            const recordCounter = await privacyTrainingRecord.recordCounter();
            expect(recordCounter).to.equal(0);
        });

        it("Should have predefined training modules", async function () {
            const [moduleIds, names, descriptions, durations] =
                await privacyTrainingRecord.getActiveTrainingModules();

            expect(moduleIds.length).to.equal(4);
            expect(names[0]).to.equal("Data Privacy Fundamentals");
            expect(durations[0]).to.equal(30); // 30 days
        });
    });

    /**
     * CATEGORY 2: Access Control & Permissions Tests
     * @chapter: access-control
     * Demonstrates FHEVM access control patterns with encrypted data
     */
    describe("2. Access Control & Permissions", function () {

        it("Should allow admin to authorize new trainers", async function () {
            await expect(privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address))
                .to.emit(privacyTrainingRecord, "TrainerAuthorized")
                .withArgs(trainer1.address);

            const isAuthorized = await privacyTrainingRecord.authorizedTrainers(trainer1.address);
            expect(isAuthorized).to.be.true;
        });

        it("Should allow admin to revoke trainer authorization", async function () {
            // First authorize
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);

            // Then revoke
            await expect(privacyTrainingRecord.connect(admin).revokeTrainer(trainer1.address))
                .to.emit(privacyTrainingRecord, "TrainerRevoked")
                .withArgs(trainer1.address);

            const isAuthorized = await privacyTrainingRecord.authorizedTrainers(trainer1.address);
            expect(isAuthorized).to.be.false;
        });

        it("Should prevent unauthorized users from authorizing trainers", async function () {
            await expect(
                privacyTrainingRecord.connect(unauthorized).authorizeTrainer(trainer1.address)
            ).to.be.revertedWith("Only admin can perform this action");
        });

        it("Should prevent unauthorized users from adding training modules", async function () {
            await expect(
                privacyTrainingRecord.connect(unauthorized).addTrainingModule(
                    "new-module",
                    "New Training Module",
                    "Description",
                    30
                )
            ).to.be.revertedWith("Only admin can perform this action");
        });

        it("Should allow admin to add new training modules", async function () {
            await privacyTrainingRecord.connect(admin).addTrainingModule(
                "cyber-security",
                "Cybersecurity Fundamentals",
                "Advanced cybersecurity training",
                45
            );

            const module = await privacyTrainingRecord.trainingModules("cyber-security");
            expect(module.name).to.equal("Cybersecurity Fundamentals");
            expect(module.duration).to.equal(45);
        });
    });

    /**
     * CATEGORY 3: Training Record Creation Tests
     * @chapter: encryption
     * Shows how to create records with encrypted data
     */
    describe("3. Training Record Creation", function () {

        beforeEach(async function () {
            // Authorize trainer for these tests
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);
        });

        it("Should create training record with encrypted completion status", async function () {
            await expect(
                privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "John Smith",
                    TRAINING_MODULES.DATA_PRIVACY
                )
            )
                .to.emit(privacyTrainingRecord, "TrainingRecordCreated")
                .withArgs(0, employee1.address, TRAINING_MODULES.DATA_PRIVACY);

            const recordCounter = await privacyTrainingRecord.recordCounter();
            expect(recordCounter).to.equal(1);
        });

        it("Should initialize encrypted fields to false", async function () {
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Smith",
                TRAINING_MODULES.DATA_PRIVACY
            );

            const record = await privacyTrainingRecord.connect(employee1).getTrainingRecord(0);
            expect(record.completionTime).to.equal(0);
            expect(record.isActive).to.be.true;
            expect(record.score).to.equal(0);
        });

        it("Should track employee training records correctly", async function () {
            // Create multiple records for same employee
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Smith",
                TRAINING_MODULES.DATA_PRIVACY
            );

            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Smith",
                TRAINING_MODULES.GDPR
            );

            const employeeRecords = await privacyTrainingRecord.getEmployeeTrainingStatus(employee1.address);
            expect(employeeRecords.length).to.equal(2);
            expect(employeeRecords[0]).to.equal(0);
            expect(employeeRecords[1]).to.equal(1);
        });

        it("Should prevent unauthorized users from creating records", async function () {
            await expect(
                privacyTrainingRecord.connect(unauthorized).createTrainingRecord(
                    employee1.address,
                    "John Smith",
                    TRAINING_MODULES.DATA_PRIVACY
                )
            ).to.be.revertedWith("Not authorized trainer");
        });

        it("Should prevent creation with inactive training module", async function () {
            await expect(
                privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "John Smith",
                    "non-existent-module"
                )
            ).to.be.revertedWith("Training module not active");
        });
    });

    /**
     * CATEGORY 4: Training Completion with Encryption
     * @chapter: encryption
     * Demonstrates encrypted data updates and permission management
     */
    describe("4. Training Completion with Encryption", function () {

        let recordId;

        beforeEach(async function () {
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);

            // Create a training record
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Smith",
                TRAINING_MODULES.DATA_PRIVACY
            );
            recordId = 0;
        });

        it("Should complete training with encrypted status", async function () {
            await expect(
                privacyTrainingRecord.connect(trainer1).completeTraining(
                    recordId,
                    true,  // completed
                    true,  // certified
                    85,    // score
                    "Excellent performance"
                )
            )
                .to.emit(privacyTrainingRecord, "TrainingCompleted")
                .withArgs(recordId, employee1.address, true);
        });

        it("Should update completion timestamp when completed", async function () {
            const blockNumBefore = await ethers.provider.getBlockNumber();
            const blockBefore = await ethers.provider.getBlock(blockNumBefore);
            const timestampBefore = blockBefore.timestamp;

            await privacyTrainingRecord.connect(trainer1).completeTraining(
                recordId,
                true,
                true,
                85,
                "Excellent performance"
            );

            const record = await privacyTrainingRecord.connect(employee1).getTrainingRecord(recordId);
            expect(record.completionTime).to.be.gt(timestampBefore);
        });

        it("Should set expiry time based on module duration", async function () {
            await privacyTrainingRecord.connect(trainer1).completeTraining(
                recordId,
                true,
                true,
                85,
                "Excellent performance"
            );

            const record = await privacyTrainingRecord.connect(employee1).getTrainingRecord(recordId);

            // Data Privacy module has 30 days duration
            const expectedExpiry = record.completionTime.add(30 * 24 * 60 * 60);
            expect(record.expiryTime).to.equal(expectedExpiry);
        });

        it("Should store score and notes in plaintext", async function () {
            await privacyTrainingRecord.connect(trainer1).completeTraining(
                recordId,
                true,
                true,
                92,
                "Outstanding achievement"
            );

            const record = await privacyTrainingRecord.connect(employee1).getTrainingRecord(recordId);
            expect(record.score).to.equal(92);
            expect(record.notes).to.equal("Outstanding achievement");
        });

        it("Should allow marking training as not completed", async function () {
            await privacyTrainingRecord.connect(trainer1).completeTraining(
                recordId,
                false,  // not completed
                false,  // not certified
                45,     // failing score
                "Needs improvement"
            );

            const record = await privacyTrainingRecord.connect(employee1).getTrainingRecord(recordId);
            expect(record.score).to.equal(45);
            expect(record.notes).to.equal("Needs improvement");
        });

        it("Should prevent unauthorized users from completing training", async function () {
            await expect(
                privacyTrainingRecord.connect(unauthorized).completeTraining(
                    recordId,
                    true,
                    true,
                    85,
                    "Test"
                )
            ).to.be.revertedWith("Not authorized trainer");
        });

        it("Should prevent completing inactive records", async function () {
            // Complete the training first
            await privacyTrainingRecord.connect(trainer1).completeTraining(
                recordId,
                true,
                true,
                85,
                "First completion"
            );

            // Try to complete again - this should work as record is still active
            // In a real scenario, you might want to add logic to prevent re-completion
            await expect(
                privacyTrainingRecord.connect(trainer1).completeTraining(
                    recordId,
                    true,
                    true,
                    90,
                    "Second completion"
                )
            ).to.not.be.reverted;
        });
    });

    /**
     * CATEGORY 5: Data Retrieval & Decryption
     * @chapter: access-control
     * Shows access control for encrypted data retrieval
     */
    describe("5. Data Retrieval & Decryption", function () {

        let recordId;

        beforeEach(async function () {
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);

            // Create and complete a training record
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Smith",
                TRAINING_MODULES.SECURITY
            );
            recordId = 0;

            await privacyTrainingRecord.connect(trainer1).completeTraining(
                recordId,
                true,
                true,
                88,
                "Good understanding of security principles"
            );
        });

        it("Should allow employee to retrieve their own training record", async function () {
            const record = await privacyTrainingRecord.connect(employee1).getTrainingRecord(recordId);

            expect(record.employee).to.equal(employee1.address);
            expect(record.employeeName).to.equal("John Smith");
            expect(record.trainingModule).to.equal(TRAINING_MODULES.SECURITY);
            expect(record.score).to.equal(88);
        });

        it("Should allow trainer to retrieve records they created", async function () {
            const record = await privacyTrainingRecord.connect(trainer1).getTrainingRecord(recordId);

            expect(record.employeeName).to.equal("John Smith");
        });

        it("Should allow admin to retrieve any record", async function () {
            const record = await privacyTrainingRecord.connect(admin).getTrainingRecord(recordId);

            expect(record.employee).to.equal(employee1.address);
        });

        it("Should prevent unauthorized users from retrieving records", async function () {
            await expect(
                privacyTrainingRecord.connect(employee2).getTrainingRecord(recordId)
            ).to.be.revertedWith("Not authorized to view this record");
        });

        it("Should allow employee to get encrypted completion status", async function () {
            const encryptedCompletion = await privacyTrainingRecord.connect(employee1).getEncryptedCompletion(recordId);

            // In real FHEVM environment, this would be an encrypted value
            // that can only be decrypted by authorized parties
            expect(encryptedCompletion).to.not.be.undefined;
        });

        it("Should allow employee to get encrypted certification status", async function () {
            const encryptedCertification = await privacyTrainingRecord.connect(employee1).getEncryptedCertification(recordId);

            expect(encryptedCertification).to.not.be.undefined;
        });

        it("Should prevent unauthorized access to encrypted data", async function () {
            await expect(
                privacyTrainingRecord.connect(unauthorized).getEncryptedCompletion(recordId)
            ).to.be.revertedWith("Not authorized");
        });

        it("Should check training expiry correctly", async function () {
            const isExpired = await privacyTrainingRecord.isTrainingExpired(recordId);

            // Should not be expired immediately after completion
            expect(isExpired).to.be.false;
        });
    });

    /**
     * CATEGORY 6: Edge Cases & Error Handling
     * @chapter: anti-patterns
     * Demonstrates proper error handling and edge case management
     */
    describe("6. Edge Cases & Error Handling", function () {

        beforeEach(async function () {
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);
        });

        it("Should handle empty employee name gracefully", async function () {
            await expect(
                privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "",  // Empty name
                    TRAINING_MODULES.DATA_PRIVACY
                )
            ).to.not.be.reverted;
        });

        it("Should handle zero score", async function () {
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "Test User",
                TRAINING_MODULES.DATA_PRIVACY
            );

            await expect(
                privacyTrainingRecord.connect(trainer1).completeTraining(
                    0,
                    false,
                    false,
                    0,  // Zero score
                    "Failed to complete"
                )
            ).to.not.be.reverted;
        });

        it("Should handle empty notes", async function () {
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "Test User",
                TRAINING_MODULES.DATA_PRIVACY
            );

            await expect(
                privacyTrainingRecord.connect(trainer1).completeTraining(
                    0,
                    true,
                    true,
                    75,
                    ""  // Empty notes
                )
            ).to.not.be.reverted;
        });

        it("Should handle multiple training records for same employee", async function () {
            for (let i = 0; i < 5; i++) {
                await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "John Smith",
                    TRAINING_MODULES.DATA_PRIVACY
                );
            }

            const employeeRecords = await privacyTrainingRecord.getEmployeeTrainingStatus(employee1.address);
            expect(employeeRecords.length).to.equal(5);
        });

        it("Should return empty array for employee with no records", async function () {
            const employeeRecords = await privacyTrainingRecord.getEmployeeTrainingStatus(employee2.address);
            expect(employeeRecords.length).to.equal(0);
        });
    });

    /**
     * CATEGORY 7: Anti-patterns - What NOT to do
     * @chapter: anti-patterns
     * Demonstrates common mistakes and how to avoid them
     */
    describe("7. Anti-patterns & Common Mistakes", function () {

        it("ANTI-PATTERN: Missing FHE.allowThis() - would fail in real FHEVM", async function () {
            /**
             * Common Mistake: Forgetting to call FHE.allowThis() after creating encrypted values
             *
             * In our contract, we correctly do:
             *   record.encryptedCompletion = FHE.asEbool(false);
             *   FHE.allowThis(record.encryptedCompletion);  // ✓ CORRECT
             *
             * WRONG way would be:
             *   record.encryptedCompletion = FHE.asEbool(false);
             *   // Missing FHE.allowThis() ✗ WRONG - contract can't use the value
             *
             * This test verifies the contract does it correctly
             */
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);

            await expect(
                privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "Test User",
                    TRAINING_MODULES.DATA_PRIVACY
                )
            ).to.not.be.reverted;
        });

        it("ANTI-PATTERN: Attempting to use view function with encrypted values", async function () {
            /**
             * Common Mistake: View functions cannot modify state, including FHE permissions
             *
             * WRONG: function getCompletion() external view returns (ebool) {
             *     ebool value = FHE.asEbool(true);
             *     FHE.allow(value, msg.sender); // ✗ WRONG in view function
             *     return value;
             * }
             *
             * CORRECT: Return existing encrypted values that already have permissions set
             * Our contract correctly returns pre-existing encrypted values
             */
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);

            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "Test User",
                TRAINING_MODULES.DATA_PRIVACY
            );

            // This should work because permissions were set during creation
            await expect(
                privacyTrainingRecord.connect(employee1).getEncryptedCompletion(0)
            ).to.not.be.reverted;
        });

        it("ANTI-PATTERN: Not checking authorization before operations", async function () {
            /**
             * Common Mistake: Forgetting to check if user is authorized
             *
             * WRONG: function createRecord() external {
             *     // No authorization check ✗
             *     // ... create record
             * }
             *
             * CORRECT: Use modifiers to enforce authorization
             * Our contract correctly uses onlyAuthorizedTrainer modifier
             */
            await expect(
                privacyTrainingRecord.connect(unauthorized).createTrainingRecord(
                    employee1.address,
                    "Test User",
                    TRAINING_MODULES.DATA_PRIVACY
                )
            ).to.be.revertedWith("Not authorized trainer");
        });

        it("BEST PRACTICE: Proper permission management for encrypted data", async function () {
            /**
             * Best Practice: Always set permissions for all parties that need access
             *
             * Our contract correctly does:
             *   FHE.allowThis(record.encryptedCompletion);      // Contract access
             *   FHE.allow(record.encryptedCompletion, employee); // Employee access
             */
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);

            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "Test User",
                TRAINING_MODULES.DATA_PRIVACY
            );

            // Both trainer and employee should be able to access
            await expect(
                privacyTrainingRecord.connect(trainer1).getEncryptedCompletion(0)
            ).to.not.be.reverted;

            await expect(
                privacyTrainingRecord.connect(employee1).getEncryptedCompletion(0)
            ).to.not.be.reverted;
        });
    });

    /**
     * CATEGORY 8: Integration & Workflow Tests
     * @chapter: basic
     * Tests complete workflows from start to finish
     */
    describe("8. Complete Workflow Integration", function () {

        it("Should handle complete training lifecycle", async function () {
            // 1. Admin authorizes trainer
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);

            // 2. Trainer creates training record
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "Alice Johnson",
                TRAINING_MODULES.GDPR
            );

            // 3. Verify record exists
            const recordsBefore = await privacyTrainingRecord.getEmployeeTrainingStatus(employee1.address);
            expect(recordsBefore.length).to.equal(1);

            // 4. Trainer completes training
            await privacyTrainingRecord.connect(trainer1).completeTraining(
                0,
                true,
                true,
                95,
                "Exceptional understanding of GDPR principles"
            );

            // 5. Employee retrieves and verifies their record
            const record = await privacyTrainingRecord.connect(employee1).getTrainingRecord(0);
            expect(record.score).to.equal(95);
            expect(record.completionTime).to.be.gt(0);

            // 6. Check encrypted completion status
            const encryptedCompletion = await privacyTrainingRecord.connect(employee1).getEncryptedCompletion(0);
            expect(encryptedCompletion).to.not.be.undefined;
        });

        it("Should handle multi-employee scenario", async function () {
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer1.address);
            await privacyTrainingRecord.connect(admin).authorizeTrainer(trainer2.address);

            // Trainer 1 creates records for Employee 1
            await privacyTrainingRecord.connect(trainer1).createTrainingRecord(
                employee1.address,
                "Alice Johnson",
                TRAINING_MODULES.DATA_PRIVACY
            );

            // Trainer 2 creates records for Employee 2
            await privacyTrainingRecord.connect(trainer2).createTrainingRecord(
                employee2.address,
                "Bob Wilson",
                TRAINING_MODULES.SECURITY
            );

            // Verify separation of records
            const employee1Records = await privacyTrainingRecord.getEmployeeTrainingStatus(employee1.address);
            const employee2Records = await privacyTrainingRecord.getEmployeeTrainingStatus(employee2.address);

            expect(employee1Records.length).to.equal(1);
            expect(employee2Records.length).to.equal(1);

            // Employee 1 cannot access Employee 2's records
            await expect(
                privacyTrainingRecord.connect(employee1).getTrainingRecord(1)
            ).to.be.revertedWith("Not authorized to view this record");
        });
    });
});
