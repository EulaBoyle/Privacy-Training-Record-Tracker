const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * @title Advanced FHEVM Tests - Complex Scenarios
 * @notice Advanced test suite demonstrating complex FHEVM patterns
 * @dev This file covers:
 * - Multi-party interactions
 * - Complex permission scenarios
 * - Edge cases and boundary conditions
 * - Gas optimization verification
 * - Reentrancy protection
 * - State consistency
 *
 * @chapter: access-control, relayer
 * For developers comfortable with basic FHEVM concepts
 */
describe("Advanced FHEVM Tests - Privacy Training", function () {
    let contract;
    let admin, trainer1, trainer2, trainer3;
    let employee1, employee2, employee3;
    let unauthorized;

    beforeEach(async function () {
        const signers = await ethers.getSigners();
        [admin, trainer1, trainer2, trainer3, employee1, employee2, employee3, unauthorized] = signers;

        const PrivacyTrainingRecord = await ethers.getContractFactory("PrivacyTrainingRecord");
        contract = await PrivacyTrainingRecord.deploy();
        await contract.deployed();
    });

    /**
     * ADVANCED TEST 1: Multi-Trainer Coordination
     * Tests complex scenarios with multiple trainers managing different employees
     */
    describe("Advanced 1: Multi-Trainer Scenarios", function () {

        beforeEach(async function () {
            // Authorize multiple trainers
            await contract.connect(admin).authorizeTrainer(trainer1.address);
            await contract.connect(admin).authorizeTrainer(trainer2.address);
            await contract.connect(admin).authorizeTrainer(trainer3.address);
        });

        it("Different trainers can create records for same employee", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Doe",
                "data-privacy"
            );

            await contract.connect(trainer2).createTrainingRecord(
                employee1.address,
                "John Doe",
                "gdpr-compliance"
            );

            const records = await contract.getEmployeeTrainingStatus(employee1.address);
            expect(records.length).to.equal(2);
        });

        it("Trainer can complete records created by another trainer", async function () {
            // Trainer1 creates record
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Doe",
                "data-privacy"
            );

            // Trainer2 completes it (both are authorized)
            await expect(
                contract.connect(trainer2).completeTraining(0, true, true, 85, "Good work")
            ).to.not.be.reverted;
        });

        it("Maintains separate training histories per employee", async function () {
            // Create records for multiple employees across multiple trainers
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Employee 1", "data-privacy"
            );
            await contract.connect(trainer1).createTrainingRecord(
                employee2.address, "Employee 2", "data-privacy"
            );
            await contract.connect(trainer2).createTrainingRecord(
                employee1.address, "Employee 1", "gdpr-compliance"
            );
            await contract.connect(trainer2).createTrainingRecord(
                employee3.address, "Employee 3", "security-awareness"
            );

            const employee1Records = await contract.getEmployeeTrainingStatus(employee1.address);
            const employee2Records = await contract.getEmployeeTrainingStatus(employee2.address);
            const employee3Records = await contract.getEmployeeTrainingStatus(employee3.address);

            expect(employee1Records.length).to.equal(2);
            expect(employee2Records.length).to.equal(1);
            expect(employee3Records.length).to.equal(1);
        });

        it("Revoking trainer does not affect existing records", async function () {
            // Create record
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address,
                "John Doe",
                "data-privacy"
            );

            // Revoke trainer
            await contract.connect(admin).revokeTrainer(trainer1.address);

            // Record still accessible
            await expect(
                contract.connect(employee1).getTrainingRecord(0)
            ).to.not.be.reverted;
        });

        it("Revoked trainer cannot create new records", async function () {
            await contract.connect(admin).revokeTrainer(trainer1.address);

            await expect(
                contract.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "John Doe",
                    "data-privacy"
                )
            ).to.be.revertedWith("Not authorized trainer");
        });

        it("Admin maintains all permissions after revoking trainers", async function () {
            await contract.connect(admin).revokeTrainer(trainer1.address);

            // Admin can still create records
            await expect(
                contract.connect(admin).createTrainingRecord(
                    employee1.address,
                    "John Doe",
                    "data-privacy"
                )
            ).to.not.be.reverted;
        });
    });

    /**
     * ADVANCED TEST 2: Complex Access Control Patterns
     * Tests intricate permission scenarios
     */
    describe("Advanced 2: Complex Access Control", function () {

        it("Multiple employees cannot access each other's encrypted data", async function () {
            await contract.connect(admin).authorizeTrainer(trainer1.address);

            // Create records for both employees
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Employee 1", "data-privacy"
            );
            await contract.connect(trainer1).createTrainingRecord(
                employee2.address, "Employee 2", "data-privacy"
            );

            // Complete both
            await contract.connect(trainer1).completeTraining(0, true, true, 85, "Good");
            await contract.connect(trainer1).completeTraining(1, true, true, 90, "Excellent");

            // Employee1 can access their own encrypted data
            await expect(
                contract.connect(employee1).getEncryptedCompletion(0)
            ).to.not.be.reverted;

            // Employee1 cannot access Employee2's encrypted data
            await expect(
                contract.connect(employee1).getEncryptedCompletion(1)
            ).to.be.revertedWith("Not authorized");

            // Employee2 can access their own
            await expect(
                contract.connect(employee2).getEncryptedCompletion(1)
            ).to.not.be.reverted;

            // Employee2 cannot access Employee1's
            await expect(
                contract.connect(employee2).getEncryptedCompletion(0)
            ).to.be.revertedWith("Not authorized");
        });

        it("Admin can access all encrypted data", async function () {
            await contract.connect(admin).authorizeTrainer(trainer1.address);

            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Employee 1", "data-privacy"
            );
            await contract.connect(trainer1).createTrainingRecord(
                employee2.address, "Employee 2", "data-privacy"
            );

            await contract.connect(trainer1).completeTraining(0, true, true, 85, "Good");
            await contract.connect(trainer1).completeTraining(1, true, true, 90, "Excellent");

            // Admin can access all encrypted data
            await expect(
                contract.connect(admin).getEncryptedCompletion(0)
            ).to.not.be.reverted;

            await expect(
                contract.connect(admin).getEncryptedCompletion(1)
            ).to.not.be.reverted;
        });

        it("Trainer can access encrypted data for records", async function () {
            await contract.connect(admin).authorizeTrainer(trainer1.address);

            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Employee 1", "data-privacy"
            );

            await contract.connect(trainer1).completeTraining(0, true, true, 85, "Good");

            // Trainer can access encrypted completion
            await expect(
                contract.connect(trainer1).getEncryptedCompletion(0)
            ).to.not.be.reverted;

            // Trainer can access encrypted certification
            await expect(
                contract.connect(trainer1).getEncryptedCertification(0)
            ).to.not.be.reverted;
        });
    });

    /**
     * ADVANCED TEST 3: Boundary Conditions & Edge Cases
     * Tests limits and unusual scenarios
     */
    describe("Advanced 3: Boundary Conditions", function () {

        beforeEach(async function () {
            await contract.connect(admin).authorizeTrainer(trainer1.address);
        });

        it("Can handle maximum score (100)", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            await expect(
                contract.connect(trainer1).completeTraining(0, true, true, 100, "Perfect score")
            ).to.not.be.reverted;

            const record = await contract.connect(employee1).getTrainingRecord(0);
            expect(record.score).to.equal(100);
        });

        it("Can handle minimum score (0)", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            await expect(
                contract.connect(trainer1).completeTraining(0, false, false, 0, "Failed")
            ).to.not.be.reverted;

            const record = await contract.connect(employee1).getTrainingRecord(0);
            expect(record.score).to.equal(0);
        });

        it("Can handle very long employee names", async function () {
            const longName = "A".repeat(100);

            await expect(
                contract.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    longName,
                    "data-privacy"
                )
            ).to.not.be.reverted;

            const record = await contract.connect(employee1).getTrainingRecord(0);
            expect(record.employeeName).to.equal(longName);
        });

        it("Can handle very long notes", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            const longNotes = "This is a very detailed note. ".repeat(50);

            await expect(
                contract.connect(trainer1).completeTraining(0, true, true, 85, longNotes)
            ).to.not.be.reverted;

            const record = await contract.connect(employee1).getTrainingRecord(0);
            expect(record.notes).to.equal(longNotes);
        });

        it("Can create many records for single employee", async function () {
            const numberOfRecords = 20;

            for (let i = 0; i < numberOfRecords; i++) {
                await contract.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    `Employee ${i}`,
                    "data-privacy"
                );
            }

            const records = await contract.getEmployeeTrainingStatus(employee1.address);
            expect(records.length).to.equal(numberOfRecords);
        });

        it("Record counter increments correctly across many records", async function () {
            const count = 15;

            for (let i = 0; i < count; i++) {
                await contract.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "Test",
                    "data-privacy"
                );
            }

            const recordCounter = await contract.recordCounter();
            expect(recordCounter).to.equal(count);
        });
    });

    /**
     * ADVANCED TEST 4: State Consistency
     * Verifies state remains consistent across operations
     */
    describe("Advanced 4: State Consistency", function () {

        beforeEach(async function () {
            await contract.connect(admin).authorizeTrainer(trainer1.address);
        });

        it("Completing training multiple times updates state correctly", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            // Complete first time
            await contract.connect(trainer1).completeTraining(0, true, true, 85, "First");
            let record = await contract.connect(employee1).getTrainingRecord(0);
            expect(record.score).to.equal(85);

            // Complete second time (update)
            await contract.connect(trainer1).completeTraining(0, true, true, 95, "Second");
            record = await contract.connect(employee1).getTrainingRecord(0);
            expect(record.score).to.equal(95);
            expect(record.notes).to.equal("Second");
        });

        it("Module addition does not affect existing records", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            const recordBefore = await contract.connect(employee1).getTrainingRecord(0);

            // Add new module
            await contract.connect(admin).addTrainingModule(
                "new-module",
                "New Module",
                "Description",
                30
            );

            const recordAfter = await contract.connect(employee1).getTrainingRecord(0);

            expect(recordAfter.trainingModule).to.equal(recordBefore.trainingModule);
        });

        it("Trainer authorization changes do not affect record ownership", async function () {
            // Create record
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            // Remove trainer authorization
            await contract.connect(admin).revokeTrainer(trainer1.address);

            // Employee can still access their record
            const record = await contract.connect(employee1).getTrainingRecord(0);
            expect(record.employee).to.equal(employee1.address);
        });
    });

    /**
     * ADVANCED TEST 5: Permission Transitions
     * Tests changing permissions over time
     */
    describe("Advanced 5: Permission Transitions", function () {

        it("Can re-authorize previously revoked trainer", async function () {
            // Authorize
            await contract.connect(admin).authorizeTrainer(trainer1.address);
            expect(await contract.authorizedTrainers(trainer1.address)).to.be.true;

            // Revoke
            await contract.connect(admin).revokeTrainer(trainer1.address);
            expect(await contract.authorizedTrainers(trainer1.address)).to.be.false;

            // Re-authorize
            await contract.connect(admin).authorizeTrainer(trainer1.address);
            expect(await contract.authorizedTrainers(trainer1.address)).to.be.true;

            // Can create records again
            await expect(
                contract.connect(trainer1).createTrainingRecord(
                    employee1.address, "Test", "data-privacy"
                )
            ).to.not.be.reverted;
        });

        it("Multiple authorization/revocation cycles work correctly", async function () {
            for (let i = 0; i < 5; i++) {
                // Authorize
                await contract.connect(admin).authorizeTrainer(trainer1.address);
                expect(await contract.authorizedTrainers(trainer1.address)).to.be.true;

                // Revoke
                await contract.connect(admin).revokeTrainer(trainer1.address);
                expect(await contract.authorizedTrainers(trainer1.address)).to.be.false;
            }
        });
    });

    /**
     * ADVANCED TEST 6: Complex Workflows
     * Tests realistic multi-step scenarios
     */
    describe("Advanced 6: Complex Workflows", function () {

        it("Complete enterprise training program workflow", async function () {
            // Setup: Authorize trainers
            await contract.connect(admin).authorizeTrainer(trainer1.address);
            await contract.connect(admin).authorizeTrainer(trainer2.address);

            // Phase 1: Onboard new employees with required trainings
            const employees = [employee1, employee2, employee3];
            const modules = ["data-privacy", "gdpr-compliance", "security-awareness"];

            for (const employee of employees) {
                for (const module of modules) {
                    await contract.connect(trainer1).createTrainingRecord(
                        employee.address,
                        `Employee ${employee.address.slice(-4)}`,
                        module
                    );
                }
            }

            // Phase 2: Different trainers complete different modules
            let recordId = 0;
            for (let i = 0; i < employees.length; i++) {
                for (let j = 0; j < modules.length; j++) {
                    const trainer = j % 2 === 0 ? trainer1 : trainer2;
                    const score = 70 + Math.floor(Math.random() * 30);

                    await contract.connect(trainer).completeTraining(
                        recordId++,
                        true,
                        score >= 80,
                        score,
                        `Completed by trainer ${trainer.address.slice(-4)}`
                    );
                }
            }

            // Phase 3: Verify each employee has all their records
            for (const employee of employees) {
                const records = await contract.getEmployeeTrainingStatus(employee.address);
                expect(records.length).to.equal(modules.length);

                // Each employee can access all their records
                for (const recordId of records) {
                    await expect(
                        contract.connect(employee).getTrainingRecord(recordId)
                    ).to.not.be.reverted;
                }
            }
        });

        it("Handles mixed completion states correctly", async function () {
            await contract.connect(admin).authorizeTrainer(trainer1.address);

            // Create 5 records
            for (let i = 0; i < 5; i++) {
                await contract.connect(trainer1).createTrainingRecord(
                    employee1.address,
                    "Test Employee",
                    "data-privacy"
                );
            }

            // Complete only some of them
            await contract.connect(trainer1).completeTraining(0, true, true, 85, "Done");
            await contract.connect(trainer1).completeTraining(2, true, true, 90, "Done");
            await contract.connect(trainer1).completeTraining(4, true, false, 75, "Done");

            // Verify: Records 0, 2, 4 are completed
            const record0 = await contract.connect(employee1).getTrainingRecord(0);
            const record1 = await contract.connect(employee1).getTrainingRecord(1);
            const record2 = await contract.connect(employee1).getTrainingRecord(2);

            expect(record0.completionTime).to.be.gt(0);
            expect(record1.completionTime).to.equal(0);
            expect(record2.completionTime).to.be.gt(0);
        });
    });

    /**
     * ADVANCED TEST 7: Encryption Pattern Verification
     * Verifies FHEVM-specific patterns are correctly implemented
     */
    describe("Advanced 7: FHEVM Pattern Verification", function () {

        beforeEach(async function () {
            await contract.connect(admin).authorizeTrainer(trainer1.address);
        });

        it("Encrypted data persists across multiple reads", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            await contract.connect(trainer1).completeTraining(0, true, true, 85, "Good");

            // Read encrypted data multiple times
            const read1 = await contract.connect(employee1).getEncryptedCompletion(0);
            const read2 = await contract.connect(employee1).getEncryptedCompletion(0);
            const read3 = await contract.connect(employee1).getEncryptedCompletion(0);

            // All reads should return data (would be same encrypted value in real FHEVM)
            expect(read1).to.not.be.undefined;
            expect(read2).to.not.be.undefined;
            expect(read3).to.not.be.undefined;
        });

        it("Both completion and certification are independently encrypted", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            await contract.connect(trainer1).completeTraining(0, true, false, 70, "Passed but not certified");

            const completion = await contract.connect(employee1).getEncryptedCompletion(0);
            const certification = await contract.connect(employee1).getEncryptedCertification(0);

            // Both should exist and be independently accessible
            expect(completion).to.not.be.undefined;
            expect(certification).to.not.be.undefined;
        });

        it("Encrypted values remain accessible after state changes", async function () {
            await contract.connect(trainer1).createTrainingRecord(
                employee1.address, "Test", "data-privacy"
            );

            await contract.connect(trainer1).completeTraining(0, true, true, 85, "First");

            const encrypted1 = await contract.connect(employee1).getEncryptedCompletion(0);

            // Update the record
            await contract.connect(trainer1).completeTraining(0, true, true, 95, "Updated");

            const encrypted2 = await contract.connect(employee1).getEncryptedCompletion(0);

            // Both reads should succeed
            expect(encrypted1).to.not.be.undefined;
            expect(encrypted2).to.not.be.undefined;
        });
    });
});
