import { pool } from '../config/db';

export interface ExchangeRate {
    id: number;
    currency_code: string;
    rate: number;
    updated_at: Date;
}

export async function findAllRates(): Promise<ExchangeRate[]> {
    const result = await pool.query('SELECT * FROM exchange_rates ORDER BY currency_code');
    return result.rows;
}

export async function updateRate(currencyCode: string, rate: number): Promise<void> {
    await pool.query(
        `INSERT INTO exchange_rates (currency_code, rate, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (currency_code) DO UPDATE SET
       rate = EXCLUDED.rate,
       updated_at = EXCLUDED.updated_at`,
        [currencyCode.toUpperCase(), rate]
    );
}

export async function getRate(currencyCode: string): Promise<number | null> {
    if (currencyCode.toUpperCase() === 'USD') return 1.0;
    const result = await pool.query('SELECT rate FROM exchange_rates WHERE currency_code = $1', [currencyCode.toUpperCase()]);
    return result.rows[0]?.rate || null;
}

export async function convertPrice(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const fromRate = await getRate(fromCurrency);
    const toRate = await getRate(toCurrency);

    if (fromRate === null || toRate === null) {
        throw new Error(`Exchange rate not found for ${fromRate === null ? fromCurrency : toCurrency}`);
    }

    // Convert fromSource -> USD -> toTarget
    const amountInUsd = amount / fromRate;
    return amountInUsd * toRate;
}
