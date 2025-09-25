/**
 * Currency Utilities
 * 
 * Handles NEAR currency formatting and conversions to USD/INR
 * Uses real-time exchange rates from CoinGecko and ExchangeRate-API
 */

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = {
  NEAR_TO_USD: 3.05, // Default fallback rate
  USD_TO_INR: 88.81, // Default fallback rate
  lastUpdated: 0,
  cacheDuration: 60000, // 1 minute cache
};

/**
 * Fetch real-time exchange rates from APIs
 */
async function fetchExchangeRates(): Promise<{ NEAR_TO_USD: number; USD_TO_INR: number }> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if (now - exchangeRatesCache.lastUpdated < exchangeRatesCache.cacheDuration) {
    return {
      NEAR_TO_USD: exchangeRatesCache.NEAR_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }

  try {
    // Fetch NEAR to USD rate from CoinGecko
    const nearResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd');
    const nearData = await nearResponse.json();
    const nearToUsd = nearData.near?.usd || exchangeRatesCache.NEAR_TO_USD;

    // Fetch USD to INR rate from ExchangeRate-API
    const usdResponse = await fetch('https://open.er-api.com/v6/latest/USD');
    const usdData = await usdResponse.json();
    const usdToInr = usdData.rates?.INR || exchangeRatesCache.USD_TO_INR;

    // Update cache
    exchangeRatesCache = {
      NEAR_TO_USD: nearToUsd,
      USD_TO_INR: usdToInr,
      lastUpdated: now,
      cacheDuration: 60000, // 1 minute cache
    };

    console.log(`🔄 Updated exchange rates: 1 NEAR = $${nearToUsd}, 1 USD = ₹${usdToInr}`);
    
    return { NEAR_TO_USD: nearToUsd, USD_TO_INR: usdToInr };
  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates, using cached values:', error);
    return {
      NEAR_TO_USD: exchangeRatesCache.NEAR_TO_USD,
      USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    };
  }
}

export interface CurrencyDisplay {
  near: string;
  usd: string;
  inr: string;
}

/**
 * Format NEAR amount with proper decimal places
 */
export function formatNEAR(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  return num.toFixed(2);
}

/**
 * Convert NEAR to USD (synchronous - uses cached rates)
 */
export function nearToUSD(nearAmount: string | number): number {
  const near = typeof nearAmount === 'string' ? parseFloat(nearAmount) : nearAmount;
  if (isNaN(near)) return 0;
  return near * exchangeRatesCache.NEAR_TO_USD;
}

/**
 * Convert NEAR to INR (synchronous - uses cached rates)
 */
export function nearToINR(nearAmount: string | number): number {
  const near = typeof nearAmount === 'string' ? parseFloat(nearAmount) : nearAmount;
  if (isNaN(near)) return 0;
  return near * exchangeRatesCache.NEAR_TO_USD * exchangeRatesCache.USD_TO_INR;
}

/**
 * Convert NEAR to USD (async - fetches latest rates)
 */
export async function nearToUSDLive(nearAmount: string | number): Promise<number> {
  const near = typeof nearAmount === 'string' ? parseFloat(nearAmount) : nearAmount;
  if (isNaN(near)) return 0;
  const rates = await fetchExchangeRates();
  return near * rates.NEAR_TO_USD;
}

/**
 * Convert NEAR to INR (async - fetches latest rates)
 */
export async function nearToINRLive(nearAmount: string | number): Promise<number> {
  const near = typeof nearAmount === 'string' ? parseFloat(nearAmount) : nearAmount;
  if (isNaN(near)) return 0;
  const rates = await fetchExchangeRates();
  return near * rates.NEAR_TO_USD * rates.USD_TO_INR;
}

/**
 * Format USD amount
 */
export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format INR amount
 */
export function formatINR(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/**
 * Get all currency displays for a NEAR amount
 */
export function getCurrencyDisplay(nearAmount: string | number): CurrencyDisplay {
  const near = formatNEAR(nearAmount);
  const usd = formatUSD(nearToUSD(nearAmount));
  const inr = formatINR(nearToINR(nearAmount));
  
  return { near, usd, inr };
}

/**
 * Format NEAR with conversion display
 */
export function formatNEARWithConversion(nearAmount: string | number, showConversion: boolean = true): string {
  const near = formatNEAR(nearAmount);
  if (!showConversion) return `${near} NEAR`;
  
  const usd = nearToUSD(nearAmount);
  const inr = nearToINR(nearAmount);
  
  return `${near} NEAR (${formatUSD(usd)} / ${formatINR(inr)})`;
}

/**
 * Format currency for display in game UI
 */
export function formatGameCurrency(nearAmount: string | number): string {
  const near = formatNEAR(nearAmount);
  const usd = nearToUSD(nearAmount);
  
  return `${near} NEAR (${formatUSD(usd)})`;
}

/**
 * Format currency for display in stats
 */
export function formatStatsCurrency(nearAmount: string | number): string {
  const near = formatNEAR(nearAmount);
  const usd = nearToUSD(nearAmount);
  const inr = nearToINR(nearAmount);
  
  return `${near} NEAR`;
}

/**
 * Get conversion text for tooltips
 */
export function getConversionText(nearAmount: string | number): string {
  const usd = nearToUSD(nearAmount);
  const inr = nearToINR(nearAmount);
  
  return `${formatUSD(usd)} / ${formatINR(inr)}`;
}

/**
 * Get conversion text for tooltips (async - fetches latest rates)
 */
export async function getConversionTextLive(nearAmount: string | number): Promise<string> {
  const usd = await nearToUSDLive(nearAmount);
  const inr = await nearToINRLive(nearAmount);
  
  return `${formatUSD(usd)} / ${formatINR(inr)}`;
}

/**
 * Initialize exchange rates (call this on app startup)
 */
export async function initializeExchangeRates(): Promise<void> {
  try {
    await fetchExchangeRates();
    console.log('✅ Exchange rates initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize exchange rates:', error);
  }
}

/**
 * Get current exchange rates (for debugging/monitoring)
 */
export function getCurrentExchangeRates(): { NEAR_TO_USD: number; USD_TO_INR: number; lastUpdated: number } {
  return {
    NEAR_TO_USD: exchangeRatesCache.NEAR_TO_USD,
    USD_TO_INR: exchangeRatesCache.USD_TO_INR,
    lastUpdated: exchangeRatesCache.lastUpdated,
  };
}
