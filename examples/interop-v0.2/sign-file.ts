#!/usr/bin/env node
import { createHash, createPublicKey } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { signInteropV02Claim } from "./verify-receipt.js";
const [claimPath, privateKeyPath, outputPath] = process.argv.slice(2);
if (!claimPath || !privateKeyPath || !outputPath) throw new Error("usage: sign-file <claim.json> <private-key.pem> <output.json>");
const claim = JSON.parse(readFileSync(claimPath, "utf8")) as Record<string, unknown>;
const privateKey = readFileSync(privateKeyPath, "utf8");
const der = createPublicKey(privateKey).export({ type: "spki", format: "der" });
writeFileSync(outputPath, JSON.stringify({ claim, signature: signInteropV02Claim(claim, privateKey), public_key_id: `sha256:${createHash("sha256").update(der).digest("hex")}` }, null, 2) + "\n");
