"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { WalletSelector } from "@near-wallet-selector/core";
import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupLedger } from "@near-wallet-selector/ledger";
import { CONTRACT_ID } from "@/near.config";
import { providers, utils } from "near-api-js";
import { balanceCache } from "@/lib/balanceCache";

interface WalletContextType {
  selector: WalletSelector | null;
  modal: any;
  accountId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  balance: string;
  isBalanceLoading: boolean;
  connect: () => void;
  disconnect: () => Promise<void>;
  getBalance: () => Promise<string>;
  refreshBalance: () => Promise<void>;
  invalidateBalanceCache: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<any>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<string>("0.00");
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);

  const getBalance = useCallback(async (): Promise<string> => {
    if (!selector || !accountId) {
      console.log("🔍 getBalance: No selector or accountId", { selector: !!selector, accountId });
      return "0.00";
    }

    try {
      // Check cache first
      const cachedBalance = balanceCache.getCachedBalance(accountId);
      if (cachedBalance) {
        return cachedBalance;
      }

      console.log("🔍 Fetching fresh balance for account:", accountId);
      
      // Use the wallet's built-in balance fetching method first
      try {
        const wallet = await selector.wallet();
        if (wallet && typeof wallet.getAccounts === 'function') {
          const accounts = await wallet.getAccounts();
          const currentAccount = accounts.find(acc => acc.accountId === accountId);
          if (currentAccount && currentAccount.balance) {
            const formattedBalance = utils.format.formatNearAmount(currentAccount.balance, 2);
            console.log("🔍 Balance from wallet:", formattedBalance);
            balanceCache.setCachedBalance(accountId, formattedBalance);
            return formattedBalance;
          }
        }
      } catch (walletError) {
        console.warn("⚠️ Wallet balance fetch failed, trying API:", walletError);
      }
      
      // Use our API route for production (handles CORS)
      try {
        console.log("🔍 Trying API route for balance...");
        const response = await fetch('/api/balance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountId })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("🔍 Balance from API:", data.balance);
          balanceCache.setCachedBalance(accountId, data.balance);
          return data.balance;
        } else {
          console.warn("⚠️ API balance fetch failed, trying direct RPC");
        }
      } catch (apiError) {
        console.warn("⚠️ API balance fetch failed, trying direct RPC:", apiError);
      }
      
      // Fallback to direct RPC with better error handling
      const rpcEndpoints = [
        'https://near-testnet.api.pagoda.co/rpc/v1', // Pagoda - usually more reliable
        'https://testnet-rpc.near.org', // Official backup
        'https://rpc.testnet.near.org', // Official (deprecated but still works sometimes)
        'https://near-testnet.lava.build', // Lava RPC
        'https://testnet.nearapi.org' // Alternative provider
      ];
      
      let lastError;
      for (const endpoint of rpcEndpoints) {
        try {
          console.log("🔍 Trying RPC endpoint:", endpoint);
          const provider = new providers.JsonRpcProvider({ 
            url: endpoint,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          const res: any = await provider.query({
            request_type: "view_account",
            account_id: accountId,
            finality: "final",
          });
          
          console.log("🔍 Raw balance response:", res);
          const formattedBalance = utils.format.formatNearAmount(res.amount, 2);
          console.log("🔍 Formatted balance:", formattedBalance);
          balanceCache.setCachedBalance(accountId, formattedBalance);
          return formattedBalance;
        } catch (error: any) {
          console.warn(`⚠️ RPC endpoint ${endpoint} failed:`, error.message);
          lastError = error;
          
          // If it's a rate limit error, wait before trying next endpoint
          if (error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
            console.log("⏳ Rate limited, waiting 3 seconds...");
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          continue;
        }
      }
      
      // If all endpoints failed, throw the last error
      throw lastError;
    } catch (err) {
      console.error("❌ Failed to fetch balance from all endpoints:", err);
      return "0.00";
    }
  }, [selector, accountId]);

  const refreshBalance = useCallback(async (): Promise<void> => {
    if (!accountId) {
      console.log("🔍 refreshBalance: No accountId, setting balance to 0.00");
      setBalance("0.00");
      setIsBalanceLoading(false);
      return;
    }
    
    try {
      console.log("🔍 refreshBalance: Fetching new balance...");
      setIsBalanceLoading(true);
      const newBalance = await getBalance();
      console.log("🔍 refreshBalance: Setting balance to:", newBalance);
      setBalance(newBalance);
    } catch (err) {
      console.error("❌ Failed to refresh balance:", err);
      setBalance("0.00");
    } finally {
      setIsBalanceLoading(false);
    }
  }, [accountId, getBalance]);

  // Function to invalidate balance cache (useful after transactions)
  const invalidateBalanceCache = useCallback(() => {
    if (accountId) {
      balanceCache.invalidateAccount(accountId);
      console.log("🗑️ Balance cache invalidated for account:", accountId);
    }
  }, [accountId]);

  useEffect(() => {
    const init = async () => {
      try {
        const walletSelector = await setupWalletSelector({
          network: "testnet",
          modules: [
          
            setupMyNearWallet(),
            setupSender(),
            setupHereWallet(),
            setupMeteorWallet(),
            setupNightly(),
            setupLedger(),
          ],
        });

        const walletModal = setupModal(walletSelector, { contractId: CONTRACT_ID });

        setSelector(walletSelector);
        setModal(walletModal);

        // Init state
        const state = walletSelector.store.getState();
        if (state.accounts.length > 0) {
          setAccountId(state.accounts[0].accountId);
        }

        // Subscribe to store updates
        const subscription = walletSelector.store.observable.subscribe((newState) => {
          const acc = newState.accounts[0];
          setAccountId(acc?.accountId || null);
        });

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error("Wallet init error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // Auto-refresh balance when account changes
  useEffect(() => {
    console.log("🔍 Balance effect triggered, accountId:", accountId);
    if (accountId) {
      console.log("🔍 Account connected, refreshing balance...");
      refreshBalance();
      // Set up periodic balance refresh every 5 minutes to avoid rate limiting
      const interval = setInterval(() => {
        console.log("🔍 Periodic balance refresh...");
        refreshBalance();
      }, 300000); // 5 minutes
      return () => {
        console.log("🔍 Clearing balance refresh interval");
        clearInterval(interval);
      };
    } else {
      console.log("🔍 No account, setting balance to 0.00");
      setBalance("0.00");
    }
  }, [accountId, refreshBalance]);

  const connect = () => {
    if (modal) modal.show();
  };

  const disconnect = async () => {
    if (!selector) return;
    try {
      const wallet = await selector.wallet();
      await wallet.signOut();
      setAccountId(null);
    } catch (err) {
      console.error("Failed to disconnect:", err);
    }
  };

  const value: WalletContextType = {
    selector,
    modal,
    accountId,
    isConnected: !!accountId,
    isLoading,
    balance,
    isBalanceLoading,
    connect,
    disconnect,
    getBalance,
    refreshBalance,
    invalidateBalanceCache,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
