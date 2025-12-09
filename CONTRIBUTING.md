# Contributing to Privacy Training Record

First off, thank you for considering contributing to the Privacy Training Record! It's people like you that make this example such a great resource for the FHEVM community.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem** in as many details as possible
* **Provide specific examples to demonstrate the steps.** Include links to files or GitHub projects, or copy/pasteable snippets, which you use in those examples
* **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**
* **Include your environment details**: Node.js version, npm version, OS, etc.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement** in as many details as possible
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior** and **explain the expected behavior**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Follow the styleguides
* Include appropriate test cases
* Document new code
* End all files with a newline
* Ensure all tests pass before submitting

## Styleguides

### Solidity Code Style

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Use clear naming conventions
contract ExampleContract {
    // Constants in UPPER_SNAKE_CASE
    uint256 public constant MAX_RECORDS = 1000;

    // State variables in camelCase
    mapping(address => bool) public authorizedUsers;

    // Events use PascalCase
    event ActionPerformed(address indexed user, uint256 indexed id);

    // Modifiers in camelCase
    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender], "Not authorized");
        _;
    }

    // Functions in camelCase
    function doSomething() external onlyAuthorized {
        // Implementation
    }

    /// @notice Clear documentation
    /// @param _parameter Description
    /// @return Description of return value
    function namedFunction(uint256 _parameter) external pure returns (bool) {
        // Implementation
    }
}
```

**Rules:**
- Indent using 4 spaces (not tabs)
- Use comments sparingly and only when needed
- Write clear function names that explain intent
- Always include NatSpec documentation for public functions
- Use meaningful variable names

### TypeScript/JavaScript Style

```typescript
// Use async/await instead of promises
async function deployContract(): Promise<void> {
    const contract = await ethers.getContractFactory("ContractName");
    const instance = await contract.deploy();
    await instance.deployed();
}

// Use destructuring
const { address, abi } = contractData;

// Use template literals
const message = `Deployed to ${address}`;

// Use const/let, avoid var
const CONSTANT = "value";
let variable = "value";

// Arrow functions for callbacks
array.map((item) => item.value);

// Clear error handling
try {
    await transaction.wait();
} catch (error) {
    console.error("Deployment failed:", error);
    throw error;
}
```

**Rules:**
- Indent using 2 spaces for TypeScript/JavaScript
- Use const by default, let when needed
- Use async/await (not promises)
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Test Style

```javascript
describe("Feature Name", function () {
    let contract;
    let owner, user;

    beforeEach(async function () {
        // Setup before each test
        [owner, user] = await ethers.getSigners();
        const Contract = await ethers.getContractFactory("ContractName");
        contract = await Contract.deploy();
        await contract.deployed();
    });

    describe("Sub-feature", function () {
        it("Should perform expected behavior", async function () {
            // Arrange
            const value = 42;

            // Act
            const result = await contract.someFunction(value);

            // Assert
            expect(result).to.equal(expected);
        });

        it("Should revert on invalid input", async function () {
            await expect(
                contract.restrictedFunction()
            ).to.be.revertedWith("Error message");
        });
    });
});
```

**Rules:**
- Use `describe` blocks to organize tests
- Use clear test names describing the expected behavior
- Structure tests with Arrange-Act-Assert pattern
- Test both success and failure cases
- Use `beforeEach` for setup to avoid duplication

### Markdown/Documentation Style

```markdown
# Main Title

Clear introductory paragraph explaining the purpose.

## Section Heading

### Subsection

Use **bold** for emphasis, *italic* for slight emphasis.

- Use bullet points for lists
- Keep lines under 80 characters when possible
- Use code blocks for examples:

\`\`\`solidity
// Solidity example
\`\`\`

\`\`\`javascript
// JavaScript example
\`\`\`
```

**Rules:**
- Use clear, descriptive headings
- Keep paragraphs short and focused
- Use code blocks with language tags
- Include examples where helpful
- Maintain consistent formatting

## Development Workflow

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/PrivacyTrainingRecord.git`
3. Add upstream remote: `git remote add upstream https://github.com/original/PrivacyTrainingRecord.git`
4. Create feature branch: `git checkout -b feature/your-feature`

### Making Changes

1. Make your changes following the styleguides
2. Test your changes: `npm test`
3. Format your code: `npm run format`
4. Lint your code: `npm run lint`
5. Ensure all tests pass: `npm test`

### Committing Changes

* Use clear and descriptive commit messages
* Use imperative mood ("Add feature" not "Added feature")
* Reference issues when appropriate: "Fix #123"
* Keep commits focused on single changes

Example:
```
Add encrypted field to training record

- Add euint32 for encrypted score
- Update getters with access control
- Add tests for encrypted score storage
- Update documentation

Fixes #456
```

### Submitting Pull Requests

1. Update your branch: `git pull upstream main`
2. Push your changes: `git push origin feature/your-feature`
3. Create Pull Request on GitHub
4. Fill out the PR template completely
5. Link related issues
6. Wait for review and address feedback

## Review Process

### What We Look For

✅ **Code Quality**
- Follows styleguides
- Clear and well-documented
- No redundant code
- Proper error handling

✅ **Testing**
- All tests pass
- New tests for new features
- >95% coverage maintained
- Edge cases covered

✅ **FHEVM Patterns**
- Correct use of encrypted data types
- Proper permission management
- Access control implemented correctly
- Best practices followed

✅ **Documentation**
- Code is well-commented
- User-facing features documented
- API documented with NatSpec
- Examples provided if applicable

### Response Time

We aim to review pull requests within 48 hours. If your PR hasn't been reviewed within a week, please leave a comment to bump it.

### Feedback and Revisions

* We may request changes to your code
* Be open to feedback and questions
* Discuss disagreements respectfully
* Update your PR based on feedback

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Project README
- Release notes

## Questions?

* Check existing documentation
* Ask in GitHub Discussions
* Join our Discord: https://discord.gg/zama
* Email: contact@zama.ai

## License

By contributing to this project, you agree that your contributions will be licensed under its MIT License.

---

Thank you for contributing to Privacy Training Record! 🚀
