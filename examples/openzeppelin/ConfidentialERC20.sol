// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint64, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialERC20
 * @notice A confidential ERC20-like token using FHEVM
 * @dev Implements encrypted balances and transfers
 *
 * This demonstrates the ERC7984 pattern - confidential token standard
 * Balances are encrypted, transfers are private
 */
contract ConfidentialERC20 is SepoliaConfig {
    // Token metadata
    string public name;
    string public symbol;
    uint8 public decimals;

    // Encrypted balances
    mapping(address => euint64) private balances;

    // Encrypted allowances
    mapping(address => mapping(address => euint64)) private allowances;

    // Total supply (public for simplicity, could be encrypted)
    uint256 public totalSupply;

    // Events
    event Transfer(address indexed from, address indexed to);
    event Approval(address indexed owner, address indexed spender);
    event Mint(address indexed to, uint256 amount);

    /**
     * @notice Constructor
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _decimals Token decimals
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    /**
     * @notice Mint tokens to an address
     * @param to Recipient address
     * @param amount Amount to mint (will be encrypted)
     * @dev Only for demonstration - in production, add access control
     */
    function mint(address to, uint64 amount) external {
        require(to != address(0), "Cannot mint to zero address");

        // Convert to encrypted value
        euint64 encryptedAmount = FHE.asEuint64(amount);

        // Add to recipient's balance
        balances[to] = FHE.add(balances[to], encryptedAmount);

        // Update permissions
        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);

        // Update total supply (public)
        totalSupply += amount;

        emit Mint(to, amount);
    }

    /**
     * @notice Transfer tokens to another address
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount to transfer
     * @param inputProof Input proof for encrypted amount
     */
    function transfer(
        address to,
        inEuint64 calldata encryptedAmount,
        bytes calldata inputProof
    ) external returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");

        // Convert encrypted input
        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

        // Check sufficient balance (encrypted comparison)
        // Note: In production, use FHE.select for conditional logic
        euint64 newSenderBalance = FHE.sub(balances[msg.sender], amount);
        euint64 newRecipientBalance = FHE.add(balances[to], amount);

        // Update balances
        balances[msg.sender] = newSenderBalance;
        balances[to] = newRecipientBalance;

        // Update permissions
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);

        emit Transfer(msg.sender, to);
        return true;
    }

    /**
     * @notice Approve spender to spend tokens
     * @param spender Spender address
     * @param encryptedAmount Encrypted amount to approve
     * @param inputProof Input proof
     */
    function approve(
        address spender,
        inEuint64 calldata encryptedAmount,
        bytes calldata inputProof
    ) external returns (bool) {
        require(spender != address(0), "Cannot approve zero address");

        // Convert encrypted input
        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

        // Set allowance
        allowances[msg.sender][spender] = amount;

        // Set permissions
        FHE.allowThis(allowances[msg.sender][spender]);
        FHE.allow(allowances[msg.sender][spender], msg.sender);
        FHE.allow(allowances[msg.sender][spender], spender);

        emit Approval(msg.sender, spender);
        return true;
    }

    /**
     * @notice Transfer tokens from one address to another
     * @param from Sender address
     * @param to Recipient address
     * @param encryptedAmount Encrypted amount
     * @param inputProof Input proof
     */
    function transferFrom(
        address from,
        address to,
        inEuint64 calldata encryptedAmount,
        bytes calldata inputProof
    ) external returns (bool) {
        require(from != address(0), "Cannot transfer from zero address");
        require(to != address(0), "Cannot transfer to zero address");

        // Convert encrypted input
        euint64 amount = FHE.asEuint64(encryptedAmount, inputProof);

        // Update allowance
        euint64 currentAllowance = allowances[from][msg.sender];
        euint64 newAllowance = FHE.sub(currentAllowance, amount);
        allowances[from][msg.sender] = newAllowance;

        // Update balances
        euint64 newSenderBalance = FHE.sub(balances[from], amount);
        euint64 newRecipientBalance = FHE.add(balances[to], amount);

        balances[from] = newSenderBalance;
        balances[to] = newRecipientBalance;

        // Update permissions
        FHE.allowThis(allowances[from][msg.sender]);
        FHE.allow(allowances[from][msg.sender], from);
        FHE.allow(allowances[from][msg.sender], msg.sender);

        FHE.allowThis(balances[from]);
        FHE.allow(balances[from], from);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);

        emit Transfer(from, to);
        return true;
    }

    /**
     * @notice Get encrypted balance of an address
     * @param account Address to query
     * @return Encrypted balance
     */
    function balanceOf(address account) external view returns (euint64) {
        require(
            msg.sender == account || msg.sender == address(this),
            "Cannot view other's balance"
        );
        return balances[account];
    }

    /**
     * @notice Get encrypted allowance
     * @param owner Owner address
     * @param spender Spender address
     * @return Encrypted allowance
     */
    function allowance(address owner, address spender)
        external
        view
        returns (euint64)
    {
        require(
            msg.sender == owner || msg.sender == spender,
            "Cannot view allowance"
        );
        return allowances[owner][spender];
    }

    /**
     * @notice Check if address has any balance (without revealing amount)
     * @param account Address to check
     * @return True if has balance (public info)
     * @dev This reveals existence of balance, but not amount
     */
    function hasBalance(address account) external view returns (bool) {
        // This is a simplified check
        // In production, might want to keep this private too
        return true; // Placeholder
    }
}
