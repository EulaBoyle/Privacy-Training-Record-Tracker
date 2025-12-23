/**
 * Example Validation Tool
 *
 * This script validates FHEVM examples for correctness and best practices.
 * It checks contracts, tests, documentation, and configuration.
 *
 * Usage:
 *   npx ts-node scripts/validate-examples.ts
 *   npx ts-node scripts/validate-examples.ts --fix
 */

import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
  passed: boolean;
  message: string;
  severity: "error" | "warning" | "info";
}

interface ExampleValidation {
  name: string;
  results: ValidationResult[];
}

function validateContract(contractPath: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!fs.existsSync(contractPath)) {
    results.push({
      passed: false,
      message: "Contract file not found",
      severity: "error",
    });
    return results;
  }

  const content = fs.readFileSync(contractPath, "utf-8");

  // Check for SPDX license
  if (!content.includes("SPDX-License-Identifier")) {
    results.push({
      passed: false,
      message: "Missing SPDX license identifier",
      severity: "error",
    });
  }

  // Check for FHEVM imports
  if (!content.includes("@fhevm/solidity")) {
    results.push({
      passed: false,
      message: "Missing FHEVM import",
      severity: "error",
    });
  }

  // Check for config inheritance
  if (!content.includes("SepoliaConfig") && !content.includes("ZamaEthereumConfig")) {
    results.push({
      passed: false,
      message: "Contract should inherit from FHEVM config",
      severity: "warning",
    });
  }

  // Check for FHE.allow or FHE.allowThis usage
  if (
    content.includes("ebool") ||
    content.includes("euint") ||
    content.includes("eaddress")
  ) {
    if (!content.includes("FHE.allow")) {
      results.push({
        passed: false,
        message: "Encrypted values found but no FHE.allow() calls",
        severity: "warning",
      });
    }
  }

  // Check for documentation
  if (!content.includes("@title") || !content.includes("@notice")) {
    results.push({
      passed: false,
      message: "Missing NatSpec documentation",
      severity: "warning",
    });
  }

  if (results.length === 0) {
    results.push({
      passed: true,
      message: "Contract validation passed",
      severity: "info",
    });
  }

  return results;
}

function validateTest(testPath: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!fs.existsSync(testPath)) {
    results.push({
      passed: false,
      message: "Test file not found",
      severity: "error",
    });
    return results;
  }

  const content = fs.readFileSync(testPath, "utf-8");

  // Check for describe blocks
  if (!content.includes("describe")) {
    results.push({
      passed: false,
      message: "Missing describe block",
      severity: "error",
    });
  }

  // Check for test cases
  if (!content.includes("it(")) {
    results.push({
      passed: false,
      message: "No test cases found",
      severity: "error",
    });
  }

  // Check for deployment test
  if (!content.includes("deploy")) {
    results.push({
      passed: false,
      message: "Missing deployment test",
      severity: "warning",
    });
  }

  // Check for beforeEach
  if (!content.includes("beforeEach")) {
    results.push({
      passed: false,
      message: "Consider using beforeEach for setup",
      severity: "info",
    });
  }

  if (results.every((r) => r.severity !== "error")) {
    results.push({
      passed: true,
      message: "Test validation passed",
      severity: "info",
    });
  }

  return results;
}

function validateDocumentation(docPath: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!fs.existsSync(docPath)) {
    results.push({
      passed: false,
      message: "Documentation file not found",
      severity: "warning",
    });
    return results;
  }

  const content = fs.readFileSync(docPath, "utf-8");

  // Check for required sections
  const requiredSections = [
    "## Overview",
    "## Concepts",
    "## Usage",
    "## Resources",
  ];

  requiredSections.forEach((section) => {
    if (!content.includes(section)) {
      results.push({
        passed: false,
        message: `Missing section: ${section}`,
        severity: "warning",
      });
    }
  });

  if (results.length === 0) {
    results.push({
      passed: true,
      message: "Documentation validation passed",
      severity: "info",
    });
  }

  return results;
}

async function validateExample(examplePath: string): Promise<ExampleValidation> {
  const exampleName = path.basename(examplePath);
  const results: ValidationResult[] = [];

  console.log(`\n📋 Validating: ${exampleName}`);

  // Validate contract
  const contractPath = path.join(examplePath, "contracts");
  if (fs.existsSync(contractPath)) {
    const contracts = fs.readdirSync(contractPath).filter((f) => f.endsWith(".sol"));
    contracts.forEach((contract) => {
      console.log(`   Checking contract: ${contract}`);
      const contractResults = validateContract(path.join(contractPath, contract));
      results.push(...contractResults);
    });
  }

  // Validate tests
  const testPath = path.join(examplePath, "test");
  if (fs.existsSync(testPath)) {
    const tests = fs.readdirSync(testPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
    tests.forEach((test) => {
      console.log(`   Checking test: ${test}`);
      const testResults = validateTest(path.join(testPath, test));
      results.push(...testResults);
    });
  }

  // Validate README
  const readmePath = path.join(examplePath, "README.md");
  console.log(`   Checking documentation...`);
  results.push(...validateDocumentation(readmePath));

  // Check package.json
  const packageJsonPath = path.join(examplePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    results.push({
      passed: false,
      message: "Missing package.json",
      severity: "error",
    });
  }

  return {
    name: exampleName,
    results,
  };
}

async function main(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║           FHEVM Example Validation Tool                ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const validations: ExampleValidation[] = [];

  // Validate main project
  console.log("🎯 Validating main project...");
  const mainValidation = await validateExample(process.cwd());
  validations.push(mainValidation);

  // Print results
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║               VALIDATION RESULTS                        ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  let totalErrors = 0;
  let totalWarnings = 0;

  validations.forEach((validation) => {
    console.log(`\n📦 ${validation.name}:`);

    const errors = validation.results.filter((r) => r.severity === "error");
    const warnings = validation.results.filter((r) => r.severity === "warning");
    const infos = validation.results.filter((r) => r.severity === "info");

    if (errors.length > 0) {
      console.log(`   ❌ Errors: ${errors.length}`);
      errors.forEach((e) => console.log(`      - ${e.message}`));
      totalErrors += errors.length;
    }

    if (warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${warnings.length}`);
      warnings.forEach((w) => console.log(`      - ${w.message}`));
      totalWarnings += warnings.length;
    }

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`   ✅ All checks passed!`);
    }
  });

  console.log("\n📊 Summary:");
  console.log(`   Examples validated: ${validations.length}`);
  console.log(`   Total errors: ${totalErrors}`);
  console.log(`   Total warnings: ${totalWarnings}`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log("\n🎉 All examples validated successfully!");
  } else {
    console.log("\n💡 Please address the issues above.");
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("\n❌ Validation error:");
  console.error(error);
  process.exit(1);
});
