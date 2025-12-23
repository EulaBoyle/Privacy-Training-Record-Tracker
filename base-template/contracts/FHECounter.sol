// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHECounter
 * @notice A simple encrypted counter demonstrating FHEVM basics
 * @dev This is a template contract showing fundamental FHEVM patterns
 */
contract FHECounter is SepoliaConfig {
    // Encrypted counter value
    euint32 private counter;

    // Contract owner
    address public owner;

    // Event emitted when counter is incremented
    event CounterIncremented(address indexed user);

    // Event emitted when counter is decremented
    event CounterDecremented(address indexed user);

    /**
     * @notice Contract constructor
     * @dev Initializes counter to 0 and sets owner
     */
    constructor() {
        owner = msg.sender;
        counter = FHE.asEuint32(0);
        FHE.allowThis(counter);
    }

    /**
     * @notice Increment counter by encrypted value
     * @param inputHandle Encrypted input handle
     * @param inputProof Input proof for encryption
     */
    function increment(inEuint32 calldata inputHandle, bytes calldata inputProof) external {
        euint32 value = FHE.asEuint32(inputHandle, inputProof);
        counter = FHE.add(counter, value);

        // Set permissions
        FHE.allowThis(counter);
        FHE.allow(counter, msg.sender);

        emit CounterIncremented(msg.sender);
    }

    /**
     * @notice Get encrypted counter value
     * @return Encrypted counter value
     */
    function getCounter() external view returns (euint32) {
        return counter;
    }
}
