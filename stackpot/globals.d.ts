import { ClarityValue } from '@stacks/transactions';

declare global {
  const simnet: {
    getAccounts(): Map<string, string>;
    callPublicFn(
      contract: string,
      method: string,
      args: ClarityValue[],
      sender: string
    ): { result: any; events: any[] };
    callReadOnlyFn(
      contract: string,
      method: string,
      args: ClarityValue[],
      sender: string
    ): { result: any };
    mineBlock(txs: any[]): any;
    mineEmptyBlock(): void;
    mineEmptyBlocks(count: number): void;
  };
}

// Extend Vitest matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOk(expected?: any): void;
    toBeErr(expected?: any): void;
    toBeUint(expected: number | bigint): void;
    toBeBool(expected: boolean): void;
  }
}

export {};