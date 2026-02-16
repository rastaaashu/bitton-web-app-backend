const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("StakingRewards Contract", function () {
  let btnToken, stakingRewards;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const BTNToken = await ethers.getContractFactory("BTNToken");
    btnToken = await BTNToken.deploy();

    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await StakingRewards.deploy(btnToken.target);

    // Fund staking contract
    await btnToken.transfer(stakingRewards.target, ethers.parseUnits("10000000", 6));

    // Whitelist BTN token
    await stakingRewards.setWhitelistedToken(btnToken.target, true);
  });

  it("Should deploy with correct initial values", async function () {
    expect(await stakingRewards.btnToken()).to.equal(btnToken.target);
    expect(await stakingRewards.defaultLockPeriod()).to.equal(135 * 24 * 60 * 60); // 135 days
    expect(await stakingRewards.defaultRewardRate()).to.equal(200); // 2% per day
  });

  it("Should allow admin to update reward rate", async function () {
    await stakingRewards.setDefaultRewardRate(300);
    expect(await stakingRewards.defaultRewardRate()).to.equal(300);
  });

  it("Should allow admin to whitelist tokens", async function () {
    expect(await stakingRewards.whitelistedTokens(btnToken.target)).to.be.true;

    await stakingRewards.setWhitelistedToken(btnToken.target, false);
    expect(await stakingRewards.whitelistedTokens(btnToken.target)).to.be.false;
  });

  it("Should allow user to stake tokens", async function () {
    const stakeAmount = ethers.parseUnits("1000", 6);
    await btnToken.transfer(user1.address, stakeAmount);
    await btnToken.connect(user1).approve(stakingRewards.target, stakeAmount);

    await expect(stakingRewards.connect(user1).stake(btnToken.target, stakeAmount))
      .to.emit(stakingRewards, "Staked");

    const stakes = await stakingRewards.getUserStakes(user1.address);
    expect(stakes.length).to.equal(1);
    expect(stakes[0].amount).to.equal(stakeAmount);
  });

  it("Should calculate rewards with per-second precision", async function () {
    const stakeAmount = ethers.parseUnits("5000", 6);
    await btnToken.transfer(user1.address, stakeAmount);
    await btnToken.connect(user1).approve(stakingRewards.target, stakeAmount);

    await stakingRewards.connect(user1).stake(btnToken.target, stakeAmount);

    // Fast forward 7 days
    await time.increase(7 * 24 * 60 * 60);

    const pending = await stakingRewards.getPendingRewards(user1.address, 0);
    const expected = ethers.parseUnits("700", 6); // 5000 * 2% * 7 days

    // Allow 0.1% tolerance for per-second precision
    expect(pending).to.be.closeTo(expected, expected / 1000n);
  });

  it("Should only allow claims on designated day (Monday)", async function () {
    const stakeAmount = ethers.parseUnits("1000", 6);
    await btnToken.transfer(user1.address, stakeAmount);
    await btnToken.connect(user1).approve(stakingRewards.target, stakeAmount);

    await stakingRewards.connect(user1).stake(btnToken.target, stakeAmount);

    // Fast forward 2 days
    await time.increase(2 * 24 * 60 * 60);

    // Should fail if not Monday
    const currentTime = await time.latest();
    const dayOfWeek = Math.floor((currentTime / 86400 + 4) % 7); // 0=Sunday, 1=Monday...

    if (dayOfWeek !== 1) {
      await expect(stakingRewards.connect(user1).claimRewards(0))
        .to.be.revertedWith("Can only claim on the designated day");
    }
  });

  it("Should prevent unstaking before lock period ends", async function () {
    const stakeAmount = ethers.parseUnits("1000", 6);
    await btnToken.transfer(user1.address, stakeAmount);
    await btnToken.connect(user1).approve(stakingRewards.target, stakeAmount);

    await stakingRewards.connect(user1).stake(btnToken.target, stakeAmount);

    // Try to unstake before lock period
    await expect(stakingRewards.connect(user1).unstake(0))
      .to.be.revertedWith("Lock period not ended");
  });

  it("Should allow unstaking after lock period", async function () {
    const stakeAmount = ethers.parseUnits("1000", 6);
    await btnToken.transfer(user1.address, stakeAmount);
    await btnToken.connect(user1).approve(stakingRewards.target, stakeAmount);

    await stakingRewards.connect(user1).stake(btnToken.target, stakeAmount);

    // Fast forward beyond lock period (135 days)
    await time.increase(136 * 24 * 60 * 60);

    const initialBalance = await btnToken.balanceOf(user1.address);
    await stakingRewards.connect(user1).unstake(0);
    const finalBalance = await btnToken.balanceOf(user1.address);

    // Should receive principal + rewards
    expect(finalBalance).to.be.gt(initialBalance);
  });
});
