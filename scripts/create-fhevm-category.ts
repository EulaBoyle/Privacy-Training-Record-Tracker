/**
 * Create FHEVM Category Project Generator
 *
 * This script creates a project with multiple FHEVM examples from a specific category.
 * Unlike create-fhevm-example.ts which creates single examples, this creates category-based projects.
 *
 * Usage:
 *   npx ts-node scripts/create-fhevm-category.ts
 *   npx ts-node scripts/create-fhevm-category.ts --category basic --output ./output
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

interface CategoryConfig {
  name: string;
  title: string;
  description: string;
  examples: string[];
  outputPath: string;
}

const CATEGORIES = {
  basic: {
    title: "Basic FHEVM Examples",
    description: "Fundamental FHEVM concepts and operations",
    examples: [
      "FHECounter",
      "EncryptedBoolean",
      "SimpleArithmetic",
    ],
  },
  encryption: {
    title: "Encryption Examples",
    description: "Advanced encryption patterns and techniques",
    examples: [
      "EncryptedStorage",
      "MultiValueEncryption",
      "TypeConversion",
    ],
  },
  "access-control": {
    title: "Access Control Examples",
    description: "Permission management and access patterns",
    examples: [
      "RoleBasedAccess",
      "SelectiveDisclosure",
      "PermissionDelegation",
    ],
  },
  advanced: {
    title: "Advanced Examples",
    description: "Complex FHEVM patterns and use cases",
    examples: [
      "PrivacyTrainingRecord",
      "ConfidentialVoting",
      "BlindAuction",
    ],
  },
};

async function promptUser(question: string, defaultValue: string = ""): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer || defaultValue);
    });
  });
}

async function createCategoryProject(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║    Create FHEVM Category Project - Interactive Setup   ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Display available categories
  console.log("📚 Available categories:");
  Object.entries(CATEGORIES).forEach(([key, value], index) => {
    console.log(`   ${index + 1}. ${key} - ${value.title}`);
    console.log(`      ${value.description}`);
    console.log(`      Examples: ${value.examples.length} contracts\n`);
  });

  const categoryKeys = Object.keys(CATEGORIES);
  const categoryIndex = parseInt(
    await promptUser(`🏷️  Select category (1-${categoryKeys.length}): `, "1")
  );
  const categoryKey = categoryKeys[Math.min(categoryIndex - 1, categoryKeys.length - 1)];
  const category = CATEGORIES[categoryKey as keyof typeof CATEGORIES];

  const projectName = await promptUser(
    "📝 Project name: ",
    `${categoryKey}-examples`
  );

  const outputPath = await promptUser(
    "📁 Output directory: ",
    `./${projectName}`
  );

  const config: CategoryConfig = {
    name: categoryKey,
    title: category.title,
    description: category.description,
    examples: category.examples,
    outputPath,
  };

  console.log(`\n🚀 Creating category project: ${config.title}\n`);

  // Create project directory structure
  const projectPath = path.resolve(outputPath);
  if (fs.existsSync(projectPath)) {
    console.error(`\n❌ Directory ${projectPath} already exists!`);
    process.exit(1);
  }

  const dirs = [
    projectPath,
    path.join(projectPath, "contracts"),
    path.join(projectPath, "test"),
    path.join(projectPath, "scripts"),
    path.join(projectPath, "docs"),
  ];

  dirs.forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✓ Created directory: ${path.relative(process.cwd(), dir)}`);
  });

  // Create package.json
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    description: config.description,
    scripts: {
      compile: "hardhat compile",
      test: "hardhat test",
      deploy: "hardhat run scripts/deploy.js --network zamaTestnet",
      clean: "hardhat clean",
      lint: "solhint 'contracts/**/*.sol'",
    },
    keywords: ["fhevm", "privacy", "encryption", config.name],
    license: "MIT",
    devDependencies: {
      "@nomicfoundation/hardhat-toolbox": "^4.0.0",
      hardhat: "^2.19.5",
      ethers: "^6.10.0",
      chai: "^4.3.10",
    },
    dependencies: {
      "@fhevm/solidity": "^0.1.0",
      fhevmjs: "^0.3.1",
    },
  };

  fs.writeFileSync(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
  console.log(`✓ Created package.json`);

  // Copy hardhat.config.ts from base-template
  const hardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    zamaTestnet: {
      url: process.env.ZAMA_RPC_URL || "https://sepolia.zama.ai/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 9000,
    },
  },
};

