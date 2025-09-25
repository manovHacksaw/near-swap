"use client";

import { useState, useEffect } from "react";

interface NetworkSelectorProps {
  onNetworkChange: (network: "testnet" | "mainnet") => void;
  currentNetwork: "testnet" | "mainnet";
}

export default function NetworkSelector({ onNetworkChange, currentNetwork }: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const networks = [
    { id: "testnet" as const, name: "Testnet", description: "NEAR Testnet" },
    { id: "mainnet" as const, name: "Mainnet", description: "NEAR Mainnet" }
  ];

  const currentNetworkInfo = networks.find(network => network.id === currentNetwork);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
      >
        <div className={`w-3 h-3 rounded-full ${currentNetwork === "mainnet" ? "bg-green-500" : "bg-yellow-500"}`}></div>
        <span className="text-sm font-medium text-gray-800 dark:text-white">
          {currentNetworkInfo?.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => {
                onNetworkChange(network.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                currentNetwork === network.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${network.id === "mainnet" ? "bg-green-500" : "bg-yellow-500"}`}></div>
                <div>
                  <div className="font-medium text-gray-800 dark:text-white text-sm">
                    {network.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {network.description}
                  </div>
                </div>
                {currentNetwork === network.id && (
                  <svg className="w-4 h-4 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
