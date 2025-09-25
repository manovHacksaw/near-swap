import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupNightly } from "@near-wallet-selector/nightly";

// Contract configuration
// Updated contract with comprehensive user statistics
export const CONTRACT_ID = "game-v0.testnet";
export const NETWORK = "testnet";

// Initialize wallet selector
export const initWalletSelector = async () => {
  const selector = await setupWalletSelector({
    network: NETWORK,
    modules: [
      setupMyNearWallet(),
      setupSender(),
      setupHereWallet(),
      setupMeteorWallet(),
      setupNightly(),
    ],
  });

  const modal = setupModal(selector, {
    contractId: CONTRACT_ID,
  });

  return { selector, modal };
};

// Contract methods
export const CONTRACT_METHODS = {
  place_bet: "place_bet",
  withdraw: "withdraw", 
  get_user_stats: "get_user_stats",
  get_contract_total_losses: "get_contract_total_losses",
  get_total_users: "get_total_users",
} as const;

// Utility functions
export const formatNEAR = (yoctoNEAR: string): string => {
  return (parseFloat(yoctoNEAR) / 1e24).toFixed(4);
};

export const parseNEAR = (near: string): string => {
  // Convert to yoctoNEAR without scientific notation
  const amount = parseFloat(near);
  
  // Use string manipulation to avoid floating point precision issues
  const amountStr = amount.toString();
  const [integerPart, decimalPart = ''] = amountStr.split('.');
  
  // Pad decimal part to 24 digits
  const paddedDecimal = decimalPart.padEnd(24, '0').slice(0, 24);
  
  // Combine integer and decimal parts
  const yoctoNEAR = integerPart + paddedDecimal;
  
  return yoctoNEAR;
};
