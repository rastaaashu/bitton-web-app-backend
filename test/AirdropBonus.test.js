const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AirdropBonus Contract", function () {
  let btnToken, airdropBonus, stakingRewards;
  let owner, user1, user2, user3, user4;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4] = await ethers.getSigners();

    // Deploy BTN Token
    const BTNToken = await ethers.getContractFactory("BTNToken");
    btnToken = await BTNToken.deploy();

    // Deploy StakingRewards
    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    stakingRewards = await StakingRewards.deploy(btnToken.target);

    // Deploy AirdropBonus
    const AirdropBonus = await ethers.getContractFactory("AirdropBonus");
    airdropBonus = await AirdropBonus.deploy(btnToken.target);

    // Fund contracts
    await btnToken.transfer(stakingRewards.target, ethers.parseUnits("1000000", 6));
    await btnToken.transfer(airdropBonus.target, ethers.parseUnits("500000", 6));
  });

  it("Should deploy contracts correctly", async function () {
    expect(await airdropBonus.btnToken()).to.equal(btnToken.target);
    expect(await stakingRewards.btnToken()).to.equal(btnToken.target);
  });

  it("Should set referrer correctly", async function () {
    await airdropBonus.setReferrer(user2.address, user1.address);
    expect(await airdropBonus.referrers(user2.address)).to.equal(user1.address);
  });

  it("Should distribute airdrop to Gold rank (3 levels)", async function () {
    // Build chain: user4 → user3 → user2 → user1
    await airdropBonus.setReferrer(user4.address, user3.address);
    await airdropBonus.setReferrer(user3.address, user2.address);
    await airdropBonus.setReferrer(user2.address, user1.address);

    // Set ranks: user1=Gold(3), user2=Gold, user3=Gold
    await airdropBonus.setUserRank(user1.address, 3); // Gold
    await airdropBonus.setUserRank(user2.address, 3);
    await airdropBonus.setUserRank(user3.address, 3);

    const purchaseAmount = ethers.parseUnits("1000", 6);

    await expect(airdropBonus.distributeAirdrop(user4.address, purchaseAmount))
      .to.emit(airdropBonus, "AirdropDistributed");

    // Gold gets 3 levels: 1%, 2%, 3%
    expect(await btnToken.balanceOf(user3.address)).to.equal(ethers.parseUnits("10", 6)); // 1%
    expect(await btnToken.balanceOf(user2.address)).to.equal(ethers.parseUnits("20", 6)); // 2%
    expect(await btnToken.balanceOf(user1.address)).to.equal(ethers.parseUnits("30", 6)); // 3%
  });

  it("Should distribute airdrop to Ruby rank (10 levels)", async function () {
    const signers = await ethers.getSigners();
    const buyer = signers[12];  // Use signer 12 to avoid conflicts
    const uplines = signers.slice(1, 11); // signers[1] to signers[10] (skip owner at [0])

    // Build 10-level chain: buyer → uplines[0] → uplines[1] → ... → uplines[9]
    await airdropBonus.setReferrer(buyer.address, uplines[0].address);
    await airdropBonus.setUserRank(uplines[0].address, 6); // Ruby rank
    
    for (let i = 0; i < 9; i++) {
      await airdropBonus.setReferrer(uplines[i].address, uplines[i + 1].address);
      await airdropBonus.setUserRank(uplines[i + 1].address, 6); // Ruby rank
    }

    const purchaseAmount = ethers.parseUnits("10000", 6);
    await airdropBonus.distributeAirdrop(buyer.address, purchaseAmount);

    // Ruby percentages: 1%, 1%, 1%, 2%, 2%, 2%, 3%, 3%, 3%, 4%
    const expectedPercentages = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4];
    for (let i = 0; i < 10; i++) {
      const expected = (purchaseAmount * BigInt(expectedPercentages[i])) / 100n;
      const balance = await btnToken.balanceOf(uplines[i].address);
      expect(balance).to.equal(expected);
    }
  });
});
