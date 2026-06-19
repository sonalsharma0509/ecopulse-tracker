"""Deterministic, rule-based insight engine.

This is the reliability backbone of the "Reduce" pillar: it runs entirely
offline with no external dependency, so the platform can always offer concrete,
personalized advice even when Gemini is unavailable or disabled. It is also fully
unit-testable because it is pure.

Strategy: rank the user's emission categories by size and emit targeted actions
for the biggest contributors, each with a quantified annual saving estimate.
"""

from __future__ import annotations

from app.carbon import factors
from app.models import FootprintInput, FootprintResult, InsightsResponse, Recommendation

# Achievable reduction shares behind each recommendation's savings estimate.
# Deliberately conservative round figures for awareness-level guidance:
_AVIATION_CUT_SHARE = 0.5  # replace/combine flights → roughly halve aviation
_ENERGY_SAVING_SHARE = 0.33  # renewable tariff + insulation → ~a third
_CONSUMER_SAVING_SHARE = 0.25  # durable/second-hand goods, less landfill
_TRAVEL_SAVING_SHARE = 0.2  # carpooling/transit for routine trips

# Diet types ordered from highest to lowest annual footprint.
_DIET_HIERARCHY = [
    factors.DietType.HEAVY_MEAT,
    factors.DietType.MEDIUM_MEAT,
    factors.DietType.LOW_MEAT,
    factors.DietType.PESCATARIAN,
    factors.DietType.VEGETARIAN,
    factors.DietType.VEGAN,
]


def _build_transport_advice(data: FootprintInput, amount: float) -> Recommendation | None:
    t = data.transport
    flights_km = (
        t.short_haul_flights_per_year * factors.SHORT_HAUL_TRIP_KM
        + t.long_haul_flights_per_year * factors.LONG_HAUL_TRIP_KM
    )
    car_km_year = t.car_km_per_week * factors.WEEKS_PER_YEAR
    car_emissions = car_km_year * factors.CAR_FACTORS_PER_KM[t.car_fuel]
    flying = t.short_haul_flights_per_year + t.long_haul_flights_per_year > 0
    # Address whichever sub-source is larger: flying or driving.
    if flying and flights_km * factors.FLIGHT_LONG_HAUL_PER_KM > car_emissions:
        return Recommendation(
            category="transport",
            action="Replace one or more flights per year with rail or video calls, "
            "and combine trips to halve your aviation emissions.",
            estimated_annual_savings_kg=round(_AVIATION_CUT_SHARE * amount, 2),
        )
    if t.car_km_per_week > 0 and t.car_fuel != factors.CarFuel.ELECTRIC:
        # Estimate savings from switching the car to electric.
        current = car_km_year * factors.CAR_FACTORS_PER_KM[t.car_fuel]
        electric = car_km_year * factors.CAR_FACTORS_PER_KM[factors.CarFuel.ELECTRIC]
        saving = round(current - electric, 2)
        if saving > 0:
            return Recommendation(
                category="transport",
                action="Shift short car trips to walking, cycling or public transit, and "
                "consider an electric vehicle for the rest.",
                estimated_annual_savings_kg=saving,
            )
    if amount > 0:
        return Recommendation(
            category="transport",
            action="Carpool or use public transit for routine journeys to cut transport emissions.",
            estimated_annual_savings_kg=round(_TRAVEL_SAVING_SHARE * amount, 2),
        )
    return None


def _build_home_advice(amount: float) -> Recommendation | None:
    if amount <= 0:
        return None
    return Recommendation(
        category="home",
        action="Switch to a renewable electricity tariff and improve insulation/thermostat "
        "settings to cut roughly a third of home energy emissions.",
        estimated_annual_savings_kg=round(_ENERGY_SAVING_SHARE * amount, 2),
    )


def _build_diet_advice(data: FootprintInput) -> Recommendation | None:
    current = data.diet
    idx = _DIET_HIERARCHY.index(current)
    if idx >= len(_DIET_HIERARCHY) - 1:
        return None  # already vegan — nothing greener to suggest
    # Suggest stepping one rung down the ladder.
    target = _DIET_HIERARCHY[idx + 1]
    saving = round(factors.DIET_ANNUAL_KG[current] - factors.DIET_ANNUAL_KG[target], 2)
    if saving <= 0:
        return None
    return Recommendation(
        category="diet",
        action=f"Shift toward a {target.value.replace('_', ' ')} diet — even a few plant-based "
        "days each week meaningfully lowers food emissions.",
        estimated_annual_savings_kg=saving,
    )


def _build_consumption_advice(amount: float) -> Recommendation | None:
    if amount <= 0:
        return None
    return Recommendation(
        category="consumption",
        action="Buy less and choose durable, second-hand or repairable goods, and reduce "
        "landfill waste by recycling and composting.",
        estimated_annual_savings_kg=round(_CONSUMER_SAVING_SHARE * amount, 2),
    )


def build_rule_based_recommendations(data: FootprintInput, result: FootprintResult) -> InsightsResponse:
    """Produce ranked, quantified recommendations from the footprint breakdown."""
    builders = {
        "transport": lambda amt: _build_transport_advice(data, amt),
        "home": _build_home_advice,
        "diet": lambda _amt: _build_diet_advice(data),
        "consumption": _build_consumption_advice,
    }

    # Rank categories by their share of emissions (largest first).
    ranked = sorted(result.breakdown_kg.items(), key=lambda kv: kv[1], reverse=True)

    recommendations: list[Recommendation] = []
    for category, amount in ranked:
        rec = builders[category](amount)
        if rec is not None:
            recommendations.append(rec)

    total = result.total_annual_kg
    target = factors.SUSTAINABLE_TARGET_ANNUAL_KG
    if total <= target:
        summary = (
            f"Your estimated footprint is {result.total_annual_tonnes} t CO2e/yr — at or below "
            f"the sustainable target of {target / 1000:.1f} t. Keep it up, and lock in these habits."
        )
    else:
        over = round((total - target) / 1000, 2)
        summary = (
            f"Your estimated footprint is {result.total_annual_tonnes} t CO2e/yr, about {over} t "
            f"above the sustainable target of {target / 1000:.1f} t. The actions below target your "
            "biggest sources first for the fastest reductions."
        )

    return InsightsResponse(
        summary=summary,
        recommendations=recommendations[:4],
        source="rules",
    )
