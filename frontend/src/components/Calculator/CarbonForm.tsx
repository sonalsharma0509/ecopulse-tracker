import { useState } from "react";
import { type FootprintInput, type CarFuel, type DietType, emptyInput } from "../../lib/types";
import { NumericInput } from "../shared/NumericInput";

interface Props {
  onSubmit: (input: FootprintInput) => void;
  loading: boolean;
}

const WEEKLY_KM_LIMIT = 20_000;
const MONTHLY_KWH_LIMIT = 100_000;
const FLIGHT_COUNT_LIMIT = 200;
const MONTHLY_SPEND_LIMIT = 1_000_000;
const WEEKLY_WASTE_LIMIT = 1_000;
const HOUSEHOLD_SIZE_LIMIT = 50;

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "heavy_meat", label: "Heavy meat eater" },
  { value: "medium_meat", label: "Average meat eater" },
  { value: "low_meat", label: "Low meat" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
];

const FUEL_OPTIONS: { value: CarFuel; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

export function CarbonForm({ onSubmit, loading }: Props) {
  const [input, setInput] = useState<FootprintInput>(emptyInput);

  const patchTransport = (patch: Partial<FootprintInput["transport"]>) =>
    setInput((p) => ({ ...p, transport: { ...p.transport, ...patch } }));
  const patchHome = (patch: Partial<FootprintInput["home"]>) =>
    setInput((p) => ({ ...p, home: { ...p.home, ...patch } }));
  const patchConsumption = (patch: Partial<FootprintInput["consumption"]>) =>
    setInput((p) => ({ ...p, consumption: { ...p.consumption, ...patch } }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(input);
  };

  return (
    <form className="card" onSubmit={handleSubmit} aria-labelledby="calc-heading">
      <h2 id="calc-heading">Estimate your annual footprint</h2>

      <fieldset>
        <legend>Transport</legend>
        <NumericInput
          id="car_km"
          label="Car distance per week (km)"
          max={WEEKLY_KM_LIMIT}
          value={input.transport.car_km_per_week}
          onChange={(v) => patchTransport({ car_km_per_week: v })}
        />
        <div className="field">
          <label htmlFor="car_fuel">Car fuel type</label>
          <select
            id="car_fuel"
            value={input.transport.car_fuel}
            onChange={(e) => patchTransport({ car_fuel: e.target.value as CarFuel })}
          >
            {FUEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <NumericInput
          id="transit_km"
          label="Public transit per week (km)"
          max={WEEKLY_KM_LIMIT}
          value={input.transport.public_transit_km_per_week}
          onChange={(v) => patchTransport({ public_transit_km_per_week: v })}
        />
        <NumericInput
          id="short_flights"
          label="Short-haul flights per year"
          max={FLIGHT_COUNT_LIMIT}
          step={1}
          value={input.transport.short_haul_flights_per_year}
          onChange={(v) => patchTransport({ short_haul_flights_per_year: v })}
        />
        <NumericInput
          id="long_flights"
          label="Long-haul flights per year"
          max={FLIGHT_COUNT_LIMIT}
          step={1}
          value={input.transport.long_haul_flights_per_year}
          onChange={(v) => patchTransport({ long_haul_flights_per_year: v })}
        />
      </fieldset>

      <fieldset>
        <legend>Home energy</legend>
        <NumericInput
          id="electricity"
          label="Electricity per month (kWh)"
          max={MONTHLY_KWH_LIMIT}
          value={input.home.electricity_kwh_per_month}
          onChange={(v) => patchHome({ electricity_kwh_per_month: v })}
        />
        <NumericInput
          id="gas"
          label="Natural gas per month (kWh)"
          max={MONTHLY_KWH_LIMIT}
          value={input.home.natural_gas_kwh_per_month}
          onChange={(v) => patchHome({ natural_gas_kwh_per_month: v })}
        />
        <NumericInput
          id="household"
          label="People in household"
          min={1}
          max={HOUSEHOLD_SIZE_LIMIT}
          step={1}
          hint="Home energy is shared across this many people."
          value={input.home.household_size}
          onChange={(v) => patchHome({ household_size: v })}
        />
      </fieldset>

      <fieldset>
        <legend>Diet &amp; consumption</legend>
        <div className="field">
          <label htmlFor="diet">Diet</label>
          <select
            id="diet"
            value={input.diet}
            onChange={(e) => setInput((p) => ({ ...p, diet: e.target.value as DietType }))}
          >
            {DIET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <NumericInput
          id="goods"
          label="Goods spending per month (USD)"
          max={MONTHLY_SPEND_LIMIT}
          value={input.consumption.goods_spend_usd_per_month}
          onChange={(v) => patchConsumption({ goods_spend_usd_per_month: v })}
        />
        <NumericInput
          id="waste"
          label="Landfill waste per week (kg)"
          max={WEEKLY_WASTE_LIMIT}
          value={input.consumption.waste_kg_per_week}
          onChange={(v) => patchConsumption({ waste_kg_per_week: v })}
        />
      </fieldset>

      <button className="btn" type="submit" disabled={loading} aria-busy={loading}>
        {loading ? "Calculating…" : "Calculate my footprint"}
      </button>
    </form>
  );
}
