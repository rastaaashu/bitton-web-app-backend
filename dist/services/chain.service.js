"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainService = exports.ChainService = void 0;
const ethers_1 = require("ethers");
const contracts_1 = require("../config/contracts");
const logger_1 = require("../utils/logger");
class ChainService {
    /**
     * Get current on-chain state of CustodialDistribution
     */
    async getCustodialState() {
        const custodial = (0, contracts_1.getCustodialContract)((0, contracts_1.getProvider)());
        const [balance, totalDistributed, totalReturned, totalMigrated, migrationEnabled, finalized, distributionCap] = await Promise.all([
            custodial.getBalance(),
            custodial.totalDistributed(),
            custodial.totalReturned(),
            custodial.totalMigrated(),
            custodial.isMigrationEnabled(),
            custodial.isFinalized(),
            custodial.distributionCap(),
        ]);
        return {
            balance: ethers_1.ethers.formatUnits(balance, 6),
            totalDistributed: ethers_1.ethers.formatUnits(totalDistributed, 6),
            totalReturned: ethers_1.ethers.formatUnits(totalReturned, 6),
            totalMigrated: ethers_1.ethers.formatUnits(totalMigrated, 6),
            migrationEnabled,
            finalized,
            distributionCap: ethers_1.ethers.formatUnits(distributionCap, 6),
        };
    }
    /**
     * Distribute BTN from Custodial to a user
     */
    async distribute(to, amountBtn) {
        const custodial = (0, contracts_1.getCustodialContract)();
        const amount = ethers_1.ethers.parseUnits(amountBtn, 6);
        logger_1.logger.info(`Distributing ${amountBtn} BTN to ${to}`);
        const tx = await custodial.distribute(to, amount);
        const receipt = await tx.wait();
        logger_1.logger.info(`Distribution confirmed: ${receipt.hash}`);
        return {
            txHash: receipt.hash,
            gasUsed: receipt.gasUsed.toString(),
        };
    }
    /**
     * Batch migrate TON users to Base
     */
    async batchMigrate(recipients, amounts) {
        const custodial = (0, contracts_1.getCustodialContract)();
        const amountsBigInt = amounts.map((a) => ethers_1.ethers.parseUnits(a, 6));
        logger_1.logger.info(`Batch migrating ${recipients.length} users`);
        const tx = await custodial.batchMigrate(recipients, amountsBigInt);
        const receipt = await tx.wait();
        logger_1.logger.info(`Migration batch confirmed: ${receipt.hash}`);
        return {
            txHash: receipt.hash,
            gasUsed: receipt.gasUsed.toString(),
        };
    }
    /**
     * Check if a user has already migrated
     */
    async hasMigrated(address) {
        const custodial = (0, contracts_1.getCustodialContract)((0, contracts_1.getProvider)());
        return custodial.hasMigrated(address);
    }
    /**
     * Get BTN balance for an address
     */
    async getBtnBalance(address) {
        const btn = (0, contracts_1.getBtnTokenContract)();
        const balance = await btn.balanceOf(address);
        return ethers_1.ethers.formatUnits(balance, 6);
    }
    /**
     * Get relayer wallet info
     */
    async getRelayerInfo() {
        const signer = (0, contracts_1.getRelayerSigner)();
        const provider = (0, contracts_1.getProvider)();
        const balance = await provider.getBalance(signer.address);
        return {
            address: signer.address,
            ethBalance: ethers_1.ethers.formatEther(balance),
        };
    }
}
exports.ChainService = ChainService;
exports.chainService = new ChainService();
//# sourceMappingURL=chain.service.js.map