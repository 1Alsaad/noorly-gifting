import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InformationPage, { generateMetadata } from "@/app/[locale]/[page]/page";
import { Footer } from "@/components/layout/footer";
import { withdrawalFormUrl } from "@/content/customer-policies";

const account = vi.hoisted(() => ({ url: "" }));
vi.mock("@/config/brand", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/brand")>();
  return {
    ...actual,
    brand: {
      ...actual.brand,
      customerService: {
        ...actual.brand.customerService,
        get customerAccountsUrl() {
          return account.url;
        },
      },
    },
  };
});

describe("customer policy routes", () => {
  beforeEach(() => {
    account.url = "";
    vi.stubEnv("NEXT_PUBLIC_PRODUCT_TEST_MODE", "false");
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["sv", "terms", "Köpvillkor"],
    ["en", "terms", "Terms of sale"],
    ["sv", "shipping-returns", "Leverans, ångerrätt och retur"],
    ["en", "shipping-returns", "Delivery, withdrawal and returns"],
    ["sv", "contact", "Kontakt och kundservice"],
    ["en", "contact", "Contact and support"],
    ["sv", "privacy", "Så hanterar vi dina uppgifter"],
    ["en", "privacy", "How we handle your information"],
  ])(
    "renders %s/%s with public brand contact details and matching metadata",
    async (locale, page, title) => {
      const params = Promise.resolve({ locale, page });
      const { container } = render(await InformationPage({ params }));
      expect(
        screen.getByRole("heading", { level: 1, name: title }),
      ).toBeInTheDocument();
      expect(
        within(container.querySelector("#seller") as HTMLElement).getByText(
          "NOORLY",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "support@noorlynordic.com" }),
      ).toHaveAttribute("href", "mailto:support@noorlynordic.com");
      expect(container).not.toHaveTextContent(
        /\bNoorly AB\b|Haga parkgata|723 36|Västerås|placeholder|fiktiv|fictional|not open yet|inte öppen ännu|09[–-]16/i,
      );
      const services = container.querySelector("#data-services");
      if (page === "terms" || page === "privacy") {
        expect(services).toHaveTextContent("Shopify Network Intelligence");
        expect(services).toHaveTextContent(
          locale === "sv"
            ? "självständigt personuppgiftsansvarig"
            : "independent controller",
        );
        expect(
          within(services as HTMLElement).getByRole("link", {
            name:
              locale === "sv"
                ? "Shopifys konsumentintegritetspolicy"
                : "Shopify Consumer Privacy Policy",
          }),
        ).toHaveAttribute(
          "href",
          "https://www.shopify.com/legal/privacy/consumers",
        );
        expect(
          within(services as HTMLElement).getByRole("link", {
            name:
              locale === "sv"
                ? "Shopifys integritetsportal"
                : "Shopify privacy portal",
          }),
        ).toHaveAttribute("href", "https://privacy.shopify.com/");
      } else {
        expect(services).toBeNull();
      }
      const customerCopy = container.cloneNode(true) as HTMLElement;
      customerCopy.querySelector("#data-services")?.remove();
      expect(customerCopy).not.toHaveTextContent(/Shopify/i);
      const metadata = await generateMetadata({ params });
      expect(metadata.title).toBe(title);
      expect(metadata.description).not.toMatch(/\bNoorly AB\b|Shopify/i);
    },
  );

  it("states the delivery fallback and withdrawal/refund deadlines without an approval condition", async () => {
    const { container } = render(
      await InformationPage({
        params: Promise.resolve({ locale: "sv", page: "shipping-returns" }),
      }),
    );
    const delivery = container.querySelector("#delivery") as HTMLElement;
    const withdrawal = container.querySelector("#withdrawal") as HTMLElement;
    const returns = container.querySelector("#returns") as HTMLElement;
    const refunds = container.querySelector("#refunds") as HTMLElement;
    expect(delivery).toHaveTextContent(
      "Ljussand och teakskål kan köpas var för sig eller tillsammans som paket",
    );
    expect(delivery).toHaveTextContent(
      "349 kr utan doft eller 449 kr med doft",
    );
    expect(delivery).toHaveTextContent("teakskålen kostar 550 kr");
    expect(delivery).toHaveTextContent(
      "699 kr med vit, doftfri ljussand eller 749 kr med ljussand i vald färg och doft",
    );
    expect(delivery).toHaveTextContent("moms och leverans inom Sverige");
    expect(delivery).toHaveTextContent("förbeställning");
    expect(delivery).toHaveTextContent("så snart varan finns i lager hos oss");
    expect(delivery).toHaveTextContent(
      "senast 30 dagar efter att avtalet ingicks",
    );
    expect(delivery).not.toHaveTextContent(
      /1[–-]3|2[–-]5|business days|arbetsdagar/,
    );
    expect(withdrawal).toHaveTextContent("14 dagars ångerrätt");
    expect(withdrawal).toHaveTextContent(
      "dagen efter att du har tagit emot varan",
    );
    expect(
      within(withdrawal).getByRole("link", {
        name: "Konsumentverkets ångerblankett",
      }),
    ).toHaveAttribute("href", withdrawalFormUrl);
    expect(returns).toHaveTextContent(
      "senast 14 dagar efter att du har meddelat oss",
    );
    expect(returns).not.toHaveTextContent(
      /godkänd retur|måste.*godkänna|approval|Du får undersöka varan/i,
    );
    expect(returns).toHaveTextContent("oanvänd och otänd");
    expect(returns).toHaveTextContent("Behåll helst förpackningen oöppnad");
    expect(returns).toHaveTextContent("faktiska värdeminskningen enligt lag");
    expect(returns).toHaveTextContent(
      "En öppnad förpackning utesluter inte automatiskt lagstadgad ångerrätt",
    );
    expect(returns).toHaveTextContent("för returadress och returinstruktioner");
    expect(refunds).toHaveTextContent(
      "senast 14 dagar efter att vi har tagit emot ditt ångermeddelande",
    );
    expect(refunds).toHaveTextContent(
      "varan eller bevis på att den skickats tillbaka",
    );
    expect(container.querySelector("#complaints")).toHaveTextContent(
      "tre års reklamationsrätt",
    );
  });

  it("links the configured withdrawal route from the footer and policy, with receipt information", async () => {
    account.url = "https://account.example.test/orders";
    render(<Footer locale="sv" />);
    expect(
      screen.getByRole("link", { name: "Ångra avtalet här" }),
    ).toHaveAttribute("href", account.url);
    const { container } = render(
      await InformationPage({
        params: Promise.resolve({ locale: "sv", page: "shipping-returns" }),
      }),
    );
    const withdrawal = container.querySelector("#withdrawal") as HTMLElement;
    expect(
      within(withdrawal).getByRole("link", { name: "Ångra avtalet här" }),
    ).toHaveAttribute("href", account.url);
    expect(withdrawal).toHaveTextContent(
      "bekräftelse via e-post när din begäran har tagits emot",
    );
    expect(withdrawal).toHaveTextContent("ett annat tydligt meddelande räcker");
  });

  it("uses the informational return page until a real customer-account link is configured", () => {
    render(<Footer locale="en" />);
    expect(
      screen.getByRole("link", { name: "Withdrawal and returns" }),
    ).toHaveAttribute("href", "/en/shipping-returns#withdrawal");
    expect(
      screen.queryByRole("link", { name: "Withdraw from your purchase" }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "Contact & support" }),
    ).toHaveAttribute("href", "/en/contact");
  });
});
