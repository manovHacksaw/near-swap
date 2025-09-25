// SPDX-License-Identifier: MIT
// SecureGames - flat storage, resolver-only resolution, claimable winnings
import {
  NearBindgen,
  near,
  call,
  view,
  assert,
  UnorderedMap,
  initialize
} from "near-sdk-js";

// --------------------
// Data models
// --------------------
class UserStats {
  totalBet: bigint = BigInt(0);
  totalWon: bigint = BigInt(0);
  totalLost: bigint = BigInt(0);
  withdrawableBalance: bigint = BigInt(0);
  gamesPlayed: number = 0;
  gamesWon: number = 0;
  joinDate: bigint = BigInt(0);
  lastPlayDate: bigint = BigInt(0);
  lastPlayTimestamp: bigint = BigInt(0); 
}

class GameTypeStats {
  gameType: string = "";
  totalBets: bigint = BigInt(0);
  totalWon: bigint = BigInt(0);
  totalLost: bigint = BigInt(0);
  timestamp: bigint = BigInt(0); //
  gamesPlayed: number = 0;
  gamesWon: number = 0;
  bestMultiplierPercent: number = 0; // integer percent, e.g., 150 = 1.5x
  totalMultiplierPercent: number = 0;

  constructor(gameType: string = "") {
    this.gameType = gameType;
  }
}

enum GameStatus {
  Pending,
  Won,
  Lost
}

class Game {
  player: string = "";
  amount: bigint = BigInt(0);
  status: GameStatus = GameStatus.Pending;
  blockHeight: bigint = BigInt(0);
  gameType: string = "unknown";
  multiplierPercent: number = 100; // default 100% (1x)

  constructor(player: string, amount: bigint, blockHeight: bigint, gameType: string = "unknown") {
    this.player = player;
    this.amount = amount;
    this.blockHeight = blockHeight;
    this.gameType = gameType;
  }
}

// --------------------
// Contract
// --------------------
@NearBindgen({})
export class SecureGames {
  // account allowed to resolve games
  resolverAccountId: string;

  // storage maps (flat keys)
  users: UnorderedMap<UserStats>;
  games: UnorderedMap<Game>;
  // flattened userGameStats keyed by `${accountId}|${gameType}`
  userGameStats: UnorderedMap<GameTypeStats>;

  constructor() {
    // initialize prefixes here to ensure proper reconstruction
    this.resolverAccountId = "";
    this.users = new UnorderedMap<UserStats>("u"); // users: key = accountId
    this.games = new UnorderedMap<Game>("g"); // games: key = gameId
    this.userGameStats = new UnorderedMap<GameTypeStats>("ugs"); // flattened stats
  }

  // initialize once after deployment (deployer calls)
  @initialize({ privateFunction: true })
  init({ resolverAccountId }: { resolverAccountId: string }): void {
    assert(resolverAccountId !== "", "resolverAccountId required");
    this.resolverAccountId = resolverAccountId;
  }

  // --------------------
  // Internal helpers
  // --------------------
  private getUser(accountId: string): UserStats {
    let user = this.users.get(accountId);
    if (user === null) {
      user = new UserStats();
      user.joinDate = near.blockHeight();
    }
    return user;
  }

  private setUser(accountId: string, user: UserStats): void {
    this.users.set(accountId, user);
  }

  private makeUserGameKey(accountId: string, gameType: string): string {
    // delimiter '|' is safe if you don't allow '|' in gameType
    return `${accountId}|${gameType}`;
  }

  private getGameTypeStats(accountId: string, gameType: string): GameTypeStats {
    const key = this.makeUserGameKey(accountId, gameType);
    let s = this.userGameStats.get(key);
    if (s === null) {
      s = new GameTypeStats(gameType);
    }
    return s;
  }

  private setGameTypeStats(accountId: string, gameType: string, stats: GameTypeStats): void {
    const key = this.makeUserGameKey(accountId, gameType);
    this.userGameStats.set(key, stats);
  }

  // --------------------
  // Call methods
  // --------------------

  /**
   * Player starts a game by attaching NEAR. The attached deposit is held by contract (pool).
   * gameId must be unique.
   * gameType is optional for categorization.
   */
  @call({ payableFunction: true })
  start_game({ gameId, gameType }: { gameId: string; gameType?: string }): void {
    const caller = near.predecessorAccountId();
    const bet = near.attachedDeposit();
    assert(bet > BigInt(0), "Attach NEAR to play");
    assert(gameId && gameId.length > 0, "gameId required");

    // ensure unique gameId
    assert(this.games.get(gameId) === null, "gameId already exists");

    const g = new Game(caller, bet, near.blockHeight(), gameType || "unknown");
    this.games.set(gameId, g);

    // update minimal user info
    const user = this.getUser(caller);
    user.lastPlayDate = near.blockHeight();
    this.setUser(caller, user);

    near.log(`${caller} started game ${gameId} (${g.gameType}) with ${bet.toString()} yoctoNEAR`);
  }

