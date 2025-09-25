"use client";

import React, { createContext, useContext } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useWallet } from "./WalletContext";

const CONTRACT_ID = "game-v0.testnet";

type ContractContextType = {
  getUserStats: (accountId: string) => Promise<any>;
  withdraw: () => Promise<string>;
  getAllUsers: () => Promise<any[]>;
};

const ContractContext = createContext<ContractContextType | undefined>(undefined);

export const ContractProvider = ({ children }: { children: React.ReactNode }) => {
  const { viewFunction } = useWalletSelector();
  const { selector, accountId } = useWallet();

  const getAllUsers = async(): Promise<any[]> => {
    try {
      const users = await viewFunction({
        contractId: CONTRACT_ID,
        method: "get_all_users",
        args: {},
      })
      console.log("Users:", users);
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error("Failed to fetch users:", error);
      return [];
    }
  }
  

  const getUserStats = async (accountId: string) => {
    try {
      const stats = await viewFunction({
        contractId: CONTRACT_ID,
        method: "get_user_stats",
        args: { accountId }, // ✅ param name must match contract exactly
      });
      console.log("User stats:", stats);
      return stats;
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      return null;
    }
  };

  const withdraw = async (): Promise<string> => {
    try {
      console.log("💰 Starting withdrawal process...");
      
      if (!selector || !accountId) {
        throw new Error("No account connected");
      }
      
      const wallet = await selector.wallet();
      const account = selector.store.getState().accounts[0];
      
      if (!account) {
        throw new Error("No account found in wallet");
      }
      
      const result = await wallet.signAndSendTransaction({
        signerId: account.accountId,
        receiverId: CONTRACT_ID,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'withdraw',
              args: {},
              gas: '300000000000000', // 300 TGas
              deposit: '0',
            },
          },
        ],
      });
      
      console.log("✅ Withdrawal transaction successful:", result.transaction.hash);
      return result.transaction.hash;
    } catch (error: any) {
      console.error("❌ Error withdrawing:", error);
      throw new Error(error.message || 'Failed to withdraw');
    }
  };

  return (
    <ContractContext.Provider value={{ getUserStats, withdraw, getAllUsers }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const ctx = useContext(ContractContext);
  if (!ctx) throw new Error("useContract must be used inside ContractProvider");
  return ctx;
};
