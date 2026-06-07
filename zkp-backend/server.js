const express = require('express');
const snarkjs = require('snarkjs');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware for response time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration} ms`);
  });
  next();
});

function stringToBigInt(value) {
  const text = String(value ?? "");
  if (!text.length) {
    return 0n;
  }
  const hex = Buffer.from(text, "utf8").toString("hex");
  return BigInt(`0x${hex}`);
}

const wasmPath = process.env.WASM_PATH || path.join(__dirname, 'identity.wasm');
const zkeyPath = process.env.ZKEY_PATH || path.join(__dirname, 'identity_final.zkey');
const vKeyPath = process.env.VKEY_PATH || path.join(__dirname, 'verification_key.json');
const vKey = JSON.parse(fs.readFileSync(vKeyPath, 'utf8'));

const verifierAbiPath = process.env.VERIFIER_ABI_PATH || path.join(__dirname, '../zk-proofs/artifacts/contracts/IdentityVerifier.sol/Groth16Verifier.json');
const verifierAbi = require(verifierAbiPath).abi;

const registryAbiPath = process.env.REGISTRY_ABI_PATH || path.join(__dirname, '../zk-proofs/artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json');
const registryAbi = require(registryAbiPath).abi;

const verifierAddress = process.env.VERIFIER_ADDRESS || '0x2625C6fDBEDcCD572836FfbFA391D2C25de7ae26';
const registryAddress = process.env.REGISTRY_ADDRESS || '0xB7a915C78C546A1082CB66bA294fAFee52E4EB07';
const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/Lmv_xbdd0nSBMkbWSz9kk';
const port = Number(process.env.PORT || 3001);

const provider = new ethers.JsonRpcProvider(rpcUrl);

const verifierContract = new ethers.Contract(verifierAddress, verifierAbi, provider);
const registryContract = new ethers.Contract(registryAddress, registryAbi, provider);

app.get('/', (req, res) => {
  res.send('ZKP backend running');
});

app.post('/generate-proof', async (req, res) => {
  console.log('Received input:', req.body);
  try {
    const { name, rollNo, dob, phoneNo, branch } = req.body;
    
    const input = {
        name: stringToBigInt(name),
        rollNo: stringToBigInt(rollNo),
        dob: stringToBigInt(dob),
        phoneNo: stringToBigInt(phoneNo),
        branch: stringToBigInt(branch),
    };

    console.time('ProofGeneration');
    // Generate proof and public signals using snarkjs
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );
    console.timeEnd('ProofGeneration');

    res.json({ proof, publicSignals });
  } catch (err) {
    console.error('Proof generation error:', err);
    res.status(500).json({ error: 'Proof generation failed', details: err.message });
  }
});

app.post('/verify', async (req, res) => {
  const { proof, publicSignals } = req.body;
  try {
    console.time('OffChainVerification');
    const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    console.timeEnd('OffChainVerification');
    res.json({ valid: isValid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/verify-onchain', async (req, res) => {
  const { proof, publicSignals } = req.body;

  if (!proof || !publicSignals) {
    return res.status(400).json({ error: 'Missing proof or public signals' });
  }

  try {
    // Format proof parameters as expected by Solidity verifier contract
    const pA = [proof.pi_a[0], proof.pi_a[1]];

    // Solidity verifier expects pi_b with swapped inner array order
    const pB = [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ];

    const pC = [proof.pi_c[0], proof.pi_c[1]];

    console.time('OnChainVerification');
    // Call the Solidity verifier contract's verifyProof method (read-only)
    const isValid = await verifierContract.verifyProof(pA, pB, pC, publicSignals);
    console.timeEnd('OnChainVerification');

    res.json({ valid: isValid });
  } catch (err) {
    console.error('On-chain proof verification failed:', err);
    res.status(500).json({ error: 'On-chain verification failed', details: err.message });
  }
});

app.post('/credential-info', async (req, res) => {
  const { pubHash } = req.body; // decimal string from publicSignals[0]

  if (!pubHash) {
    return res.status(400).json({ error: 'pubHash is required' });
  }

  try {
    const pubHashBytes32 = ethers.zeroPadValue(ethers.toBeHex(BigInt(pubHash)), 32);
    const [rollNo, ipfsCID, issuedAt, exists, revoked] = await registryContract.getCredentialByHash(pubHashBytes32);

    if (!exists || !ipfsCID) {
      return res.json({ found: false, message: 'Credential not found in registry' });
    }

    res.json({
      found: true,
      rollNo,
      ipfsCID,
      issuedAtMs: Number(issuedAt) * 1000,
      revoked,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${ipfsCID}`,
      etherscanUrl: `https://sepolia.etherscan.io/address/${registryAddress}`,
    });
  } catch (err) {
    console.error('Credential info lookup failed:', err);
    res.status(500).json({ error: 'Registry lookup failed', details: err.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Verifier API listening on port ${port}`);
});
