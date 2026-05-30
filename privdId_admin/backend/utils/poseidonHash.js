import { buildPoseidon } from "circomlibjs";

let poseidonPromise;

function stringToBigInt(value) {
  const text = String(value ?? "");

  if (!text.length) {
    return 0n;
  }

  const hex = Buffer.from(text, "utf8").toString("hex");
  return BigInt(`0x${hex}`);
}

async function getPoseidon() {
  if (!poseidonPromise) {
    poseidonPromise = buildPoseidon();
  }

  return poseidonPromise;
}

export async function hashPoseidonFields(fields) {
  const poseidon = await getPoseidon();
  const values = fields.map((field) => stringToBigInt(field));
  const hash = poseidon(values);

  return poseidon.F.toString(hash);
}

export { stringToBigInt };