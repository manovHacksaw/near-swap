"use client";

import { setupBitteWallet } from "@near-wallet-selector/bitte-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";

interface NetworkContextType {
  network: "testnet" | "mainnet";
  setNetwork: (network: "testnet" | "mainnet") => void;
}


const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("mainnet");

  // Load network preference from localStorage
  useEffect(() => {
    const savedNetwork = localStorage.getItem("near-network") as "testnet" | "mainnet" | null;
    if (savedNetwork && (savedNetwork === "testnet" || savedNetwork === "mainnet")) {
      setNetwork(savedNetwork);
    }
  }, []);

  // Save network preference to localStorage
  useEffect(() => {
    localStorage.setItem("near-network", network);
  }, [network]);

  const walletSelectorConfig = {
    network: network,
    // Optional: createAccessKeyFor: "hello.near-examples.testnet",
    modules: [
      setupBitteWallet(),
      setupMeteorWallet(),
      setupLedger(),
      setupNightly()
    ] as any,
  };

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      <WalletSelectorProvider config={walletSelectorConfig}>
        {children}
      </WalletSelectorProvider>
    </NetworkContext.Provider>
  );
}
