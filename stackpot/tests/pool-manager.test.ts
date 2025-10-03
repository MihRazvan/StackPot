import { describe, it, expect } from 'vitest';
import { Cl } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const wallet1 = accounts.get('wallet_1')!;

describe('pool-manager', () => {
  it('allows users to deposit STX', () => {
    // Define the amount to deposit
    const amount = 1000000;

    // Call the deposit function
    const deposit = simnet.callPublicFn('pool-manager', 'deposit', [Cl.uint(amount)], wallet1);

    // Assert the deposit was successful
    expect(deposit.result).toBeOk(Cl.uint(amount));

    // Check the user's balance
    const balance = simnet.callReadOnlyFn('pool-manager', 'get-participant-balance', [Cl.principal(wallet1)], wallet1);
    expect(balance.result).toBeUint(amount);
  });
});