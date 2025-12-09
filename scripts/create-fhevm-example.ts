/**
 * Create FHEVM Example Generator
 *
 * This script creates a new FHEVM example project from the Privacy Training Record template.
 *
 * Usage:
 *   npx ts-node scripts/create-fhevm-example.ts
 *   npx ts-node scripts/create-fhevm-example.ts --name my-fhevm-project
 *   npx ts-node scripts/create-fhevm-example.ts --name my-project --description "My example"
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

interface ExampleConfig {
  name: string;
  title: string;
  description: string;
  category: string;
  author: string;
}

const categories = [
  "basic",
  "encryption",
  "access-control",
  "relayer",
  "anti-patterns",
  "advanced",
];

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

async function createExample(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║          Create FHEVM Example - Interactive Setup      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Get configuration from user
  const name = await promptUser("📝 Project name (kebab-case): ", "my-fhevm-example");
  const title = await promptUser("✏️  Project title: ", name);
  const description = await promptUser(
    "📝 Project description: ",
    "FHEVM example demonstrating privacy-preserving features"
  );

  console.log("\n📚 Available categories:");
  categories.forEach((cat, i) => console.log(`   ${i + 1}. ${cat}`));

  const categoryIndex = parseInt(
    await promptUser("🏷️  Select category (1-6): ", "1")
  );
  const category = categories[Math.min(categoryIndex - 1, categories.length - 1)];

  const author = await promptUser("👤 Author name: ", "Privacy Team");

  // Create configuration object
  const config: ExampleConfig = {
    name: name.toLowerCase(),
    title,
    description,
    category,
    author,
  };

  // Create project directory
  const projectPath = path.join(process.cwd(), config.name);

  if (fs.existsSync(projectPath)) {
    console.error(`\n❌ Directory ${config.name} already exists!`);
    process.exit(1);
  }

  console.log(`\n🚀 Creating project in ${projectPath}...\n`);

  // Create directory structure
  const dirs = [
    projectPath,
    path.join(projectPath, "contracts"),
    path.join(projectPath, "test"),
    path.join(projectPath, "scripts"),
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${path.relative(process.cwd(), dir)}`);
    }
  });

  // Create package.json
  const packageJson = {
    name: config.name,
    version: "1.0.0",
    description: config.description,
    scripts: {
      compile: "hardhat compile",
      test: "hardhat test",
      deploy: "hardhat run scripts/deploy.js --network zamaTestnet",
      clean: "hardhat clean",
    },
    devDependencies: {
      "@nomicfoundation/hardhat-toolbox": "^4.0.0",
      hardhat: "^2.19.5",
      ethers: "^6.10.0",
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

  // Create hardhat.config.ts
  const hardhatConfig = `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

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

  // Create example contract
  const exampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ${config.title}
 * @notice FHEVM Example - ${config.description}
 * @dev Category: ${config.category}
 */
contract Example is SepoliaConfig {
    // Add your contract implementation here
}
`;

  fs.writeFileSync(path.join(projectPath, "contracts", "Example.sol"), exampleContract);
  console.log(`✓ Created Example.sol contract`);

  // Create test file
  const testFile = `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Example FHEVM Test", function () {
  let contract;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const Example = await ethers.getContractFactory("Example");
    contract = await Example.deploy();
    await contract.deployed();
  });

  it("Should deploy successfully", async function () {
    expect(contract.address).to.be.properAddress;
  });
});
`;

  fs.writeFileSync(path.join(projectPath, "test", "Example.test.js"), testFile);
  console.log(`✓ Created test file`);

  // Create README
  const readme = `# ${config.title}

${config.description}

## Overview

This is a standalone FHEVM example demonstrating privacy-preserving features on blockchain.

- **Category**: ${config.category}
- **Author**: ${config.author}
- **Status**: Ready for development

## Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn

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
npm run deploy
\`\`\`

## FHEVM Concepts

This example demonstrates:
- Encrypted data storage
- Access control with FHE
- Privacy-preserving computations

## License

MIT

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Community](https://community.zama.ai/)
- [Discord](https://discord.gg/zama)
`;

  fs.writeFileSync(path.join(projectPath, "README.md"), readme);
  console.log(`✓ Created README.md`);

  // Create deployment config
  const deploymentConfig = {
    name: config.name,
    title: config.title,
    category: config.category,
    version: "1.0.0",
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(projectPath, "example.config.json"),
    JSON.stringify(deploymentConfig, null, 2)
  );
  console.log(`✓ Created example.config.json`);

  // Print summary
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║          ✅ PROJECT CREATED SUCCESSFULLY ✅             ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log("📌 Project Details:");
  console.log(`   Name: ${config.name}`);
  console.log(`   Title: ${config.title}`);
  console.log(`   Category: ${config.category}`);
  console.log(`   Location: ${projectPath}\n`);

  console.log("📝 Next Steps:");
  console.log(`   1. cd ${config.name}`);
  console.log(`   2. npm install`);
  console.log(`   3. Update contracts/Example.sol`);
  console.log(`   4. npm test`);
  console.log(`   5. npm run deploy\n`);

  console.log("💡 Tips:");
  console.log("   - Review FHEVM documentation for patterns");
  console.log("   - Use test files to verify functionality");
  console.log("   - Follow Privacy Training Record example");
  console.log("   - Document your FHEVM concepts\n");
}

// Run the script
createExample().catch((error) => {
  console.error("\n❌ Error creating example:");
  console.error(error);
  process.exit(1);
});
