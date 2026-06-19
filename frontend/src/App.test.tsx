import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import App from "./App";
import type { FootprintResult, InsightsResponse } from "./lib/types";

// Mock the API layer so the integration test runs without a backend.
vi.mock("./lib/api", () => ({
  estimateFootprint: vi.fn(),
  fetchAdvice: vi.fn(),
  storeEntry: vi.fn(),
  loadHistory: vi.fn(),
}));

import * as api from "./lib/api";

const result: FootprintResult = {
  breakdown_kg: { transport: 2000, home: 1000, diet: 1500, consumption: 500 },
  total_annual_kg: 5000,
  total_annual_tonnes: 5.0,
  comparison: {
    global_average_annual_kg: 4800,
    sustainable_target_annual_kg: 2000,
    ratio_to_global_average: 1.04,
    ratio_to_sustainable_target: 2.5,
  },
};

const insights: InsightsResponse = {
  summary: "Your footprint is above the sustainable target.",
  recommendations: [
    { category: "transport", action: "Drive less", estimated_annual_savings_kg: 400 },
  ],
  source: "rules",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.loadHistory).mockResolvedValue([]);
  vi.mocked(api.estimateFootprint).mockResolvedValue(result);
  vi.mocked(api.fetchAdvice).mockResolvedValue(insights);
  vi.mocked(api.storeEntry).mockResolvedValue({
    id: "e1",
    created_at: new Date().toISOString(),
    device_id: "dev-123",
    input: {} as never,
    result,
  });
});

/** Render the app and wait for the initial history load to settle. */
async function renderApp() {
  const view = render(<App />);
  await waitFor(() => expect(api.loadHistory).toHaveBeenCalled());
  return view;
}

describe("App", () => {
  it("renders with no accessibility violations", async () => {
    const { container } = await renderApp();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("calculates and shows results plus personalized insights", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));

    await waitFor(() => expect(screen.getByText(/your estimated footprint/i)).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /personalized insights/i })).toBeInTheDocument();
    expect(screen.getByText(/drive less/i)).toBeInTheDocument();
    expect(api.estimateFootprint).toHaveBeenCalledTimes(1);
  });

  it("announces readiness to screen readers via the status live region", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/results .* are ready below/i),
    );
  });

  it("saves an entry and reloads history", async () => {
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() => screen.getByRole("button", { name: /save this entry/i }));
    await userEvent.click(screen.getByRole("button", { name: /save this entry/i }));

    await waitFor(() => expect(api.storeEntry).toHaveBeenCalledTimes(1));
    // loadHistory: once on mount, once after save.
    expect(api.loadHistory).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/entry saved/i));
  });

  it("shows an error message when calculation fails", async () => {
    vi.mocked(api.estimateFootprint).mockRejectedValueOnce(new Error("boom"));
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i),
    );
  });

  it("shows an error message when saving fails", async () => {
    vi.mocked(api.storeEntry).mockRejectedValueOnce(new Error("boom"));
    await renderApp();
    await userEvent.click(screen.getByRole("button", { name: /calculate my footprint/i }));
    await waitFor(() => screen.getByRole("button", { name: /save this entry/i }));
    await userEvent.click(screen.getByRole("button", { name: /save this entry/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/could not save/i));
  });
});
