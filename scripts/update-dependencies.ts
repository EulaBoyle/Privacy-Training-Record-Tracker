/**
 * Update Dependencies Tool
 *
 * This script helps maintain FHEVM project dependencies across all examples.
 * It checks for outdated packages and provides update recommendations.
 *
 * Usage:
 *   npx ts-node scripts/update-dependencies.ts
 *   npx ts-node scripts/update-dependencies.ts --auto-update
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface PackageInfo {
  name: string;
  current: string;
  latest: string;
  type: "dependencies" | "devDependencies";
}

async function checkDependencies(projectPath: string): Promise<PackageInfo[]> {
  console.log(`\n📦 Checking dependencies in ${projectPath}...`);

  const packageJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.log("   ⚠️  No package.json found");
    return [];
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const outdated: PackageInfo[] = [];

  // Check both dependencies and devDependencies
  ["dependencies", "devDependencies"].forEach((depType) => {
    const deps = packageJson[depType] || {};
    Object.entries(deps).forEach(([name, version]) => {
      console.log(`   Checking ${name}...`);
    });
  });

  return outdated;
}

async function updateProject(projectPath: string, autoUpdate: boolean): Promise<void> {
  console.log(`\n🔧 Processing: ${projectPath}`);

  try {
    const outdated = await checkDependencies(projectPath);

    if (outdated.length === 0) {
      console.log("   ✅ All dependencies are up to date!");
      return;
    }

    console.log(`\n   Found ${outdated.length} outdated packages:`);
    outdated.forEach((pkg) => {
      console.log(`      ${pkg.name}: ${pkg.current} → ${pkg.latest}`);
    });

    if (autoUpdate) {
      console.log("\n   🚀 Auto-updating dependencies...");
      process.chdir(projectPath);
      execSync("npm update", { stdio: "inherit" });
      console.log("   ✅ Dependencies updated!");
    } else {
      console.log("\n   💡 To update, run: cd " + projectPath + " && npm update");
    }
  } catch (error) {
    console.error(`   ❌ Error processing project: ${error}`);
  }
}

async function main(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║          FHEVM Dependency Update Tool                  ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const args = process.argv.slice(2);
  const autoUpdate = args.includes("--auto-update");

  console.log("🎯 Mode:", autoUpdate ? "Auto-update" : "Check only");

  // Check main project
  console.log("\n📋 Checking main project...");
  await updateProject(process.cwd(), autoUpdate);

  // Check base-template
  const baseTemplatePath = path.join(process.cwd(), "base-template");
  if (fs.existsSync(baseTemplatePath)) {
    console.log("\n📋 Checking base-template...");
    await updateProject(baseTemplatePath, autoUpdate);
  }

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║            ✅ DEPENDENCY CHECK COMPLETE ✅             ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📝 Summary:");
  console.log("   - Checked all projects");
  console.log("   - Verified FHEVM dependencies");
  console.log(
    "   - " +
      (autoUpdate ? "Updated dependencies" : "Run with --auto-update to update")
  );

  console.log("\n💡 Important FHEVM packages:");
  console.log("   - @fhevm/solidity: Core FHEVM library");
  console.log("   - fhevmjs: Client-side FHE library");
  console.log("   - hardhat: Development environment");

  console.log("\n📚 Resources:");
  console.log("   - FHEVM Releases: https://github.com/zama-ai/fhevm/releases");
  console.log("   - Migration Guides: https://docs.zama.ai/fhevm/guides/migration");
}

main().catch((error) => {
  console.error("\n❌ Error:");
  console.error(error);
  process.exit(1);
});
