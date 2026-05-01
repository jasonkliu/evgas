"use client";

import { useState, useMemo } from "react";

const KWH_PER_100KM = 16.9;
const KM_PER_MILE = 1.609344;
const KWH_PER_MILE = (KWH_PER_100KM / 100) * KM_PER_MILE;

const MPG_CITY = 18;
const MPG_HIGHWAY = 24;
const MPG_COMBINED = 1 / (0.55 / MPG_CITY + 0.45 / MPG_HIGHWAY);

const TANK_GALLONS = 14.3;

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

function fmtMiles(n) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", { maximumFractionDigits: 0 })} mi`;
}

export default function Home() {
  const [pricePerKWh, setPricePerKWh] = useState("0.32");
  const [pricePerGallon, setPricePerGallon] = useState("6.06");

  const kwh = parseFloat(pricePerKWh);
  const gas = parseFloat(pricePerGallon);

  const evResults = useMemo(() => {
    const evCostPerMile = KWH_PER_MILE * kwh;
    return {
      evCostPerMile,
      city: equivalentGasPrice(kwh, MPG_CITY),
      highway: equivalentGasPrice(kwh, MPG_HIGHWAY),
      combined: equivalentGasPrice(kwh, MPG_COMBINED),
    };
  }, [kwh]);

  const gasResults = useMemo(() => {
    const fillCost = TANK_GALLONS * gas;
    const evKWh = Number.isFinite(kwh) && kwh > 0 ? fillCost / kwh : NaN;
    const evMiles = Number.isFinite(evKWh) ? evKWh / KWH_PER_MILE : NaN;
    return {
      fillCost,
      rangeCity: TANK_GALLONS * MPG_CITY,
      rangeHighway: TANK_GALLONS * MPG_HIGHWAY,
      rangeCombined: TANK_GALLONS * MPG_COMBINED,
      evKWh,
      evMiles,
    };
  }, [gas, kwh]);

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            EV vs Gas Calculator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tesla Model Y LR AWD (2020–2024) · Gas car @ {MPG_CITY} mpg city /{" "}
            {MPG_HIGHWAY} mpg highway · {TANK_GALLONS} gal tank
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1: kWh price -> equivalent gas price */}
          <Panel title="From electricity price → equivalent gas price">
            <NumberInput
              id="kwh-price"
              label="Electricity price ($ per kWh)"
              prefix="$"
              value={pricePerKWh}
              onChange={setPricePerKWh}
              hint={`EV efficiency: ${KWH_PER_100KM} kWh/100km ≈ ${KWH_PER_MILE.toFixed(
                3
              )} kWh/mile`}
            />

            <Stat
              label="EV cost per mile"
              value={
                Number.isFinite(evResults.evCostPerMile)
                  ? `${(evResults.evCostPerMile * 100).toFixed(2)}¢ / mile`
                  : "—"
              }
            />

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Equivalent gas price (per gallon)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <ResultCard
                  label="City"
                  sub={`${MPG_CITY} mpg`}
                  value={fmtUSD(evResults.city)}
                />
                <ResultCard
                  label="Combined"
                  sub={`${MPG_COMBINED.toFixed(1)} mpg`}
                  value={fmtUSD(evResults.combined)}
                  highlight
                />
                <ResultCard
                  label="Highway"
                  sub={`${MPG_HIGHWAY} mpg`}
                  value={fmtUSD(evResults.highway)}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A gas car at this price/gallon would cost the same per mile to
                drive as the EV at your electricity rate.
              </p>
            </div>
          </Panel>

          {/* Panel 2: gas price -> tank fill, range, EV equivalent */}
          <Panel title="From gas price → tank cost & EV range for the same money">
            <NumberInput
              id="gas-price"
              label="Gasoline price ($ per gallon)"
              prefix="$"
              value={pricePerGallon}
              onChange={setPricePerGallon}
              hint={`Tank size: ${TANK_GALLONS} gallons`}
            />

            <Stat
              label={`Cost to fill ${TANK_GALLONS} gal tank`}
              value={fmtUSD(gasResults.fillCost)}
            />

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Range on a full tank
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <ResultCard
                  label="City"
                  sub={`${MPG_CITY} mpg`}
                  value={fmtMiles(gasResults.rangeCity)}
                />
                <ResultCard
                  label="Combined"
                  sub={`${MPG_COMBINED.toFixed(1)} mpg`}
                  value={fmtMiles(gasResults.rangeCombined)}
                  highlight
                />
                <ResultCard
                  label="Highway"
                  sub={`${MPG_HIGHWAY} mpg`}
                  value={fmtMiles(gasResults.rangeHighway)}
                />
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 space-y-1">
              <div className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300">
                Same {fmtUSD(gasResults.fillCost)} spent on electricity @{" "}
                {fmtUSD(kwh)}/kWh
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {fmtMiles(gasResults.evMiles)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Buys{" "}
                {Number.isFinite(gasResults.evKWh)
                  ? `${gasResults.evKWh.toFixed(1)} kWh`
                  : "—"}{" "}
                of charge for the Model Y.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

function Panel({ title, children }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 space-y-5 border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h2>
      {children}
    </section>
  );
}

function NumberInput({ id, label, prefix, value, onChange, hint }) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 ${
            prefix ? "pl-7" : "pl-3"
          } pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
      {hint && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
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
