# Maintenance Guide

This guide helps maintainers keep the Privacy Training Record project up-to-date and healthy.

## Regular Maintenance Tasks

### Weekly Tasks

#### 1. Check Dependencies
```bash
# Check for outdated packages
npm outdated

# Or use the maintenance tool
npm run update-deps
```

#### 2. Run Tests
```bash
# Run full test suite
npm test

# Run with coverage
npm run test:coverage
```

#### 3. Validate Examples
```bash
# Validate all examples
npm run validate
```

### Monthly Tasks

#### 1. Update FHEVM Dependencies

Check for @fhevm/solidity updates:
```bash
npm info @fhevm/solidity version
```

If new version available:
```bash
# Update main project
npm install @fhevm/solidity@latest

# Update base-template
cd base-template
npm install @fhevm/solidity@latest
cd ..

# Test everything
npm run compile
npm test
```

#### 2. Review Documentation

- Check for broken links
- Update version numbers
- Verify examples still work
- Update screenshots if UI changed

#### 3. Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Review and fix manually if needed
```

### Quarterly Tasks

#### 1. Dependency Major Updates

Review and plan major version updates:
- Hardhat
- Ethers.js
- TypeScript
- Testing libraries

Test thoroughly in a branch before merging.

#### 2. Contract Optimization

Review contracts for:
- Gas optimization opportunities
- Security improvements
- Code clarity
- Best practice updates

#### 3. Documentation Refresh

- Review all tutorials
- Update for new FHEVM features
- Add new examples if patterns emerged
- Improve clarity based on user feedback

## Updating for New FHEVM Versions

### Breaking Changes

When @fhevm/solidity has breaking changes:

1. **Read Changelog**
   - Check GitHub releases
   - Review migration guide
   - Note API changes

2. **Update Imports**
   ```solidity
   // Old
   import { FHE } from "@fhevm/solidity/lib/FHE.sol";

   // New (if changed)
   import { FHE } from "@fhevm/solidity/lib/FHEVM.sol";
   ```

3. **Update Contracts**
   - Fix deprecated functions
   - Adopt new patterns
   - Update permission calls if changed

4. **Update Tests**
   - Fix test setup if changed
   - Update assertions
   - Add tests for new features

5. **Update Documentation**
   - API reference
   - Examples
   - Tutorials
   - Best practices

### Non-Breaking Updates

For minor/patch updates:

1. **Update Dependencies**
   ```bash
   npm update @fhevm/solidity
   ```

2. **Verify Tests Pass**
   ```bash
   npm test
   ```

3. **Update Version in Docs**
   - README.md
   - package.json
   - Documentation references

## Handling Issues

### Bug Reports

1. **Triage**
   - Verify the issue
   - Reproduce if possible
   - Label appropriately

2. **Fix Priority**
   - **Critical**: Security issues, broken core features
   - **High**: Breaking bugs, major functionality
   - **Medium**: Minor bugs, edge cases
   - **Low**: Nice-to-have improvements

3. **Fix Process**
   - Create branch for fix
   - Write failing test first
   - Implement fix
   - Verify test passes
   - Update documentation if needed
   - Submit PR with clear description

### Feature Requests

1. **Evaluate**
   - Does it fit project scope?
   - Would it benefit users?
   - Is it maintainable?

2. **Discuss**
   - Request community feedback
   - Consider alternatives
   - Plan implementation

3. **Implement**
   - Design carefully
   - Write tests first
   - Document thoroughly
   - Update examples if relevant

## Code Quality Maintenance

### Linting

```bash
# Lint Solidity
npm run lint

# Auto-fix if possible
npm run lint -- --fix

