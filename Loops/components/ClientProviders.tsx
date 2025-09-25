"use client";

import { useEffect } from "react";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { CONTRACT_ID } from "@/near.config";
import { NetworkId } from "@near-wallet-selector/core";
import { WalletProvider } from "@/contexts/WalletContext";
import { UIProvider } from "@/contexts/UIContext";
import { ContractProvider } from "@/contexts/ContractProvider";
import { initializeExchangeRates } from "@/lib/currencyUtils";

const walletSelectorConfig = {
  network: "testnet" as NetworkId,
  contractId: CONTRACT_ID,
  modules: [
    setupMeteorWallet(),
    setupLedger(),
    setupSender(),
    setupHereWallet(),
    setupMyNearWallet(),
  ],
};

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize exchange rates on app startup
  useEffect(() => {
    initializeExchangeRates();
  }, []);

  return (
    <WalletSelectorProvider config={walletSelectorConfig}>
      <WalletProvider>
        <ContractProvider>
          <UIProvider>
            {children}
          </UIProvider>
        </ContractProvider>
      </WalletProvider>
    </WalletSelectorProvider>
  );
}
