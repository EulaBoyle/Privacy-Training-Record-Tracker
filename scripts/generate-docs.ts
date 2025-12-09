/**
 * Documentation Generator for FHEVM Examples
 *
 * This script generates Markdown documentation from contract code and comments.
 *
 * Usage:
 *   npx ts-node scripts/generate-docs.ts
 *   npx ts-node scripts/generate-docs.ts --output docs/
 */

import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

interface ContractInfo {
  name: string;
  file: string;
  title: string;
  notice: string;
  functions: FunctionInfo[];
  events: EventInfo[];
}

interface FunctionInfo {
  name: string;
  visibility: string;
  inputs: string[];
  outputs: string[];
  description: string;
}

interface EventInfo {
  name: string;
  parameters: string[];
  description: string;
}

function extractComments(content: string, pattern: RegExp): string[] {
  const matches = content.match(pattern);
  return matches ? matches : [];
}

function parseContract(filePath: string): ContractInfo {
  const content = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath);

  // Extract contract name
  const contractMatch = content.match(/contract\s+(\w+)/);
  const contractName = contractMatch ? contractMatch[1] : "Unknown";

  // Extract title from @title comment
  const titleMatch = content.match(/@title\s+(.+)/);
  const title = titleMatch ? titleMatch[1] : contractName;

  // Extract notice from @notice comment
  const noticeMatch = content.match(/@notice\s+(.+)/);
  const notice = noticeMatch ? noticeMatch[1] : "";

  // Extract functions
  const functionMatches = content.matchAll(
    /\/\/\/\s*@notice\s+(.+?)(?:\/\/\/[^\n]*)*\s+function\s+(\w+)/gm
  );
  const functions: FunctionInfo[] = [];

  for (const match of functionMatches) {
    const description = match[1];
    const functionName = match[2];

    functions.push({
      name: functionName,
      visibility: "public",
      inputs: [],
      outputs: [],
      description,
    });
  }

  // Extract events
  const eventMatches = content.matchAll(/event\s+(\w+)\s*\((.*?)\)/g);
  const events: EventInfo[] = [];

  for (const match of eventMatches) {
    const eventName = match[1];
    const parameters = match[2].split(",").map((p) => p.trim());

    events.push({
      name: eventName,
      parameters,
      description: "",
    });
  }

  return {
    name: contractName,
    file: fileName,
    title,
    notice,
    functions,
    events,
  };
}

function generateMarkdownDoc(contract: ContractInfo): string {
  let markdown = `# ${contract.title}\n\n`;

  if (contract.notice) {
    markdown += `> ${contract.notice}\n\n`;
  }

  markdown += `**File**: \`${contract.file}\`\n\n`;

  // Functions section
  if (contract.functions.length > 0) {
    markdown += `## Functions\n\n`;

    for (const func of contract.functions) {
      markdown += `### \`${func.name}()\`\n\n`;
      markdown += `${func.description}\n\n`;

      if (func.inputs.length > 0) {
        markdown += `**Parameters**:\n`;
        func.inputs.forEach((input) => {
          markdown += `- \`${input}\`\n`;
        });
        markdown += "\n";
      }

      if (func.outputs.length > 0) {
        markdown += `**Returns**:\n`;
        func.outputs.forEach((output) => {
          markdown += `- \`${output}\`\n`;
        });
        markdown += "\n";
      }
    }
  }

  // Events section
  if (contract.events.length > 0) {
    markdown += `## Events\n\n`;

    for (const event of contract.events) {
      markdown += `### \`${event.name}\`\n\n`;

      if (event.parameters.length > 0) {
        markdown += `**Parameters**:\n`;
        event.parameters.forEach((param) => {
          markdown += `- \`${param}\`\n`;
        });
        markdown += "\n";
      }
    }
  }

  return markdown;
}

