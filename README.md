# evgas

A small Next.js calculator that compares the cost of driving an EV vs a gas car.
Built with Next.js (App Router) + Tailwind CSS, deployable to Vercel.

## What it does

The app has two side-by-side panels:

### 1. Electricity price → equivalent gas price

Enter a price per kWh and the calculator shows:

- **EV cost per mile** for a Tesla Model Y Long Range AWD (2020–2024).
- **Equivalent gas price per gallon** at city, combined, and highway mpg.
  This is the gas price at which a gas car would cost the same per mile as
  the EV at your electricity rate.

Quick presets for electricity price:

| Preset             | $/kWh   |
| ------------------ | ------- |
| Sacramento         | 0.1550  |
| San Francisco      | 0.3200  |
| Supercharger       | 0.4800  |
| Electrify America  | 0.6400  |

### 2. Gas price → tank cost & EV range for the same money

Enter a price per gallon and the calculator shows:

- **Cost to fill** the selected gas car's tank.
- **Gas cost per mile** (combined mpg).
- **Range on a full tank** at city, combined, and highway mpg.
- **EV miles** you could drive on the Model Y for the same dollars at the
  current electricity price (and how many kWh that buys).

## Vehicles

### EV (fixed)

- **Tesla Model Y Long Range AWD (2020–2024)**
- WLTP combined consumption: **16.9 kWh/100 km** (~0.272 kWh/mile)

### Gas car (selectable)

| Car                     | City mpg | Highway mpg | Tank (gal) |
| ----------------------- | -------: | ----------: | ---------: |
| Default                 |       18 |          24 |       14.3 |
| Toyota RAV4             |       27 |          35 |       14.5 |

Combined mpg uses the EPA 55/45 city/highway weighting:

```
combined = 1 / (0.55 / city + 0.45 / highway)
```

## Bad driving factor

A 0–10% slider (default **5%**) that simulates aggressive driving by reducing
both gas mpg and EV efficiency by the same percentage. It affects:

- EV cost per mile (↑)
- Gas cost per mile (↑)
- Range on a full tank (↓)
- EV miles for the same money as a tank fill-up (↓)

The break-even *equivalent gas price* is unchanged because both vehicles are
penalized equally.

## Formulas

```
KWH_PER_MILE   = 16.9 / 100 * 1.609344         ≈ 0.272 kWh/mi
eff            = 1 - badDrivingPct / 100
ev_kWh_per_mi  = KWH_PER_MILE / eff
eff_mpg_x      = mpg_x * eff                    (x = city | highway)
eff_mpg_combined = 1 / (0.55/eff_mpg_city + 0.45/eff_mpg_highway)

ev_cost_per_mile       = ev_kWh_per_mi * price_per_kWh
gas_cost_per_mile      = price_per_gallon / eff_mpg_combined
equivalent_gas_price   = eff_mpg_x * ev_kWh_per_mi * price_per_kWh

fill_cost              = tank_gallons * price_per_gallon
range_x                = tank_gallons * eff_mpg_x
ev_miles_for_fill_cost = (fill_cost / price_per_kWh) / ev_kWh_per_mi
```

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Build

```bash
npm run build
npm start
```

## Deploy

Designed for Vercel — push to a Git repo and import it in the Vercel dashboard.
