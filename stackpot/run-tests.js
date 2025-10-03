import { initSimnet } from '@hirosystems/clarinet-sdk';
import { Cl, ClarityType } from '@stacks/transactions';

async function runTests() {
  console.log("🧪 Running StackPot Tests...\n");
  
  const simnet = await initSimnet('./Clarinet.toml');
  const accounts = simnet.getAccounts();
  
  const address1 = accounts.get("wallet_1");
  const address2 = accounts.get("wallet_2");
  const deployer = accounts.get("deployer");
  
  let testsPassed = 0;
  let testsFailed = 0;
  
  // Test 1: Deposit STX
  console.log("Test 1: User can deposit STX");
  try {
    const depositAmount = 1000000n;
    const result = simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(depositAmount)],
      address1
    );
    
    // Check if result is Ok response (type 7 is ResponseOk)
    if (result.result.type === ClarityType.ResponseOk && 
        result.result.value.value === depositAmount) {
      console.log("✅ Deposit successful");
      testsPassed++;
    } else {
      console.log("❌ Deposit failed - Result:", result.result);
      testsFailed++;
    }
  } catch (e) {
    console.log("❌ Test failed:", e.message);
    testsFailed++;
  }
  
  // Test 2: Check balance
  console.log("\nTest 2: Check participant balance");
  try {
    const balance = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-balance",
      [Cl.principal(address1)],
      address1
    );
    
    console.log("✅ Balance retrieved:", balance.result.value);
    testsPassed++;
  } catch (e) {
    console.log("❌ Test failed:", e.message);
    testsFailed++;
  }
  
  // Test 3: Multiple participants
  console.log("\nTest 3: Multiple participants can deposit");
  try {
    simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(2000000n)],
      address2
    );
    
    const count = simnet.callReadOnlyFn(
      "pool-manager",
      "get-participant-count",
      [],
      address1
    );
    
    console.log("✅ Participant count:", count.result.value);
    testsPassed++;
  } catch (e) {
    console.log("❌ Test failed:", e.message);
    testsFailed++;
  }
  
  // Test 4: Withdrawal
  console.log("\nTest 4: User can withdraw");
  try {
    const result = simnet.callPublicFn(
      "pool-manager",
      "withdraw",
      [Cl.uint(500000n)],
      address1
    );
    
    if (result.result.type === ClarityType.ResponseOk) {
      console.log("✅ Withdrawal successful");
      testsPassed++;
    } else {
      console.log("❌ Withdrawal failed");
      testsFailed++;
    }
  } catch (e) {
    console.log("❌ Test failed:", e.message);
    testsFailed++;
  }
  
  // Test 5: Pool size verification
  console.log("\nTest 5: Pool size matches deposits");
  try {
    const poolSize = simnet.callReadOnlyFn(
      "pool-manager",
      "get-total-pool-size",
      [],
      address1
    );
    
    const contractBalance = simnet.callReadOnlyFn(
      "pool-manager",
      "get-contract-stx-balance",
      [],
      address1
    );
    
    if (poolSize.result.value === contractBalance.result.value) {
      console.log("✅ Pool size matches contract balance");
      testsPassed++;
    } else {
      console.log("❌ Balance mismatch");
      console.log("  Pool size:", poolSize.result.value);
      console.log("  Contract balance:", contractBalance.result.value);
      testsFailed++;
    }
  } catch (e) {
    console.log("❌ Test failed:", e.message);
    testsFailed++;
  }
  
  // Test 6: Prevent overdraft
  console.log("\nTest 6: Prevent overdraft");
  try {
    const result = simnet.callPublicFn(
      "pool-manager",
      "withdraw",
      [Cl.uint(10000000n)], // Try to withdraw 10 STX (more than balance)
      address1
    );
    
    if (result.result.type === ClarityType.ResponseErr && 
        result.result.value.value === 100n) {
      console.log("✅ Overdraft prevented correctly");
      testsPassed++;
    } else {
      console.log("❌ Overdraft not prevented properly");
      testsFailed++;
    }
  } catch (e) {
    console.log("❌ Test failed:", e.message);
    testsFailed++;
  }
  
  // Test 7: Zero deposit prevention
  console.log("\nTest 7: Prevent zero deposits");
  try {
    const result = simnet.callPublicFn(
      "pool-manager",
      "deposit",
      [Cl.uint(0n)],
      address1
    );
    
    if (result.result.type === ClarityType.ResponseErr && 
        result.result.value.value === 101n) {
      console.log("✅ Zero deposit prevented");
      testsPassed++;
    } else {
      console.log("❌ Zero deposit not prevented");
      testsFailed++;
    }
  } catch (e) {
    console.log("❌ Test failed:", e.message);
    testsFailed++;
  }
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log("=".repeat(50));
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(console.error);