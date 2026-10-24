import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  PlannedBundleCard,
  PlannedBundleDetails,
} from "@/components/product/planned-bundle";

afterEach(cleanup);

describe("Noorly pre-order disclosure", () => {
  it("prominently labels the Swedish product presentation and its delivery-after-stock terms", () => {
    render(<PlannedBundleDetails locale="sv" />);
    expect(screen.getByText("FÖRHANDSBESTÄLLNING KOMMER SNART")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("leverans när varorna kommit in i lager");
    expect(screen.getByRole("note")).toHaveTextContent("beräknad leveransperiod innan betalning");
    expect(screen.getByText(/går inte att beställa eller betala nu/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /köp|beställ/i })).toBeNull();
  });

  it("discloses the same limits on the English shop card", () => {
    render(<PlannedBundleCard locale="en" />);
    expect(screen.getByText("PRE-ORDER COMING SOON")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("ships after stock arrives");
    expect(screen.getByRole("note")).toHaveTextContent("before payment");
    expect(screen.getByText(/Ordering and payment are unavailable/)).toBeInTheDocument();
  });
});
