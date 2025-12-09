const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title Basic FHEVM Tests - Getting Started
 * @notice Simplified test suite for beginners learning FHEVM
 * @dev This file demonstrates the most basic FHEVM concepts:
 * - Contract deployment
 * - Creating encrypted values
 * - Access control basics
 * - Simple encryption/decryption patterns
 *
 * @chapter: basic
 * Start here if you're new to FHEVM testing
 */
describe("Basic FHEVM Tests - Privacy Training", function () {
    let contract;
    let owner, trainer, employee;

    // Deploy fresh contract before each test
    beforeEach(async function () {
        [owner, trainer, employee] = await ethers.getSigners();

        const PrivacyTrainingRecord = await ethers.getContractFactory("PrivacyTrainingRecord");
        contract = await PrivacyTrainingRecord.deploy();
        await contract.deployed();
    });

    /**
     * TEST 1: Basic Contract Deployment
     * Learn: How to deploy an FHEVM contract
     */
    describe("Test 1: Contract Deployment", function () {

        it("Contract deploys successfully", async function () {
            expect(contract.address).to.be.properAddress;
        });

        it("Owner is set correctly", async function () {
            const admin = await contract.admin();
            expect(admin).to.equal(owner.address);
        });

        it("Record counter starts at zero", async function () {
            const counter = await contract.recordCounter();
            expect(counter).to.equal(0);
        });
    });

    /**
     * TEST 2: Creating Encrypted Records
     * Learn: How to create records with encrypted fields (ebool)
     */
    describe("Test 2: Creating Training Records", function () {

        it("Can create a basic training record", async function () {
            // Create record with encrypted completion status
            const tx = await contract.createTrainingRecord(
                employee.address,
                "Test Employee",
                "data-privacy"
            );

            // Wait for transaction
            await tx.wait();

            // Verify record was created
            const counter = await contract.recordCounter();
            expect(counter).to.equal(1);
        });

        it("Emits TrainingRecordCreated event", async function () {
            await expect(
                contract.createTrainingRecord(
                    employee.address,
                    "Test Employee",
                    "data-privacy"
                )
            )
                .to.emit(contract, "TrainingRecordCreated")
                .withArgs(0, employee.address, "data-privacy");
        });

        it("Stores employee address correctly", async function () {
            await contract.createTrainingRecord(
                employee.address,
                "Test Employee",
                "data-privacy"
            );

            const record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.employee).to.equal(employee.address);
        });
    });

    /**
     * TEST 3: Basic Access Control
     * Learn: How FHEVM enforces who can see encrypted data
     */
    describe("Test 3: Access Control Basics", function () {

        it("Only authorized trainers can create records", async function () {
            // Owner is auto-authorized, so this works
            await expect(
                contract.createTrainingRecord(
                    employee.address,
                    "Test Employee",
                    "data-privacy"
                )
            ).to.not.be.reverted;

            // Unauthorized user cannot create
            await expect(
                contract.connect(employee).createTrainingRecord(
                    employee.address,
                    "Test Employee",
                    "data-privacy"
                )
            ).to.be.revertedWith("Not authorized trainer");
        });

        it("Employees can view their own records", async function () {
            // Create record
            await contract.createTrainingRecord(
                employee.address,
                "Test Employee",
                "data-privacy"
            );

            // Employee can access
            await expect(
                contract.connect(employee).getTrainingRecord(0)
            ).to.not.be.reverted;
        });

        it("Employees cannot view others' records", async function () {
            const [, , employee1, employee2] = await ethers.getSigners();

            // Create record for employee1
            await contract.createTrainingRecord(
                employee1.address,
                "Employee One",
                "data-privacy"
            );

            // Employee2 cannot access employee1's record
            await expect(
                contract.connect(employee2).getTrainingRecord(0)
            ).to.be.revertedWith("Not authorized to view this record");
        });
    });

    /**
     * TEST 4: Working with Encrypted Data
     * Learn: How to handle encrypted booleans (ebool)
     */
    describe("Test 4: Encrypted Data Handling", function () {

        beforeEach(async function () {
            // Create a training record
            await contract.createTrainingRecord(
                employee.address,
                "Test Employee",
                "data-privacy"
            );
        });

        it("Can retrieve encrypted completion status", async function () {
            // Get encrypted value
            const encryptedCompletion = await contract.connect(employee).getEncryptedCompletion(0);

            // Encrypted value exists (would be decrypted in real FHEVM)
            expect(encryptedCompletion).to.not.be.undefined;
        });

        it("Can retrieve encrypted certification status", async function () {
            const encryptedCertification = await contract.connect(employee).getEncryptedCertification(0);

            expect(encryptedCertification).to.not.be.undefined;
        });

        it("Unauthorized users cannot access encrypted data", async function () {
            const [, , , unauthorized] = await ethers.getSigners();

            await expect(
                contract.connect(unauthorized).getEncryptedCompletion(0)
            ).to.be.revertedWith("Not authorized");
        });
    });

    /**
     * TEST 5: Completing Training
     * Learn: How to update encrypted data
     */
    describe("Test 5: Completing Training", function () {

        beforeEach(async function () {
            await contract.createTrainingRecord(
                employee.address,
                "Test Employee",
                "data-privacy"
            );
        });

        it("Can mark training as completed", async function () {
            const tx = await contract.completeTraining(
                0,              // record ID
                true,           // completed
                true,           // certified
                85,             // score
                "Good work"     // notes
            );

            await expect(tx)
                .to.emit(contract, "TrainingCompleted")
                .withArgs(0, employee.address, true);
        });

        it("Completion updates the timestamp", async function () {
            await contract.completeTraining(0, true, true, 85, "Good work");

            const record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.completionTime).to.be.gt(0);
        });

        it("Score is stored correctly", async function () {
            await contract.completeTraining(0, true, true, 92, "Excellent");

            const record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.score).to.equal(92);
        });

        it("Notes are stored correctly", async function () {
            await contract.completeTraining(0, true, true, 85, "Very good understanding");

            const record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.notes).to.equal("Very good understanding");
        });
    });

    /**
     * TEST 6: Training Modules
     * Learn: How predefined data works with FHEVM
     */
    describe("Test 6: Training Modules", function () {

        it("Contract has 4 default modules", async function () {
            const [moduleIds, names, descriptions, durations] =
                await contract.getActiveTrainingModules();

            expect(moduleIds.length).to.equal(4);
        });

        it("Module names are correct", async function () {
            const [, names] = await contract.getActiveTrainingModules();

            expect(names[0]).to.equal("Data Privacy Fundamentals");
            expect(names[1]).to.equal("GDPR Compliance");
            expect(names[2]).to.equal("Security Awareness");
            expect(names[3]).to.equal("Incident Response");
        });

        it("Module durations are set correctly", async function () {
            const [, , , durations] = await contract.getActiveTrainingModules();

            expect(durations[0]).to.equal(30);  // Data Privacy: 30 days
            expect(durations[1]).to.equal(45);  // GDPR: 45 days
            expect(durations[2]).to.equal(60);  // Security: 60 days
            expect(durations[3]).to.equal(30);  // Incident: 30 days
        });
    });

    /**
     * TEST 7: Authorization Management
     * Learn: How to manage trainer permissions
     */
    describe("Test 7: Trainer Authorization", function () {

        it("Can authorize new trainer", async function () {
            await contract.authorizeTrainer(trainer.address);

            const isAuthorized = await contract.authorizedTrainers(trainer.address);
            expect(isAuthorized).to.be.true;
        });

        it("Authorized trainer can create records", async function () {
            await contract.authorizeTrainer(trainer.address);

            await expect(
                contract.connect(trainer).createTrainingRecord(
                    employee.address,
                    "Test Employee",
                    "data-privacy"
                )
            ).to.not.be.reverted;
        });

        it("Can revoke trainer authorization", async function () {
            // First authorize
            await contract.authorizeTrainer(trainer.address);

            // Then revoke
            await contract.revokeTrainer(trainer.address);

            const isAuthorized = await contract.authorizedTrainers(trainer.address);
            expect(isAuthorized).to.be.false;
        });

        it("Revoked trainer cannot create records", async function () {
            await contract.authorizeTrainer(trainer.address);
            await contract.revokeTrainer(trainer.address);

            await expect(
                contract.connect(trainer).createTrainingRecord(
                    employee.address,
                    "Test Employee",
                    "data-privacy"
                )
            ).to.be.revertedWith("Not authorized trainer");
        });
    });

    /**
     * TEST 8: Employee Training History
     * Learn: How to track multiple records per employee
     */
    describe("Test 8: Employee Training History", function () {

        it("Employee can have multiple training records", async function () {
            // Create 3 different training records
            await contract.createTrainingRecord(employee.address, "Test", "data-privacy");
            await contract.createTrainingRecord(employee.address, "Test", "gdpr-compliance");
            await contract.createTrainingRecord(employee.address, "Test", "security-awareness");

            const records = await contract.getEmployeeTrainingStatus(employee.address);
            expect(records.length).to.equal(3);
        });

        it("Returns empty array for new employee", async function () {
            const records = await contract.getEmployeeTrainingStatus(employee.address);
            expect(records.length).to.equal(0);
        });

        it("Each record has unique ID", async function () {
            await contract.createTrainingRecord(employee.address, "Test", "data-privacy");
            await contract.createTrainingRecord(employee.address, "Test", "gdpr-compliance");

            const records = await contract.getEmployeeTrainingStatus(employee.address);
            expect(records[0]).to.equal(0);
            expect(records[1]).to.equal(1);
        });
    });

    /**
     * TEST 9: Training Expiry
     * Learn: How time-based logic works with encrypted data
     */
    describe("Test 9: Training Expiry", function () {

        beforeEach(async function () {
            await contract.createTrainingRecord(
                employee.address,
                "Test Employee",
                "data-privacy"
            );
        });

        it("New record is not expired", async function () {
            const isExpired = await contract.isTrainingExpired(0);
            expect(isExpired).to.be.false;
        });

        it("Completed training sets expiry time", async function () {
            await contract.completeTraining(0, true, true, 85, "Good");

            const record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.expiryTime).to.be.gt(0);
        });

        it("Incomplete training has no expiry", async function () {
            // Don't complete training
            const record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.expiryTime).to.equal(0);
        });
    });

    /**
     * TEST 10: Simple Integration Flow
     * Learn: Complete workflow from start to finish
     */
    describe("Test 10: Complete Simple Workflow", function () {

        it("Full training lifecycle works correctly", async function () {
            // Step 1: Create record
            await contract.createTrainingRecord(
                employee.address,
                "Alice Johnson",
                "data-privacy"
            );

            // Step 2: Verify creation
            let record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.employeeName).to.equal("Alice Johnson");
            expect(record.score).to.equal(0);

            // Step 3: Complete training
            await contract.completeTraining(0, true, true, 90, "Excellent work");

            // Step 4: Verify completion
            record = await contract.connect(employee).getTrainingRecord(0);
            expect(record.score).to.equal(90);
            expect(record.completionTime).to.be.gt(0);

            // Step 5: Check encrypted status exists
            const encryptedStatus = await contract.connect(employee).getEncryptedCompletion(0);
            expect(encryptedStatus).to.not.be.undefined;
        });
    });
});
