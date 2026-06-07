const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CredentialRegistry Gas Costs", function () {
  let registry;

  before(async function () {
    const Registry = await ethers.getContractFactory("CredentialRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  it("Should report gas cost for issuing a new credential", async function () {
    const tx = await registry.issueCredential(
      "22BCS001",
      "QmTp2h3d9rA4D3E5F6G7H8J9K0L1M2N3O4P5Q6R7S8T9U",
      "0x1234567890123456789012345678901234567890123456789012345678901234"
    );
    const receipt = await tx.wait();
    console.log(`
Gas used for issueCredential (new): ${receipt.gasUsed.toString()}`);
    expect(receipt.gasUsed).to.be.gt(0);
  });

  it("Should report gas cost for updating an existing credential", async function () {
    const tx = await registry.issueCredential(
      "22BCS001",
      "QmNewCidHashForAnExistingStudentCredentialValue",
      "0x9876543210987654321098765432109876543210987654321098765432109876"
    );
    const receipt = await tx.wait();
    console.log(`Gas used for issueCredential (update): ${receipt.gasUsed.toString()}`);
    expect(receipt.gasUsed).to.be.gt(0);
  });

  it("Should report gas cost for revoking a credential", async function () {
    // First, issue a credential to revoke
    await registry.issueCredential(
      "22BCS002",
      "QmAnotherCidHashForRevocationPurposeValue",
      "0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890"
    );

    const tx = await registry.revokeCredential("22BCS002");
    const receipt = await tx.wait();
    console.log(`Gas used for revokeCredential: ${receipt.gasUsed.toString()}`);
    expect(receipt.gasUsed).to.be.gt(0);
  });
});
