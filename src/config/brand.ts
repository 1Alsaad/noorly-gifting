import type { Locale } from "@/types/commerce";

export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "NOORLY",
  legalCompanyName: "",
  organizationNumber: "",
  domain: "noorlynordic.com",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://noorlynordic.com",
  supportEmail: "support@noorlynordic.com",
  defaultLocale: "sv" as Locale,
  supportedLocales: ["sv", "en"] as const,
  currency: "SEK" as const,
  defaultCurrency: "SEK" as const,
  localeFormat: { sv: "sv-SE", en: "en-SE" },
  socials: { instagram: "", pinterest: "" },
  logos: { light: "", dark: "" },
  colors: {
    ivory: "#f4f0e8",
    charcoal: "#242924",
    oak: "#b29a79",
    forest: "#344b3e",
    stone: "#8c8b80",
    burgundy: "#632f38",
  },
  typography: {
    display: "Georgia, Times New Roman, serif",
    interface: "Arial, Helvetica, sans-serif",
  },
  address: {
    street: "",
    postalCode: "",
    city: "",
    country: "SE",
  },
  customerService: {
    email: "support@noorlynordic.com",
    phone: "",
    // Use the exact URL copied from Shopify Settings > Customer accounts.
    customerAccountsUrl: "https://shopify.com/107353178454/account",
  },
  seasonalSettings: { activeSeasonId: "winter", timezone: "Europe/Stockholm" },
  giftMessageMaxLength: 280,
} as const;

export function isLocale(value: string): value is Locale {
  return value === "sv" || value === "en";
}