# Format code
npm run format
```

### Test Coverage

Maintain >95% coverage:
```bash
npm run test:coverage
```

If coverage drops:
1. Identify uncovered code
2. Add tests for uncovered paths
3. Consider if code is needed

### Code Review Checklist

When reviewing PRs:

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No security issues
- [ ] Follows code style
- [ ] Gas-efficient
- [ ] Proper FHE patterns
- [ ] No breaking changes (or documented)
- [ ] Examples still work

## Automation Tool Maintenance

### create-fhevm-example.ts

When updating:
1. Test interactive mode
2. Test all parameter combinations
3. Verify generated projects compile
4. Verify generated projects pass tests

### create-fhevm-category.ts

When updating:
1. Test all categories
2. Verify multi-contract generation
3. Check deployment script generation
4. Verify documentation generation

### generate-docs.ts

When updating:
1. Test with all contract types
2. Verify markdown formatting
3. Check GitBook compatibility
4. Verify links work

### update-dependencies.ts

When updating:
1. Test dependency checking
2. Test auto-update mode
3. Verify error handling
4. Check reporting accuracy

### validate-examples.ts

When updating:
1. Add new validation rules
2. Update for FHEVM changes
3. Test error reporting
4. Verify exit codes

## Documentation Maintenance

### Keeping Docs Updated

1. **After Code Changes**
   - Update affected documentation
   - Regenerate API docs if needed
   - Update examples

2. **After FHEVM Updates**
   - Review all documentation
   - Update version references
   - Update code examples
   - Regenerate docs

3. **Regular Reviews**
   - Check for typos
   - Verify links work
   - Update screenshots
   - Improve clarity

### Documentation Standards

- Use clear, simple language
- Include code examples
- Show both correct and incorrect patterns
- Keep examples minimal and focused
- Test all code snippets

## Version Management

### Semantic Versioning

Follow semver (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Process

1. **Prepare Release**
   - Update version in package.json
   - Update CHANGELOG.md
   - Review all changes
   - Run full test suite

2. **Create Release**
   - Tag commit: `git tag v1.2.3`
   - Push tag: `git push origin v1.2.3`
   - Create GitHub release
   - Add release notes

3. **Post-Release**
   - Announce on Discord/Forum
   - Update documentation site
   - Monitor for issues

## Backup and Recovery

### What to Backup

- Contract code (Git)
- Tests (Git)
- Documentation (Git)
- Configuration files (Git)
- Deployment addresses
- Environment configs

### Git Best Practices

```bash
# Never commit these
.env
.env.local
.env.*.local
deployment-private.json
private-keys

# Always commit these
contracts/
test/
scripts/
docs/
README.md
package.json
hardhat.config.ts
```

## Monitoring

### Key Metrics

Track:
- Test pass rate
- Code coverage
- Deployment success rate
- Gas costs (trend over time)
- Issue resolution time

### Health Checks

Weekly:
```bash
# All tests pass
npm test

# No critical vulnerabilities
npm audit

# All examples valid
npm run validate

# Dependencies up-to-date
npm outdated
```

## Getting Help

If you need help with maintenance:

1. **Documentation**
   - Read DEVELOPER_GUIDE.md
   - Check FHEVM docs
   - Review GitHub issues

2. **Community**
   - Ask on Zama Discord
   - Post on Community Forum
   - Check GitHub Discussions

3. **Support**
   - Open GitHub issue
   - Tag maintainers
   - Provide details and context

## Maintenance Tools Reference

### Available Scripts

```bash
# Development
npm run compile          # Compile contracts
npm test                 # Run all tests
npm run test:coverage    # Test with coverage
npm run gas-report       # Gas usage report

# Code Quality
npm run lint             # Lint Solidity
npm run format           # Format code
npm run validate         # Validate examples

# Maintenance
npm run update-deps      # Check dependencies
npm run update-deps:auto # Auto-update
npm run clean            # Clean artifacts

# Generation
npm run create-example   # Create example
npm run create-category  # Create category
npm run generate-docs    # Generate docs
```

### Tool Maintenance

Each tool should be reviewed quarterly:
- Still meeting needs?
- Performance acceptable?
- Error handling adequate?
- Documentation clear?

## Contributor Guidelines

When maintaining for contributions:

1. **Welcome Contributors**
   - Be friendly and helpful
   - Review PRs promptly
   - Provide constructive feedback

2. **Guide New Contributors**
   - Point to CONTRIBUTING.md
   - Suggest good first issues
   - Help with setup

3. **Maintain Standards**
   - Enforce code quality
   - Require tests
   - Request documentation
   - Check security

## Emergency Procedures

### Security Vulnerability

1. **Do NOT** create public issue
2. Contact maintainers privately
3. Assess severity
4. Develop fix quickly
5. Test thoroughly
6. Deploy fix
7. Announce with details

### Critical Bug

1. **Assess Impact**
   - How many users affected?
   - Data loss risk?
   - Security implications?

2. **Immediate Action**
   - Hot fix if needed
   - Communicate issue
   - Deploy fix ASAP

3. **Post-Mortem**
   - Document what happened
   - How to prevent
   - Update tests
   - Improve monitoring

## Long-term Roadmap

Maintain a roadmap for:
- Upcoming FHEVM features
- Planned improvements
- Deprecation timeline
- New examples to add
- Documentation expansions

Review and update quarterly.

---

**Questions about maintenance?** Open an issue or ask in Discord!

**Last Updated**: December 2025
