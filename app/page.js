"use client";

import { useState, useMemo } from "react";

const KWH_PER_100KM = 16.9;
const KM_PER_MILE = 1.609344;
const KWH_PER_MILE = (KWH_PER_100KM / 100) * KM_PER_MILE;

const MPG_CITY = 18;
const MPG_HIGHWAY = 24;
const MPG_COMBINED = 1 / (0.55 / MPG_CITY + 0.45 / MPG_HIGHWAY);

function equivalentGasPrice(pricePerKWh, mpg) {
  return mpg * KWH_PER_MILE * pricePerKWh;
}

function fmtUSD(n) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Home() {
  const [pricePerKWh, setPricePerKWh] = useState("0.32");

  const price = parseFloat(pricePerKWh);

  const results = useMemo(() => {
    const evCostPerMile = KWH_PER_MILE * price;
    return {
      evCostPerMile,
      city: equivalentGasPrice(price, MPG_CITY),
      highway: equivalentGasPrice(price, MPG_HIGHWAY),
      combined: equivalentGasPrice(price, MPG_COMBINED),
    };
  }, [price]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6 border border-slate-200 dark:border-slate-700">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            EV vs Gas Price Calculator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tesla Model Y Long Range AWD (2020–2024) vs a gas car at 18 mpg
            city / 24 mpg highway.
          </p>
        </header>

        <div className="space-y-2">
          <label
            htmlFor="kwh-price"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Electricity price ($ per kWh)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
              $
            </span>
            <input
              id="kwh-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={pricePerKWh}
              onChange={(e) => setPricePerKWh(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            EV efficiency: {KWH_PER_100KM} kWh/100km ≈{" "}
            {KWH_PER_MILE.toFixed(3)} kWh/mile
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            EV cost per mile
          </div>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {Number.isFinite(results.evCostPerMile)
              ? `${(results.evCostPerMile * 100).toFixed(2)}¢ / mile`
              : "—"}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Equivalent gas price (per gallon)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ResultCard
              label="City"
              sub={`${MPG_CITY} mpg`}
              value={fmtUSD(results.city)}
            />
            <ResultCard
              label="Combined"
              sub={`${MPG_COMBINED.toFixed(1)} mpg`}
              value={fmtUSD(results.combined)}
              highlight
            />
            <ResultCard
              label="Highway"
              sub={`${MPG_HIGHWAY} mpg`}
              value={fmtUSD(results.highway)}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A gas car at this price-per-gallon would cost the same per mile to
            drive as the EV at your electricity rate.
          </p>
        </div>
      </div>
    </main>
  );
}

function ResultCard({ label, sub, value, highlight = false }) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>
    </div>
  );
}
