import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;

describe("pool-manager contract tests", () => {
  it("ensures users can deposit STX to the pool", () => {
    const depositAmount = 1000000; // 1 STX in microSTX
    
    // Call deposit function
    const depositResponse = simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(depositAmount)],
      address1
    );
    
    // Check deposit succeeded
    expect(depositResponse.result).toBeOk(Cl.uint(depositAmount));
    
    // Verify STX transfer event occurred
    expect(depositResponse.events).toHaveLength(1);
    expect(depositResponse.events[0].event).toBe("stx_transfer_event");
    expect(depositResponse.events[0].data).toEqual({
      sender: address1,
      recipient: `${accounts.get("deployer")!}.pool-manager`,
      amount: depositAmount.toString(),
      memo: ""
    });
    
    // Verify participant balance
    const balanceResponse = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-balance",
      [Cl.principal(address1)],
      address1
    );
    expect(balanceResponse.result).toBeUint(depositAmount);
    
    // Verify pool size
    const poolSizeResponse = simnet.callReadOnlyFn(
      "pool-manager",
      "get-total-pool-size",
      [],
      address1
    );
    expect(poolSizeResponse.result).toBeUint(depositAmount);
  });

  it("ensures multiple users can participate", () => {
    const deposit1 = 1000000; // 1 STX
    const deposit2 = 2000000; // 2 STX
    const deposit3 = 1500000; // 1.5 STX
    
    // User 1 deposits
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(deposit1)],
      address1
    );
    
    // User 2 deposits
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(deposit2)],
      address2
    );
    
    // User 3 deposits
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(deposit3)],
      address3
    );
    
    // Check participant count
    const countResponse = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-count",
      [],
      address1
    );
    expect(countResponse.result).toBeUint(3);
    
    // Check total pool size
    const poolSizeResponse = simnet.callReadOnlyFn(
      "pool-manager",
      "get-total-pool-size",
      [],
      address1
    );
    expect(poolSizeResponse.result).toBeUint(deposit1 + deposit2 + deposit3);
    
    // Check individual balances
    const balance1 = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-balance",
      [Cl.principal(address1)],
      address1
    );
    expect(balance1.result).toBeUint(deposit1);
    
    const balance2 = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-balance",
      [Cl.principal(address2)],
      address2
    );
    expect(balance2.result).toBeUint(deposit2);
  });

  it("ensures users can withdraw their deposits", () => {
    const depositAmount = 1000000;
    const withdrawAmount = 400000;
    
    // Deposit first
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(depositAmount)],
      address1
    );
    
    // Withdraw partial amount
    const withdrawResponse = simnet.callPublicFn(
      "pool-manager",
      "withdraw",
      [Cl.uint(withdrawAmount)],
      address1
    );
    
    // Check withdrawal succeeded
    expect(withdrawResponse.result).toBeOk(Cl.uint(withdrawAmount));
    
    // Check STX transfer event
    expect(withdrawResponse.events).toHaveLength(1);
    expect(withdrawResponse.events[0].event).toBe("stx_transfer_event");
    expect(withdrawResponse.events[0].data.amount).toBe(withdrawAmount.toString());
    
    // Check remaining balance
    const balanceResponse = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-balance",
      [Cl.principal(address1)],
      address1
    );
    expect(balanceResponse.result).toBeUint(depositAmount - withdrawAmount);
  });

  it("prevents withdrawing more than deposited balance", () => {
    const depositAmount = 1000000;
    const excessiveAmount = 2000000;
    
    // Deposit
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(depositAmount)],
      address1
    );
    
    // Try to withdraw more than balance
    const withdrawResponse = simnet.callPublicFn(
      "pool-manager",
      "withdraw",
      [Cl.uint(excessiveAmount)],
      address1
    );
    
    // Should fail with ERR_INSUFFICIENT_BALANCE (u100)
    expect(withdrawResponse.result).toBeErr(Cl.uint(100));
    
    // Balance should remain unchanged
    const balanceResponse = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-balance",
      [Cl.principal(address1)],
      address1
    );
    expect(balanceResponse.result).toBeUint(depositAmount);
  });

  it("ensures zero deposits are rejected", () => {
    const response = simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(0)],
      address1
    );
    
    // Should fail with ERR_ZERO_AMOUNT (u101)
    expect(response.result).toBeErr(Cl.uint(101));
  });

  it("removes participant when they withdraw all funds", () => {
    const depositAmount = 1000000;
    
    // Deposit
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(depositAmount)],
      address1
    );
    
    // Check participant is active
    let isActive = simnet.callReadOnlyFn(
      "pool-manager",
      "is-active-participant",
      [Cl.principal(address1)],
      address1
    );
    expect(isActive.result).toBeBool(true);
    
    // Withdraw all funds
    simnet.callPublicFn(
      "pool-manager",
      "withdraw-all",
      [],
      address1
    );
    
    // Check participant is no longer active
    isActive = simnet.callReadOnlyFn(
      "pool-manager",
      "is-active-participant",
      [Cl.principal(address1)],
      address1
    );
    expect(isActive.result).toBeBool(false);
    
    // Check participant count decreased
    const count = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-count",
      [],
      address1
    );
    expect(count.result).toBeUint(0);
    
    // Check balance is zero
    const balance = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-balance",
      [Cl.principal(address1)],
      address1
    );
    expect(balance.result).toBeUint(0);
  });

  it("verifies contract STX balance matches pool size", () => {
    const deposit1 = 1000000;
    const deposit2 = 2000000;
    
    // Multiple deposits
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(deposit1)],
      address1
    );
    
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(deposit2)],
      address2
    );
    
    // Check contract balance equals pool size
    const contractBalance = simnet.callReadOnlyFn(
      "pool-manager",
      "get-contract-stx-balance",
      [],
      address1
    );
    
    const poolSize = simnet.callReadOnlyFn(
      "pool-manager",
      "get-total-pool-size",
      [],
      address1
    );
    
    expect(contractBalance.result).toBeUint(deposit1 + deposit2);
    expect(poolSize.result).toBeUint(deposit1 + deposit2);
  });
});