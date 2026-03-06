require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const oracleAddress = "0xf1DC093E1B3fD72A1C7f1B58bd3cE8A4832BEe52";
  const price = 50000000; // $0.50 with 8 decimals

  const oracle = await ethers.getContractAt("MockAggregator", oracleAddress);

  // Check current state
  const [, currentPrice, , updatedAt] = await oracle.latestRoundData();
  const now = Math.floor(Date.now() / 1000);
  const age = now - Number(updatedAt);
  console.log(`Current price: ${currentPrice} (age: ${age}s / ${(age/3600).toFixed(1)}h)`);

  // Update price
  const tx = await oracle.setPrice(price);
  console.log(`Updating oracle price to ${price} (tx: ${tx.hash})...`);
  await tx.wait();

  // Verify
  const [, newPrice, , newUpdatedAt] = await oracle.latestRoundData();
  const newAge = Math.floor(Date.now() / 1000) - Number(newUpdatedAt);
  console.log(`New price: ${newPrice} (age: ${newAge}s) - OK`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