  /**
   * Trusted resolver sets game outcome.
   * - didWin: if true, credit winnings to user's withdrawableBalance (but funds remain in contract).
   * - multiplierPercent: integer percent e.g., 150 = 1.5x. Must be >=100 if win.
   *
   * Only resolverAccountId can call this.
   */
  @call({})
  resolve_game({ gameId, didWin, multiplierPercent }: { gameId: string; didWin: boolean; multiplierPercent?: number }): void {
    assert(near.predecessorAccountId() === this.resolverAccountId, "Only resolver can call this method");
    assert(gameId && gameId.length > 0, "gameId required");

    const game = this.games.get(gameId);
    assert(game !== null, "Game not found");
    assert(game.status === GameStatus.Pending, "Game already resolved");

    const player = game.player;
    const gameType = game.gameType || "unknown";

    // defensive: default multiplierPercent to 100 (no winnings) if not provided
    const mult = multiplierPercent === undefined ? 100 : multiplierPercent;
    assert(Number.isInteger(mult) && mult >= 0, "multiplierPercent must be an integer >= 0");

    game.multiplierPercent = mult;

    // Update user-level stats
    const user = this.getUser(player);
    user.totalBet += game.amount;
    user.gamesPlayed += 1;

    // Update gameTypeStats (flattened)
    const gts = this.getGameTypeStats(player, gameType);
    gts.totalBets += game.amount;
    gts.gamesPlayed += 1;
    gts.totalMultiplierPercent += mult;
    if (mult > gts.bestMultiplierPercent) {
      gts.bestMultiplierPercent = mult;
    }

    if (didWin) {
      // winnings = amount * multiplierPercent / 100
      const winnings = (game.amount * BigInt(mult)) / BigInt(100);
      user.totalWon += winnings;
      user.withdrawableBalance += winnings;
      user.gamesWon += 1;

      gts.totalWon += winnings;
      gts.gamesWon += 1;

      game.status = GameStatus.Won;

      near.log(`Resolved ${gameId}: ${player} WON. Bet ${game.amount.toString()} -> credited ${winnings.toString()}`);
    } else {
      // lost: contract keeps the amount (it already stored the deposit)
      user.totalLost += game.amount;
      gts.totalLost += game.amount;
      game.status = GameStatus.Lost;

      near.log(`Resolved ${gameId}: ${player} LOST. Bet ${game.amount.toString()} kept by pool`);
    }

    // persist updated structures
    this.setUser(player, user);
    this.games.set(gameId, game);
    this.setGameTypeStats(player, gameType, gts);
  }

  /**
   * Withdraw claimable winnings to caller.
   * Resets withdrawableBalance before transferring to avoid reentrancy.
   */
  @call({})
  withdraw(): void {
    const caller = near.predecessorAccountId();
    const user = this.getUser(caller);

    const amount = user.withdrawableBalance;
    assert(amount > BigInt(0), "Nothing to withdraw");

    // reset BEFORE transfer to prevent reentrancy
    user.withdrawableBalance = BigInt(0);
    this.setUser(caller, user);

    const p = near.promiseBatchCreate(caller);
    near.promiseBatchActionTransfer(p, amount);

    near.log(`${caller} withdrew ${amount.toString()} yoctoNEAR`);
  }

  // --------------------
  // View methods
  // --------------------
  @view({})
  get_user_stats({ accountId }: { accountId: string }): UserStats | null {
    const u = this.users.get(accountId);
    return u === null ? null : u;
  }

  @view({})
  // returns array of GameTypeStats for the given account
  get_user_game_stats({ accountId }: { accountId: string }): GameTypeStats[] {
    const out: GameTypeStats[] = [];
    // iterate keys in flattened map and filter for prefix
    const prefix = `${accountId}|`;
    const keys = this.userGameStats.keys({ start: 0, limit: 1000 });
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k.indexOf(prefix) === 0) {
        const stat = this.userGameStats.get(k);
        if (stat !== null) out.push(stat);
      }
    }
    return out;
  }

  @view({})
  get_game_details({ gameId }: { gameId: string }): Game | null {
    const g = this.games.get(gameId);
    return g === null ? null : g;
  }

  @view({})
  get_resolver_account(): string {
    return this.resolverAccountId;
  }

  @view({})
  get_pending_games(): string[] {
    const out: string[] = [];
    const keys = this.games.keys({ start: 0, limit: 1000 });
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const g = this.games.get(k);
      if (g !== null && g.status === GameStatus.Pending) out.push(k);
    }
    return out;
  }
  @view({})
get_all_users({ start = 0, limit = 50 }: { start?: number; limit?: number }): string[] {
  return this.users.keys({ start, limit });
}


  @view({})
  get_contract_stats(): any {
    let totalBets = BigInt(0);
    let totalWinnings = BigInt(0);
    let totalGames = 0;
    const ukeys = this.users.keys({ start: 0, limit: 1000 });
    for (let i = 0; i < ukeys.length; i++) {
      const a = ukeys[i];
      const u = this.users.get(a);
      if (u !== null) {
        totalBets += u.totalBet;
        totalWinnings += u.totalWon;
        totalGames += u.gamesPlayed;
      }
    }
    return {
      totalUsers: this.users.length,
      totalBets: totalBets.toString(),
      totalWinnings: totalWinnings.toString(),
      totalGames: totalGames
    };
  }
}
