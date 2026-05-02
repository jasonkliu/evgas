"use client";

import { useState, useMemo } from "react";

const KWH_PER_100KM = 16.9;
const KM_PER_MILE = 1.609344;
const KWH_PER_MILE = (KWH_PER_100KM / 100) * KM_PER_MILE;

const ELECTRICITY_PRESETS = [
  { label: "Sacramento", price: 0.155 },
  { label: "San Francisco", price: 0.32 },
  { label: "Supercharger", price: 0.48 },
  { label: "Electrify America", price: 0.64 },
];

const DEFAULT_GAS_CARS = [
  { id: "default", label: "Default", city: 18, highway: 24, tank: 14.3 },
  { id: "rav4", label: "Toyota RAV4", city: 27, highway: 35, tank: 14.5 },
  { id: "large-suv", label: "Large SUV", city: 18, highway: 27, tank: 22.4 },
];

function combinedMpg(city, highway) {
  return 1 / (0.55 / city + 0.45 / highway);
}

function toPositive(v, fallback) {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

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
  const [carId, setCarId] = useState("default");
  const [badDrivingPct, setBadDrivingPct] = useState(5);
  const [gasCars, setGasCars] = useState(DEFAULT_GAS_CARS);

  const rawCar = gasCars.find((c) => c.id === carId) ?? gasCars[0];
  const car = useMemo(
    () => ({
      ...rawCar,
      city: toPositive(rawCar.city, 1),
      highway: toPositive(rawCar.highway, 1),
      tank: toPositive(rawCar.tank, 0.1),
    }),
    [rawCar]
  );

  function updateCar(id, field, value) {
    setGasCars((cars) =>
      cars.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  const penalty = Math.max(0, Math.min(10, badDrivingPct)) / 100;
  const effMpgCity = car.city * (1 - penalty);
  const effMpgHighway = car.highway * (1 - penalty);
  const effMpgCombined = combinedMpg(effMpgCity, effMpgHighway);
  const effKWhPerMile = KWH_PER_MILE / (1 - penalty);
  const mpgCombined = effMpgCombined;

  const kwh = parseFloat(pricePerKWh);
  const gas = parseFloat(pricePerGallon);

  const evResults = useMemo(() => {
    const evCostPerMile = effKWhPerMile * kwh;
    return {
      evCostPerMile,
      city: effMpgCity * effKWhPerMile * kwh,
      highway: effMpgHighway * effKWhPerMile * kwh,
      combined: effMpgCombined * effKWhPerMile * kwh,
    };
  }, [kwh, effKWhPerMile, effMpgCity, effMpgHighway, effMpgCombined]);

  const gasResults = useMemo(() => {
    const fillCost = car.tank * gas;
    const evKWh = Number.isFinite(kwh) && kwh > 0 ? fillCost / kwh : NaN;
    const evMiles = Number.isFinite(evKWh) ? evKWh / effKWhPerMile : NaN;
    return {
      fillCost,
      rangeCity: car.tank * effMpgCity,
      rangeHighway: car.tank * effMpgHighway,
      rangeCombined: car.tank * effMpgCombined,
      evKWh,
      evMiles,
    };
  }, [gas, kwh, car, effKWhPerMile, effMpgCity, effMpgHighway, effMpgCombined]);

  return (
    <main className="min-h-screen p-6 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-3 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            EV vs Gas Calculator
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Tesla Model Y LR AWD (2020–2024) · {KWH_PER_100KM} kWh/100km
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Gas car:
            </span>
            {gasCars.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCarId(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  c.id === carId
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {c.label} ({toPositive(c.city, 0)}/{toPositive(c.highway, 0)})
              </button>
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400">
              · {car.tank} gal tank · {effMpgCombined.toFixed(1)} mpg combined
              {penalty > 0 ? ` (after ${(penalty * 100).toFixed(0)}% penalty)` : ""}
            </span>
          </div>

          <div className="max-w-md mx-auto pt-2 grid grid-cols-3 gap-2">
            <SmallNumberInput
              id={`city-${car.id}`}
              label="City mpg"
              value={rawCar.city}
              onChange={(v) => updateCar(car.id, "city", v)}
            />
            <SmallNumberInput
              id={`hwy-${car.id}`}
              label="Highway mpg"
              value={rawCar.highway}
              onChange={(v) => updateCar(car.id, "highway", v)}
            />
            <SmallNumberInput
              id={`tank-${car.id}`}
              label="Tank (gal)"
              value={rawCar.tank}
              onChange={(v) => updateCar(car.id, "tank", v)}
            />
          </div>

          <div className="max-w-md mx-auto pt-2 space-y-1">
            <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
              <label htmlFor="bad-driving">"I wanna go fast!" -Ricky Bobby</label>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {badDrivingPct}%
              </span>
            </div>
            <input
              id="bad-driving"
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={badDrivingPct}
              onChange={(e) => setBadDrivingPct(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reduces both mpg and EV efficiency by this %.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1 */}
          <Panel title="From electricity price → equivalent gas price">
            <NumberInput
              id="kwh-price"
              label="Electricity price ($ per kWh)"
              prefix="$"
              value={pricePerKWh}
              onChange={setPricePerKWh}
              hint={`EV efficiency: ${KWH_PER_100KM} kWh/100km ≈ ${effKWhPerMile.toFixed(
                3
              )} kWh/mile${penalty > 0 ? ` (after ${(penalty * 100).toFixed(0)}% penalty)` : ""}`}
            />

            <Presets
              presets={ELECTRICITY_PRESETS}
              currentValue={pricePerKWh}
              onSelect={(p) => setPricePerKWh(String(p))}
              format={(p) => `$${p.toFixed(4)}/kWh`}
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
                  sub={`${effMpgCity.toFixed(1)} mpg`}
                  value={fmtUSD(evResults.city)}
                />
                <ResultCard
                  label="Combined"
                  sub={`${effMpgCombined.toFixed(1)} mpg`}
                  value={fmtUSD(evResults.combined)}
                  highlight
                />
                <ResultCard
                  label="Highway"
                  sub={`${effMpgHighway.toFixed(1)} mpg`}
                  value={fmtUSD(evResults.highway)}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A gas car at this price/gallon would cost the same per mile to
                drive as the EV at your electricity rate.
              </p>
            </div>
          </Panel>

          {/* Panel 2 */}
          <Panel title="From gas price → tank cost & EV range for the same money">
            <NumberInput
              id="gas-price"
              label="Gasoline price ($ per gallon)"
              prefix="$"
              value={pricePerGallon}
              onChange={setPricePerGallon}
              hint={`Tank size: ${car.tank} gallons`}
            />

            <Stat
              label={`Cost to fill ${car.tank} gal tank`}
              value={fmtUSD(gasResults.fillCost)}
            />

            <Stat
              label="Gas cost per mile (combined)"
              value={
                Number.isFinite(gas)
                  ? `${((gas / mpgCombined) * 100).toFixed(2)}¢ / mile`
                  : "—"
              }
            />

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Range on a full tank
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <ResultCard
                  label="City"
                  sub={`${effMpgCity.toFixed(1)} mpg`}
                  value={fmtMiles(gasResults.rangeCity)}
                />
                <ResultCard
                  label="Combined"
                  sub={`${effMpgCombined.toFixed(1)} mpg`}
                  value={fmtMiles(gasResults.rangeCombined)}
                  highlight
                />
                <ResultCard
                  label="Highway"
                  sub={`${effMpgHighway.toFixed(1)} mpg`}
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

function Presets({ presets, currentValue, onSelect, format }) {
  const current = parseFloat(currentValue);
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((p) => {
        const active = Math.abs((current ?? NaN) - p.price) < 1e-9;
        return (
          <button
            key={p.label}
            type="button"
            onClick={() => onSelect(p.price)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              active
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
            title={format(p.price)}
          >
            {p.label}{" "}
            <span className={active ? "opacity-90" : "opacity-60"}>
              ${p.price.toFixed(p.price < 1 ? 4 : 2).replace(/0+$/, "").replace(/\.$/, "")}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SmallNumberInput({ id, label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.1"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
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
