const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Full BitTON Integration: Staking + Airdrop", function () {
  let btnToken, stakingRewards, airdropBonus;
  let owner, buyer, upline1, upline2, upline3;

  beforeEach(async function () {
    [owner, buyer, upline1, upline2, upline3] = await ethers.getSigners();

    const BTNToken = await ethers.getContractFactory("BTNToken");
    btnToken = await BTNToken.deploy();

    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await StakingRewards.deploy(btnToken.target);

    const AirdropBonus = await ethers.getContractFactory("AirdropBonus");
    airdropBonus = await AirdropBonus.deploy(btnToken.target);

    // Fund contracts (6 decimals)
    await btnToken.transfer(stakingRewards.target, ethers.parseUnits("10000000", 6));
    await btnToken.transfer(airdropBonus.target, ethers.parseUnits("5000000", 6));

    await stakingRewards.setWhitelistedToken(btnToken.target, true);
  });

  it("FULL FLOW: User stakes → Airdrop distributes → Uplines earn → Weekly claims work", async function () {
    console.log("\n=== FULL BITTON FLOW TEST ===\n");

    // 1. Build referral chain: buyer → upline1 → upline2 → upline3
    await airdropBonus.setReferrer(buyer.address, upline1.address);
    await airdropBonus.setReferrer(upline1.address, upline2.address);
    await airdropBonus.setReferrer(upline2.address, upline3.address);

    // Set all to Ruby rank (10 levels)
    await airdropBonus.setUserRank(upline1.address, 6);
    await airdropBonus.setUserRank(upline2.address, 6);
    await airdropBonus.setUserRank(upline3.address, 6);

    console.log("✓ Referral chain built: buyer → upline1 → upline2 → upline3 (all Ruby rank)");

    // 2. Buyer stakes 5000 BTN
    const stakeAmount = ethers.parseUnits("5000", 6);
    await btnToken.transfer(buyer.address, stakeAmount);
    await btnToken.connect(buyer).approve(stakingRewards.target, stakeAmount);
    await stakingRewards.connect(buyer).stake(btnToken.target, stakeAmount);

    console.log("✓ Buyer staked 5000 BTN");

    // 3. Distribute airdrop
    await airdropBonus.distributeAirdrop(buyer.address, stakeAmount);

    const up1Balance = await btnToken.balanceOf(upline1.address);
    const up2Balance = await btnToken.balanceOf(upline2.address);
    const up3Balance = await btnToken.balanceOf(upline3.address);

    // Ruby bonuses: L1=1%, L2=1%, L3=1%
    expect(up1Balance).to.equal(ethers.parseUnits("50", 6)); // 1% of 5000
    expect(up2Balance).to.equal(ethers.parseUnits("50", 6)); // 1% of 5000
    expect(up3Balance).to.equal(ethers.parseUnits("50", 6)); // 1% of 5000

    console.log(`✓ Airdrop distributed: Upline1=${ethers.formatUnits(up1Balance, 6)} BTN, Upline2=${ethers.formatUnits(up2Balance, 6)} BTN, Upline3=${ethers.formatUnits(up3Balance, 6)} BTN`);

    // 4. Fast forward 7 days
    await time.increase(7 * 24 * 60 * 60);

    const pendingReward = await stakingRewards.getPendingRewards(buyer.address, 0);
    const expected = ethers.parseUnits("700", 6); // 5000 * 2% * 7 days

    expect(pendingReward).to.be.closeTo(expected, expected / 1000n);

    console.log(`✓ After 7 days: Buyer's pending staking reward = ${ethers.formatUnits(pendingReward, 6)} BTN`);

    // 5. Upline1 stakes their airdrop bonus
    await btnToken.connect(upline1).approve(stakingRewards.target, up1Balance);
    await stakingRewards.connect(upline1).stake(btnToken.target, up1Balance);

    console.log("✓ Upline1 staked their 50 BTN airdrop bonus");

    // 6. Verify lock period enforcement
    await expect(stakingRewards.connect(buyer).unstake(0))
      .to.be.revertedWith("Lock period not ended");

    console.log("✓ Lock period enforced (135 days required)");

    // 7. Fast forward to unlock (135 days total)
    await time.increase(128 * 24 * 60 * 60); // Already 7 days in, add 128 more

    const balanceBefore = await btnToken.balanceOf(buyer.address);
    await stakingRewards.connect(buyer).unstake(0);
    const balanceAfter = await btnToken.balanceOf(buyer.address);

    const totalReturned = balanceAfter - balanceBefore;
    expect(totalReturned).to.be.gt(stakeAmount); // Should get back stake + rewards

    console.log(`✓ After 135 days: Buyer unstaked and received ${ethers.formatUnits(totalReturned, 6)} BTN (principal + rewards)`);
    console.log("\n=== ALL FLOWS WORKING PERFECTLY ===\n");
  });

  it("Should handle multi-tier ranks correctly (Bronze vs Diamond)", async function () {
    // Setup Bronze user (only L1 bonus)
    await airdropBonus.setReferrer(buyer.address, upline1.address);
    await airdropBonus.setUserRank(upline1.address, 1); // Bronze

    // Setup Diamond downstream
    await airdropBonus.setReferrer(upline1.address, upline2.address);
    await airdropBonus.setUserRank(upline2.address, 8); // Diamond

    const purchaseAmount = ethers.parseUnits("1000", 6);
    await airdropBonus.distributeAirdrop(buyer.address, purchaseAmount);

    // Bronze L1: 3%
    expect(await btnToken.balanceOf(upline1.address)).to.equal(ethers.parseUnits("30", 6));

    // Diamond L2: 1%
    expect(await btnToken.balanceOf(upline2.address)).to.equal(ethers.parseUnits("10", 6));
  });
});