export default config;
`;

  fs.writeFileSync(path.join(projectPath, "hardhat.config.ts"), hardhatConfig);
  console.log(`✓ Created hardhat.config.ts`);

  // Create README
  const readme = `# ${config.title}

${config.description}

## Overview

This project contains ${config.examples.length} FHEVM examples from the ${config.name} category:

${config.examples.map((ex, i) => `${i + 1}. **${ex}** - Demonstrates key FHEVM patterns`).join("\n")}

## Quick Start

### Installation
\`\`\`bash
npm install
\`\`\`

### Compilation
\`\`\`bash
npm run compile
\`\`\`

### Testing
\`\`\`bash
npm test
\`\`\`

### Deployment
\`\`\`bash
# Configure .env first
npm run deploy
\`\`\`

## Examples Included

${config.examples.map((ex) => `### ${ex}\nSee \`contracts/${ex}.sol\` and \`test/${ex}.test.js\`\n`).join("\n")}

## Category: ${config.name}

This category focuses on: ${config.description}

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Main Project](../)
- [Developer Guide](../DEVELOPER_GUIDE.md)

## License

MIT
`;

  fs.writeFileSync(path.join(projectPath, "README.md"), readme);
  console.log(`✓ Created README.md`);

  // Create placeholder contracts and tests
  config.examples.forEach((exampleName) => {
    const contractContent = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ${exampleName}
 * @notice ${config.description}
 * @dev Category: ${config.name}
 */
contract ${exampleName} is SepoliaConfig {
    // TODO: Implement ${exampleName}
}
`;

    const testContent = `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("${exampleName}", function () {
  it("Should deploy successfully", async function () {
    const Contract = await ethers.getContractFactory("${exampleName}");
    const contract = await Contract.deploy();
    await contract.waitForDeployment();
    expect(await contract.getAddress()).to.be.properAddress;
  });
});
`;

    fs.writeFileSync(
      path.join(projectPath, "contracts", `${exampleName}.sol`),
      contractContent
    );
    fs.writeFileSync(
      path.join(projectPath, "test", `${exampleName}.test.js`),
      testContent
    );
    console.log(`✓ Created ${exampleName} contract and test`);
  });

  // Create deployment script
  const deployScript = `const hre = require("hardhat");

async function main() {
  console.log("Deploying ${config.title}...");

  const contracts = ${JSON.stringify(config.examples)};

  for (const contractName of contracts) {
    console.log(\`\\nDeploying \${contractName}...\`);
    const Contract = await hre.ethers.getContractFactory(contractName);
    const contract = await Contract.deploy();
    await contract.waitForDeployment();
    console.log(\`\${contractName} deployed to: \${await contract.getAddress()}\`);
  }

  console.log("\\nAll contracts deployed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
`;

  fs.writeFileSync(path.join(projectPath, "scripts", "deploy.js"), deployScript);
  console.log(`✓ Created deployment script`);

  // Create .env.example
  const envExample = `# FHEVM Category Project - Environment Configuration
PRIVATE_KEY=your_private_key_here
ZAMA_RPC_URL=https://sepolia.zama.ai/
`;

  fs.writeFileSync(path.join(projectPath, ".env.example"), envExample);
  console.log(`✓ Created .env.example`);

  // Print summary
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║        ✅ CATEGORY PROJECT CREATED SUCCESSFULLY ✅      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📌 Project Details:");
  console.log(`   Category: ${config.name}`);
  console.log(`   Title: ${config.title}`);
  console.log(`   Examples: ${config.examples.length} contracts`);
  console.log(`   Location: ${projectPath}\n`);

  console.log("📝 Next Steps:");
  console.log(`   1. cd ${projectName}`);
  console.log(`   2. npm install`);
  console.log(`   3. Implement contracts in contracts/`);
  console.log(`   4. Add tests in test/`);
  console.log(`   5. npm run compile`);
  console.log(`   6. npm test\n`);

  console.log("📋 Contracts to implement:");
  config.examples.forEach((ex, i) => {
    console.log(`   ${i + 1}. ${ex}`);
  });
  console.log();
}

// Run the script
createCategoryProject().catch((error) => {
  console.error("\n❌ Error creating category project:");
  console.error(error);
  process.exit(1);
});
