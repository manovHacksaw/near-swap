import anyTest from 'ava';
import { Worker } from 'near-workspaces';
import { setDefaultResultOrder } from 'dns'; setDefaultResultOrder('ipv4first'); // temp fix for node >v17

/**
 *  @typedef {import('near-workspaces').NearAccount} NearAccount
 *  @type {import('ava').TestFn<{worker: Worker, accounts: Record<string, NearAccount>}>}
 */
const test = anyTest;

test.beforeEach(async t => {
  // Create sandbox
  const worker = t.context.worker = await Worker.init();

  // Deploy contract
  const root = worker.rootAccount;
  const contract = await root.createSubAccount('test-account');

  // Get wasm file path from package.json test script in folder above
  await contract.deploy(
    process.argv[2],
  );

  // Save state for test runs, it is unique for each test
  t.context.accounts = { root, contract };
});

test.afterEach.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log('Failed to stop the Sandbox:', error);
  });
});

test('get_user returns null for non-existent user', async (t) => {
  const { contract } = t.context.accounts;
  const user = await contract.view('get_user', { accountId: 'alice.testnet' });
  t.is(user, null);
});

test('user can place a bet', async (t) => {
  const { root, contract } = t.context.accounts;
  
  // Place a bet with 1 NEAR (10^24 yoctoNEAR)
  const betAmount = '1000000000000000000000000'; // 1 NEAR in yoctoNEAR
  await root.call(contract, 'bet', {}, { attachedDeposit: betAmount });
  
  // Check user stats
  const user = await contract.view('get_user', { accountId: root.accountId });
  t.is(user.totalBet.toString(), betAmount);
  t.is(user.winnings.toString(), '2000000000000000000000000'); // 2x the bet
});

test('user can withdraw winnings', async (t) => {
  const { root, contract } = t.context.accounts;
  
  // First place a bet
  const betAmount = '1000000000000000000000000'; // 1 NEAR
  await root.call(contract, 'bet', {}, { attachedDeposit: betAmount });
  
  // Check initial balance
  const initialBalance = await root.availableBalance();
  
  // Withdraw winnings
  await root.call(contract, 'withdraw', {});
  
  // Check that winnings were reset
  const user = await contract.view('get_user', { accountId: root.accountId });
  t.is(user.winnings.toString(), '0');
  
  // Check that balance increased (should have received 2 NEAR)
  const finalBalance = await root.availableBalance();
  t.true(finalBalance > initialBalance);
});

test('multiple bets accumulate correctly', async (t) => {
  const { root, contract } = t.context.accounts;
  
  // Place first bet
  const bet1 = '1000000000000000000000000'; // 1 NEAR
  await root.call(contract, 'bet', {}, { attachedDeposit: bet1 });
  
  // Place second bet
  const bet2 = '500000000000000000000000'; // 0.5 NEAR
  await root.call(contract, 'bet', {}, { attachedDeposit: bet2 });
  
  // Check accumulated stats
  const user = await contract.view('get_user', { accountId: root.accountId });
  const expectedTotalBet = BigInt(bet1) + BigInt(bet2);
  const expectedWinnings = expectedTotalBet * BigInt(2);
  
  t.is(user.totalBet.toString(), expectedTotalBet.toString());
  t.is(user.winnings.toString(), expectedWinnings.toString());
});

test('withdraw with no winnings does nothing', async (t) => {
  const { root, contract } = t.context.accounts;
  
  // Try to withdraw without placing any bets
  await root.call(contract, 'withdraw', {});
  
  // Check that user still has no winnings
  const user = await contract.view('get_user', { accountId: root.accountId });
  t.is(user.winnings.toString(), '0');
});