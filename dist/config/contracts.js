"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVE_FUND_ABI = exports.BONUS_ENGINE_ABI = exports.WITHDRAWAL_WALLET_ABI = exports.VESTING_POOL_ABI = exports.STAKING_VAULT_ABI = exports.VAULT_MANAGER_ABI = exports.REWARD_ENGINE_ABI = exports.CUSTODIAL_ABI = exports.BTN_TOKEN_ABI = void 0;
exports.getProvider = getProvider;
exports.getRelayerSigner = getRelayerSigner;
exports.getCustodialContract = getCustodialContract;
exports.getBtnTokenContract = getBtnTokenContract;
exports.getUsdcTokenContract = getUsdcTokenContract;
exports.getRewardEngineContract = getRewardEngineContract;
exports.getVaultManagerContract = getVaultManagerContract;
exports.getStakingVaultContract = getStakingVaultContract;
exports.getVestingPoolContract = getVestingPoolContract;
exports.getWithdrawalWalletContract = getWithdrawalWalletContract;
exports.getBonusEngineContract = getBonusEngineContract;
const ethers_1 = require("ethers");
const env_1 = require("./env");
// Minimal ABIs — only the functions the backend needs to call or read
// Full ABIs should be generated from artifacts in production
exports.BTN_TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
];
exports.CUSTODIAL_ABI = [
    "function distribute(address to, uint256 amount)",
    "function fundContract(address target, uint256 amount)",
    "function returnTokens(uint256 amount)",
    "function batchMigrate(address[] recipients, uint256[] amounts)",
    "function disableMigration()",
    "function setDistributionCap(uint256 cap)",
    "function finalize()",
    "function pause()",
    "function unpause()",
    "function getBalance() view returns (uint256)",
    "function totalDistributed() view returns (uint256)",
    "function totalReturned() view returns (uint256)",
    "function totalMigrated() view returns (uint256)",
    "function isMigrationEnabled() view returns (bool)",
    "function isFinalized() view returns (bool)",
    "function hasMigrated(address user) view returns (bool)",
    "function distributionCap() view returns (uint256)",
    "function OPERATOR_ROLE() view returns (bytes32)",
    "function EMERGENCY_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "event TokensDistributed(address indexed to, uint256 amount, address indexed operator)",
    "event ContractFunded(address indexed target, uint256 amount, address indexed operator)",
    "event TokensReturned(address indexed from, uint256 amount)",
    "event MigrationClaimed(address indexed recipient, uint256 amount)",
    "event MigrationDisabled()",
    "event ContractFinalized(address indexed admin)",
];
exports.REWARD_ENGINE_ABI = [
    "function settleWeekly(address user)",
    "function calculateReward(address user, uint256 stakeIndex) view returns (uint256)",
    "function rewardPoolBalance() view returns (uint256)",
    "function getTotalPending(address user) view returns (uint256)",
    "function liquidSplitPct(uint8 programType) view returns (uint256)",
    "event RewardSettled(address indexed user, uint256 totalReward, uint256 liquidAmount, uint256 shortVestedAmount, uint256 longVestedAmount)",
];
exports.VAULT_MANAGER_ABI = [
    "function isVaultActive(address user) view returns (bool)",
    "function getUserTier(address user) view returns (uint8)",
    "event VaultActivated(address indexed user, uint8 tier, address paymentToken, uint256 amount)",
];
// Updated: new StakeInfo struct with btnEquivalent and isUSDC
exports.STAKING_VAULT_ABI = [
    "function getStakes(address user) view returns (tuple(uint256 amount, uint256 btnEquivalent, uint256 startTime, uint8 programType, uint256 lastRewardTime, bool active, bool isUSDC)[])",
    "function getPendingRewards(address user, uint256 stakeIndex) view returns (uint256)",
    "function getUserTotalStaked(address user) view returns (uint256)",
    "function totalStaked() view returns (uint256)",
    "function totalStakedUSDC() view returns (uint256)",
    "function dailyRateBps(uint8 programType) view returns (uint256)",
    "function btnPriceUSD() view returns (uint256)",
    "event Staked(address indexed user, uint256 amount, uint8 programType, uint256 stakeIndex, bool isUSDC)",
    "event Unstaked(address indexed user, uint256 principal, uint256 stakeIndex, bool isUSDC)",
    "event UnstakedWithPenalty(address indexed user, uint256 returned, uint256 penalty, uint256 stakeIndex)",
];
// Updated: per-deposit vesting with vestingType
exports.VESTING_POOL_ABI = [
    "function getVestedBalance(address user) view returns (uint256)",
    "function getPendingRelease(address user) view returns (uint256)",
    "function getDepositCount(address user) view returns (uint256)",
    "function getDeposit(address user, uint256 index) view returns (tuple(uint256 amount, uint256 depositTime, uint8 vestingType, uint256 released, bool fullyReleased))",
    "event VestingAdded(address indexed user, uint256 amount, uint8 vestingType, uint256 depositIndex)",
    "event VestedReleased(address indexed user, uint256 amount, uint256 depositsProcessed)",
];
// Updated: dual-token withdrawal
exports.WITHDRAWAL_WALLET_ABI = [
    "function getWithdrawableBalance(address user) view returns (uint256)",
    "function getWithdrawableInUSDC(address user) view returns (uint256)",
    "function btnPriceUSD() view returns (uint256)",
    "event WithdrawnAsBTN(address indexed user, uint256 btnAmount)",
    "event WithdrawnAsUSDC(address indexed user, uint256 btnAmount, uint256 usdcAmount)",
    "event WithdrawableAdded(address indexed user, uint256 amount)",
];
exports.BONUS_ENGINE_ABI = [
    "function processDirectBonus(address staker, uint256 stakeAmount) external",
    "function getReferrer(address user) view returns (address)",
    "function getDownline(address user) view returns (address[])",
    "event ReferrerRegistered(address indexed user, address indexed referrer)",
    "event DirectBonusProcessed(address indexed referrer, address indexed staker, uint256 stakeAmount, uint256 bonusAmount)",
    "event MatchingBonusProcessed(address indexed ancestor, address indexed downlineUser, uint256 bonusAmount, uint8 level)",
];
exports.RESERVE_FUND_ABI = [
    "function getBalance(address token) view returns (uint256)",
    "event FundsDistributed(address indexed token, address indexed to, uint256 amount, string reason)",
];
// Provider + Signer
let _provider = null;
let _signer = null;
function getProvider() {
    if (!_provider) {
        _provider = new ethers_1.ethers.JsonRpcProvider(env_1.env.rpcUrl, env_1.env.chainId);
    }
    return _provider;
}
function getRelayerSigner() {
    if (!_signer) {
        _signer = new ethers_1.ethers.Wallet(env_1.env.relayerPrivateKey, getProvider());
    }
    return _signer;
}
// Contract instances
function getCustodialContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.custodial, exports.CUSTODIAL_ABI, signerOrProvider || getRelayerSigner());
}
function getBtnTokenContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.btnToken, exports.BTN_TOKEN_ABI, signerOrProvider || getProvider());
}
function getUsdcTokenContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.usdcToken, exports.BTN_TOKEN_ABI, // same ERC20 interface
    signerOrProvider || getProvider());
}
function getRewardEngineContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.rewardEngine, exports.REWARD_ENGINE_ABI, signerOrProvider || getRelayerSigner());
}
function getVaultManagerContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.vaultManager, exports.VAULT_MANAGER_ABI, signerOrProvider || getProvider());
}
function getStakingVaultContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.stakingVault, exports.STAKING_VAULT_ABI, signerOrProvider || getProvider());
}
function getVestingPoolContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.vestingPool, exports.VESTING_POOL_ABI, signerOrProvider || getProvider());
}
function getWithdrawalWalletContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.withdrawalWallet, exports.WITHDRAWAL_WALLET_ABI, signerOrProvider || getProvider());
}
function getBonusEngineContract(signerOrProvider) {
    return new ethers_1.ethers.Contract(env_1.env.contracts.bonusEngine, exports.BONUS_ENGINE_ABI, signerOrProvider || getProvider());
}
//# sourceMappingURL=contracts.js.map