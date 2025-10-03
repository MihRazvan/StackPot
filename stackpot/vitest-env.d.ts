/// <reference types="vitest" />

import { Map } from '@stacks/transactions';

declare global {
  const simnet: {
    getAccounts(): Map<string, string>;
    callPublicFn(
      contract: string,
      method: string,
      args: any[],
      sender: string
    ): any;
    callReadOnlyFn(
      contract: string,
      method: string,
      args: any[],
      sender: string
    ): any;
    mineBlock(txs: any[]): any;
    mineEmptyBlock(): void;
    mineEmptyBlocks(count: number): void;
  };
}

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeOk(expected?: any): void;
    toBeErr(expected?: any): void;
    toBeUint(expected: number | bigint): void;
    toBeBool(expected: boolean): void;
  }
}