function generateCategoryDocs(outputDir: string): void {
  const categories = [
    {
      name: "Basic",
      id: "basic",
      description: "Fundamental FHEVM concepts and operations",
      examples: [
        "Creating encrypted values",
        "Basic access control",
        "Encrypted storage",
      ],
    },
    {
      name: "Encryption",
      id: "encryption",
      description: "Advanced encryption patterns and techniques",
      examples: [
        "Encrypted arithmetic",
        "Conditional encryption",
        "Multi-value encryption",
      ],
    },
    {
      name: "Access Control",
      id: "access-control",
      description: "Permission management and access patterns",
      examples: [
        "Role-based access control",
        "Selective disclosure",
        "Permission delegation",
      ],
    },
    {
      name: "Relayer",
      id: "relayer",
      description: "Relayer patterns and meta-transactions",
      examples: [
        "Encrypted relayer",
        "Meta-transaction patterns",
        "Fee handling",
      ],
    },
    {
      name: "Anti-Patterns",
      id: "anti-patterns",
      description: "Common mistakes and how to avoid them",
      examples: [
        "Missing FHE.allow()",
        "Improper permission management",
        "Visibility violations",
      ],
    },
  ];

  let indexMarkdown = `# FHEVM Examples Documentation\n\n`;
  indexMarkdown += `Complete guide to FHEVM implementation patterns and best practices.\n\n`;

  indexMarkdown += `## Categories\n\n`;

  for (const category of categories) {
    indexMarkdown += `### ${category.name}\n\n`;
    indexMarkdown += `${category.description}\n\n`;

    indexMarkdown += `**Examples**:\n`;
    category.examples.forEach((example) => {
      indexMarkdown += `- ${example}\n`;
    });
    indexMarkdown += "\n";

    // Create category file
    const categoryMarkdown = `# ${category.name} Examples\n\n`;
    const categoryFile = path.join(outputDir, `${category.id}.md`);
    fs.writeFileSync(categoryFile, categoryMarkdown);
    console.log(`✓ Created ${categoryFile}`);
  }

  const indexFile = path.join(outputDir, "README.md");
  fs.writeFileSync(indexFile, indexMarkdown);
  console.log(`✓ Created ${indexFile}`);
}

async function main(): Promise<void> {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║        FHEVM Documentation Generator                   ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const outputDir = path.join(process.cwd(), "docs");

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✓ Created output directory: ${outputDir}\n`);
  }

  // Generate category documentation
  console.log("📚 Generating category documentation...");
  generateCategoryDocs(outputDir);

  // Find and process all contract files
  console.log("\n📝 Processing contract files...");
  const contractFiles = glob.sync("contracts/**/*.sol", {
    ignore: "node_modules/**",
  });

  if (contractFiles.length === 0) {
    console.log("⚠️  No contract files found");
  } else {
    for (const contractFile of contractFiles) {
      try {
        const contract = parseContract(contractFile);
        const markdown = generateMarkdownDoc(contract);

        const outputFile = path.join(
          outputDir,
          `${contract.name}.md`
        );
        fs.writeFileSync(outputFile, markdown);
        console.log(`✓ Generated docs for ${contract.name}`);
      } catch (error) {
        console.error(`✗ Error processing ${contractFile}:`, error);
      }
    }
  }

  // Generate main documentation index
  const mainIndex = `# FHEVM Documentation\n\n`;
  const mainIndexFile = path.join(outputDir, "index.md");
  fs.writeFileSync(mainIndexFile, mainIndex);
  console.log(`✓ Created ${mainIndexFile}`);

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║       ✅ DOCUMENTATION GENERATED SUCCESSFULLY ✅       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  console.log(`📁 Documentation location: ${outputDir}`);
  console.log("\n📖 Generated files:");
  console.log("   - README.md (Category overview)");
  console.log("   - basic.md (Basic concepts)");
  console.log("   - encryption.md (Encryption patterns)");
  console.log("   - access-control.md (Permission patterns)");
  console.log("   - relayer.md (Relayer patterns)");
  console.log("   - anti-patterns.md (Common mistakes)");

  if (contractFiles.length > 0) {
    console.log("\n📋 Contract documentation:");
    for (const file of contractFiles) {
      const contract = parseContract(file);
      console.log(`   - ${contract.name}.md`);
    }
  }

  console.log("\n💡 Tips:");
  console.log("   - Review generated documentation in docs/");
  console.log("   - Update docs/ before publishing");
  console.log("   - Add custom documentation as needed");
  console.log("   - Use GitBook for better formatting\n");
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Error generating documentation:");
  console.error(error);
  process.exit(1);
});
