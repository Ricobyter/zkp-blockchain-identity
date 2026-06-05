// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CredentialRegistry {
    address public admin;

    struct Credential {
        string  ipfsCID;
        bytes32 pubHash;
        uint256 issuedAt;
        bool    exists;
    }

    // rollNo (string) => credential record
    mapping(string => Credential) private credentials;
    // pubHash => valid (for fast ZK proof cross-check)
    mapping(bytes32 => bool) public isValidHash;

    event CredentialIssued(
        string  indexed rollNo,
        string          ipfsCID,
        bytes32         pubHash,
        uint256         timestamp
    );

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function issueCredential(
        string  calldata rollNo,
        string  calldata ipfsCID,
        bytes32          pubHash
    ) external onlyAdmin {
        credentials[rollNo] = Credential(ipfsCID, pubHash, block.timestamp, true);
        isValidHash[pubHash] = true;
        emit CredentialIssued(rollNo, ipfsCID, pubHash, block.timestamp);
    }

    function getCredential(string calldata rollNo)
        external view
        returns (
            string  memory ipfsCID,
            bytes32        pubHash,
            uint256        issuedAt,
            bool           exists
        )
    {
        Credential memory c = credentials[rollNo];
        return (c.ipfsCID, c.pubHash, c.issuedAt, c.exists);
    }
}
