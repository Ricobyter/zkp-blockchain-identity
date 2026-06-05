import axios from 'axios';
import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const registryArtifact = JSON.parse(
  readFileSync(
    join(__dirname, '../../../zk-proofs/artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json'),
    'utf8'
  )
);

async function pinToIPFS(credential) {
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    {
      pinataContent: credential,
      pinataMetadata: { name: `privid-credential-${credential.rollNo}` },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.IpfsHash;
}

async function anchorOnChain(rollNo, cid, hashedData) {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(`0x${process.env.PRIVATE_KEY}`, provider);
  const registry = new ethers.Contract(process.env.REGISTRY_ADDRESS, registryArtifact.abi, wallet);

  // hashedData is a decimal string from Poseidon — convert to bytes32
  const pubHashBytes32 = ethers.zeroPadValue(ethers.toBeHex(BigInt(hashedData)), 32);

  const tx = await registry.issueCredential(rollNo, cid, pubHashBytes32);
  const receipt = await tx.wait();

  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
}

export async function issueCredentialOnChain(student) {
  const credential = {
    rollNo: student.rollNo,
    programme: student.programme,
    email: student.email,
    hashedData: student.hashedData,
    issuedAt: new Date().toISOString(),
    issuer: 'PrivdID — VIT Bhopal University',
    type: 'StudentIdentityCredential',
    version: '1.0',
  };

  const cid = await pinToIPFS(credential);
  const { txHash, blockNumber } = await anchorOnChain(student.rollNo, cid, student.hashedData);

  console.log(`[credential] Anchored ${student.rollNo} → IPFS: ${cid} | Tx: ${txHash}`);
  return { cid, txHash, blockNumber };
}
