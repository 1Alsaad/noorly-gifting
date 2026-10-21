import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InterestForm } from "@/components/forms/interest-form";
import { trackEvent } from "@/lib/analytics/client";
import { trackInterestLead } from "@/lib/analytics/meta";

vi.mock("@/lib/analytics/client", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/analytics/meta", () => ({ trackInterestLead: vi.fn() }));
const props = {
  locale: "en" as const,
  productHandle: "candle-sand",
  variantId: "candle-sand-11",
  boxContents: [],
  enabled: true,
};
function completeForm() {
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), {
    target: { value: "reader@example.com" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Register my interest" }));
}
function response(body: object, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("interest form acceptance is the conversion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not collect contact details while the backend is unavailable", () => {
    render(<InterestForm {...props} enabled={false} />);
    expect(screen.getByRole("status")).toHaveTextContent("opens soon");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("counts a saved registration once and excludes contact details from events", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response({ ok: true, mock: false }));
    render(<InterestForm {...props} />);
    completeForm();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your interest has been registered",
      ),
    );
    expect(trackInterestLead).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(vi.mocked(trackEvent).mock.calls)).not.toContain(
      "reader@example.com",
    );
    fireEvent.submit(screen.getByRole("button").closest("form")!);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rejects mock acceptance and failed persistence without counting leads", async () => {
    const fetcher = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({ ok: true, mock: true }))
      .mockResolvedValueOnce(response({ error: "UNAVAILABLE" }, 503))
      .mockResolvedValueOnce(
        response({ ok: true, mock: false, duplicate: true }),
      );
    render(<InterestForm {...props} />);
    completeForm();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("could not save"),
    );
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your interest has been registered",
      ),
    );
    const submissions = fetcher.mock.calls.map(
      (call) => JSON.parse(call[1]!.body as string).submissionId,
    );
    expect(new Set(submissions).size).toBe(1);
    expect(trackInterestLead).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
