/**
 * Operator Job Runner
 *
 * Polls for pending operator jobs and executes them on-chain.
 * Handles retries, idempotency, and status tracking.
 */
export declare class OperatorRunner {
    private running;
    start(): Promise<void>;
    stop(): void;
    private processNextJob;
    private sleep;
}
export declare const operatorRunner: OperatorRunner;
//# sourceMappingURL=operator.runner.d.ts.map