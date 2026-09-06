#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { verifyInteropV02Receipt } from "./verify-receipt.js";
const [receiptPath, publicKeyPath] = process.argv.slice(2);
if (!receiptPath || !publicKeyPath) throw new Error("usage: verify-file <receipt.json> <public-key.pem>");
const result = verifyInteropV02Receipt(readFileSync(receiptPath, "utf8"), readFileSync(publicKeyPath, "utf8"));
console.log(JSON.stringify(result));
if (!result.ok) process.exitCode = 1;
