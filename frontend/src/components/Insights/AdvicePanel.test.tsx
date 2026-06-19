import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { AdvicePanel } from "./AdvicePanel";
import type { InsightsResponse } from "../lib/types";

const baseInsights: InsightsResponse = {
  summary: "Transport is your biggest source of emissions.",
  recommendations: [
    { category: "transport", action: "Take the train", estimated_annual_savings_kg: 800 },
    { category: "diet", action: "More plant-based meals", estimated_annual_savings_kg: 600 },
  ],
  source: "gemini",
};

describe("AdvicePanel", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<AdvicePanel insights={baseInsights} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("labels AI-generated insights as such", () => {
    render(<AdvicePanel insights={baseInsights} />);
    expect(screen.getByText("AI-personalized")).toBeInTheDocument();
  });

  it("labels rule-based insights as smart rules", () => {
    render(<AdvicePanel insights={{ ...baseInsights, source: "rules" }} />);
    expect(screen.getByText("Smart rules")).toBeInTheDocument();
  });

  it("renders the summary and every recommendation with its saving", () => {
    render(<AdvicePanel insights={baseInsights} />);
    expect(screen.getByText(baseInsights.summary)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/take the train/i)).toBeInTheDocument();
    expect(screen.getByText(/800 kg CO₂e \/ year/i)).toBeInTheDocument();
  });
});
