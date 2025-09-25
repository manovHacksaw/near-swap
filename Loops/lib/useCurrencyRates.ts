/**
 * React hook for real-time currency rates
 */

import { useState, useEffect } from 'react';
import { 
  getCurrentExchangeRates, 
  initializeExchangeRates,
  getConversionTextLive,
  type CurrencyDisplay 
} from './currencyUtils';

export interface CurrencyRates {
  NEAR_TO_USD: number;
  USD_TO_INR: number;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get current exchange rates with auto-refresh
 */
export function useCurrencyRates(refreshInterval: number = 60000): CurrencyRates {
  const [rates, setRates] = useState<CurrencyRates>({
    NEAR_TO_USD: 3.05, // Default fallback
    USD_TO_INR: 88.81, // Default fallback
    lastUpdated: 0,
    isLoading: true,
    error: null,
  });

  const updateRates = async () => {
    try {
      setRates(prev => ({ ...prev, isLoading: true, error: null }));
      await initializeExchangeRates();
      const currentRates = getCurrentExchangeRates();
      setRates({
        ...currentRates,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setRates(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rates',
      }));
    }
  };

  useEffect(() => {
    // Initial load
    updateRates();

    // Set up auto-refresh
    const interval = setInterval(updateRates, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return rates;
}

/**
 * Hook to get live conversion text for a NEAR amount
 */
export function useLiveConversion(nearAmount: string | number): {
  conversionText: string;
  isLoading: boolean;
  error: string | null;
} {
  const [conversionText, setConversionText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const text = await getConversionTextLive(nearAmount);
        setConversionText(text);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conversion');
        setIsLoading(false);
      }
    };

    if (nearAmount && nearAmount !== '0') {
      fetchConversion();
    } else {
      setConversionText('');
      setIsLoading(false);
    }
  }, [nearAmount]);

  return { conversionText, isLoading, error };
}
