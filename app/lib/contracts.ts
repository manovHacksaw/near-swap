export const getContractAddresses = (network: "testnet" | "mainnet") => {
  if (network === "mainnet") {
    return {
      intents: "intents.near",
      wrap: "wrap.near",
    };
  } else {
    // For testnet, we need to use different addresses or skip intents functionality
    return {
      intents: "intents.testnet", // This might not exist
      wrap: "wrap.testnet",
    };
  }
};

export const isIntentsAvailable = (network: "testnet" | "mainnet") => {
  // Intents might only be available on mainnet
  return network === "mainnet";
};
