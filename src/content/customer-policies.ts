import { brand } from "@/config/brand";
import type { Locale } from "@/types/commerce";

export type PolicyLink = { label: string; href: string };
export type PolicySection = {
  id: string;
  heading: string;
  paragraphs: string[];
  links?: PolicyLink[];
};
export type CustomerPolicy = {
  eyebrow: string;
  title: string;
  description: string;
  sections: PolicySection[];
};

// Legal sources checked 24 October 2026: DAL 2005:59, chapter 2 §§2–15;
// Konsumentköplag 2022:260, chapters 2–5; Konsumentverket's current guidance.
// Customer-account withdrawal requests are handled by Shopify, not this site.
export const withdrawalFormUrl =
  "https://publikationer.konsumentverket.se/mallar-och-blanketter/angerblankett";

export function customerWithdrawalLink(locale: Locale): PolicyLink {
  const accountUrl = brand.customerService.customerAccountsUrl;
  return {
    href: accountUrl || `/${locale}/shipping-returns#withdrawal`,
    label: accountUrl
      ? locale === "sv"
        ? "Ångra avtalet här"
        : "Withdraw from your purchase"
      : locale === "sv"
        ? "Ångerrätt och retur"
        : "Withdrawal and returns",
  };
}

export function customerPolicySections(locale: Locale) {
  const sv = locale === "sv";
  const email = brand.supportEmail;
  const address = `${brand.address.street}, ${brand.address.postalCode} ${brand.address.city}, ${sv ? "Sverige" : "Sweden"}`;
  const seller: PolicySection = {
    id: "seller",
    heading: sv ? "Säljare och kontakt" : "Seller and contact",
    paragraphs: [
      brand.legalCompanyName,
      address,
      ...(brand.organizationNumber
        ? [
            `${sv ? "Organisationsnummer" : "Company registration number"}: ${brand.organizationNumber}`,
          ]
        : []),
      ...(brand.customerService.phone
        ? [`${sv ? "Telefon" : "Telephone"}: ${brand.customerService.phone}`]
        : []),
    ],
    links: [{ label: email, href: `mailto:${email}` }],
  };
  const delivery: PolicySection = {
    id: "delivery",
    heading: sv ? "Pris och leverans" : "Price and delivery",
    paragraphs: sv
      ? [
          "Ljussand och teakskål säljs separat. En påse ljussand med 300 g och fyra bomullsvekar kostar 199 kr utan doft eller 249 kr med doft. Den dekorativa teakskålen kostar 550 kr. Priserna inkluderar moms och leverans inom Sverige; ingen extra fraktavgift tillkommer.",
          "Vi behandlar och skickar din beställning så snart som möjligt. Du får en orderbekräftelse via e-post och spårningsinformation när sådan finns tillgänglig.",
          "Om vi inte har avtalat om en annan leveranstid ska leveransen ske utan onödigt dröjsmål och senast 30 dagar efter att avtalet ingicks.",
          `Kontakta ${email} om leveransen dröjer eller paketet skadas eller försvinner. Vi ansvarar för leveransen tills du har tagit emot varan. Vid försening kan du kräva leverans och, när konsumentköplagens förutsättningar är uppfyllda, häva köpet och få tillbaka det du har betalat.`,
        ]
      : [
          "Candle sand and the teak bowl are sold separately. One 300 g pouch of candle sand with four cotton wicks costs SEK 199 unscented or SEK 249 scented. The decorative teak bowl costs SEK 550. Prices include VAT and delivery within Sweden, with no additional shipping charge.",
          "We process and dispatch your order as soon as possible. You receive an order confirmation by email and tracking information when available.",
          "Unless we have agreed on another delivery time, delivery must take place without unnecessary delay and no later than 30 days after the contract is concluded.",
          `Contact ${email} if delivery is delayed or your parcel is damaged or lost. We remain responsible for delivery until you receive the goods. For delays, you can request delivery and, where the conditions under Swedish consumer law are met, cancel the purchase and receive a refund.`,
        ],
  };
  const withdrawal: PolicySection = {
    id: "withdrawal",
    heading: sv ? "Ångerrätt" : "Right of withdrawal",
    paragraphs: [
      sv
        ? "Du har 14 dagars ångerrätt, räknat från dagen efter att du har tagit emot varan. Om en beställning levereras i flera delar räknas tiden från dagen efter den sista leveransen. Du behöver inte ange något skäl. Om sista dagen är en lördag, söndag eller helgdag förlängs fristen till nästa vardag."
        : "You have 14 days to withdraw from your purchase, counted from the day after you receive the goods. If an order arrives in separate parts, the period starts the day after the final delivery. You do not need to give a reason. If the last day falls on a weekend or public holiday, the period extends to the next business day.",
      sv
        ? `Meddela oss tydligt att du vill ångra köpet, exempelvis via ${email}. Ange gärna ditt namn och ordernummer så att vi kan hitta köpet. Du kan också ångra dig innan varan har levererats.`
        : `Clearly notify us that you wish to withdraw, for example at ${email}. Please include your name and order number if available so that we can find the purchase. You can also withdraw before the goods have been delivered.`,
      ...(brand.customerService.customerAccountsUrl
        ? [
            sv
              ? "Du kan använda länken Ångra avtalet här. Logga in med e-postadressen från ditt köp, välj beställningen och bekräfta vilka varor du vill ångra. Shopify skickar en bekräftelse via e-post när din begäran har tagits emot."
              : "You can use Withdraw from your purchase. Sign in with the email address used for your purchase, select the order and confirm which items you wish to withdraw from. Shopify sends an email confirmation when your request is received.",
          ]
        : []),
      sv
        ? "Du kan också använda Konsumentverkets ångerblankett. Blanketten är frivillig; ett annat tydligt meddelande räcker."
        : "You may also use the Swedish Consumer Agency's withdrawal form. The form is optional; another clear notification is sufficient.",
    ],
    links: [
      ...(brand.customerService.customerAccountsUrl
        ? [customerWithdrawalLink(locale)]
        : []),
      {
        label: sv ? "Konsumentverkets ångerblankett" : "Withdrawal form",
        href: withdrawalFormUrl,
      },
    ],
  };
  const returns: PolicySection = {
    id: "returns",
    heading: sv ? "Så returnerar du" : "Returning the goods",
    paragraphs: sv
      ? [
          "Skicka tillbaka varan utan onödigt dröjsmål och senast 14 dagar efter att du har meddelat oss att du ångrar köpet. Du betalar den direkta returfrakten när du använder ångerrätten. Packa varan omsorgsfullt och spara inlämningskvittot.",
          `Returadress: ${brand.legalCompanyName}, ${address}. Kontakta ${email} om du behöver hjälp med returen.`,
          "Du får undersöka varan. Om den hanteras mer än vad som behövs för att fastställa dess egenskaper och funktion kan vi göra avdrag för den faktiska värdeminskningen enligt lag. En öppnad förpackning innebär inte i sig att ångerrätten försvinner.",
        ]
      : [
          "Return the goods without unnecessary delay and within 14 days of notifying us of your withdrawal. You pay the direct return postage when changing your mind. Pack the goods carefully and retain proof of posting.",
          `Return address: ${brand.legalCompanyName}, ${address}. Contact ${email} if you need help with your return.`,
          "You may inspect the goods. Handling beyond what is necessary to establish their characteristics and function may result in a deduction for the actual diminished value, as permitted by law. Opening the packaging does not by itself remove your right of withdrawal.",
        ],
  };
  const refunds: PolicySection = {
    id: "refunds",
    heading: sv ? "Återbetalning" : "Refunds",
    paragraphs: sv
      ? [
          "Vi återbetalar det du har betalat för det ångrade köpet, inklusive eventuell standardleverans, med avdrag endast när lagen tillåter det. Vi tar ingen administrativ returavgift.",
          "Återbetalning sker utan onödigt dröjsmål och senast 14 dagar efter att vi har tagit emot ditt ångermeddelande. Vi får invänta varan eller bevis på att den skickats tillbaka, beroende på vilket som kommer först. Vi använder samma betalningssätt som vid köpet om du inte uttryckligen godkänner något annat, utan avgift för återbetalningen.",
        ]
      : [
          "We refund the amount paid for the purchase you withdraw from, including any standard delivery charge, with deductions only where permitted by law. We do not charge an administrative return fee.",
          "We refund without unnecessary delay and within 14 days of receiving your withdrawal notice. We may wait until we receive the goods or proof of return, whichever comes first. We use your original payment method unless you expressly agree otherwise, without a refund fee.",
        ],
  };
  const complaints: PolicySection = {
    id: "complaints",
    heading: sv ? "Reklamation och tvist" : "Faulty goods and disputes",
    paragraphs: sv
      ? [
          `Du har tre års reklamationsrätt för ursprungliga fel. Reklamera inom skälig tid efter att du upptäckt felet; inom två månader är alltid i rätt tid. Kontakta ${email} och beskriv felet. Bifoga gärna bilder.`,
          "Vi hanterar reklamationer enligt konsumentköplagen. Vid ett fel som vi ansvarar för åtgärdar vi felet eller ersätter varan utan kostnad, inklusive nödvändig frakt. Prisavdrag eller hävning kan bli aktuellt enligt lagen. Dina lagstadgade rättigheter begränsas inte av dessa villkor.",
          "Om vi inte kommer överens kan du vända dig till Allmänna reklamationsnämnden (ARN), enligt deras prövningsregler.",
        ]
      : [
          `You have three years of statutory protection for original defects. Notify us within a reasonable time after discovering a defect; notification within two months is always timely. Contact ${email} and describe the problem. Photos are helpful.`,
          "We handle complaints under Swedish consumer law. For a defect we are responsible for, repair or replacement is free, including necessary shipping. A price reduction or cancellation may apply under the law. These terms do not limit your statutory rights.",
          "Unresolved disputes may be referred to Sweden's National Board for Consumer Disputes (ARN), subject to its eligibility rules.",
        ],
    links: [
      {
        label: "Allmänna reklamationsnämnden (ARN)",
        href: "https://www.arn.se/",
      },
    ],
  };
  const order: PolicySection = {
    id: "orders",
    heading: sv ? "Beställning och betalning" : "Orders and payment",
    paragraphs: sv
      ? [
          "Dessa villkor gäller när du som konsument handlar hos Noorly AB med leverans inom Sverige. Produktens innehåll och valda alternativ framgår på produktsidan och i din beställning.",
          "Priser anges i svenska kronor inklusive moms. Ljussand och teakskål säljs som separata produkter, och leverans inom Sverige ingår. Kontrollera valda varor, färg och doft, leveransadress och totalbelopp innan du bekräftar köpet.",
          "Betalning sker i Shopifys kassa med de betalningssätt som visas där. Du får en orderbekräftelse via e-post. Kontakta oss om någon uppgift i beställningen är fel.",
        ]
      : [
          "These terms apply when you buy from Noorly AB as a consumer for delivery within Sweden. The product contents and selected options are shown on the product page and in your order.",
          "Prices are in Swedish kronor and include VAT. Candle sand and the teak bowl are sold as separate products, and delivery within Sweden is included. Check your items, selected colour and scent, delivery address and total before confirming your purchase.",
          "Payment is completed through Shopify checkout using the payment methods shown there. You receive an order confirmation by email. Contact us if any order detail is incorrect.",
        ],
  };
  return { seller, order, delivery, withdrawal, returns, refunds, complaints };
}

export function getCustomerPolicy(
  locale: Locale,
  page: string,
): CustomerPolicy | undefined {
  const sv = locale === "sv";
  const sections = customerPolicySections(locale);
  const eyebrow = sv ? "KUNDSERVICE" : "CUSTOMER CARE";
  if (page === "shipping-returns") {
    return {
      eyebrow,
      title: sv
        ? "Leverans, ångerrätt och retur"
        : "Delivery, withdrawal and returns",
      description: sv
        ? "Leverans inom Sverige ingår. Här hittar du information om leverans, 14 dagars ångerrätt, returer och reklamation."
        : "Delivery within Sweden is included. Find delivery information, your 14-day right of withdrawal, returns and complaints here.",
      sections: [
        sections.delivery,
        sections.withdrawal,
        sections.returns,
        sections.refunds,
        sections.complaints,
        sections.seller,
      ],
    };
  }
  if (page === "terms") {
    return {
      eyebrow,
      title: sv ? "Köpvillkor" : "Terms of sale",
      description: sv
        ? "Villkor för ditt köp hos Noorly AB: betalning, leverans, ångerrätt och reklamation."
        : "Terms for your purchase from Noorly AB: payment, delivery, withdrawal and complaints.",
      sections: [
        sections.seller,
        sections.order,
        sections.delivery,
        sections.withdrawal,
        sections.returns,
        sections.refunds,
        sections.complaints,
      ],
    };
  }
  if (page === "contact") {
    return {
      eyebrow,
      title: sv ? "Kontakt och kundservice" : "Contact and support",
      description: sv
        ? "Kontakta Noorly om din beställning, leverans, retur eller en produktfråga."
        : "Contact Noorly about your order, delivery, return or a product question.",
      sections: [
        sections.seller,
        {
          id: "order-help",
          heading: sv ? "Hjälp med ditt köp" : "Help with your purchase",
          paragraphs: [
            sv
              ? "Ange gärna ditt ordernummer när du kontaktar oss om ett köp. Skicka aldrig kortuppgifter eller lösenord via e-post."
              : "Please include your order number if available when contacting us about a purchase. Never send card details or passwords by email.",
          ],
          links: [
            {
              label: sv
                ? "Leverans, ångerrätt och retur"
                : "Delivery, withdrawal and returns",
              href: `/${locale}/shipping-returns`,
            },
            customerWithdrawalLink(locale),
          ],
        },
      ],
    };
  }
  if (page === "privacy") {
    return {
      eyebrow: sv ? "DIN INTEGRITET" : "YOUR PRIVACY",
      title: sv
        ? "Så hanterar vi dina uppgifter"
        : "How we handle your information",
      description: sv
        ? "Information om hur Noorly AB använder uppgifter för köp, kundservice och webbplatsens funktion."
        : "How Noorly AB uses information for purchases, customer service and the operation of this website.",
      sections: [
        {
          ...sections.seller,
          heading: sv ? "Personuppgiftsansvarig" : "Data controller",
        },
        {
          id: "personal-data",
          heading: sv
            ? "Köp och kundservice"
            : "Purchases and customer service",
          paragraphs: sv
            ? [
                "Vi använder de namn-, kontakt-, leverans- och orderuppgifter du lämnar för att hantera ditt köp, leverera varor, svara på frågor och hantera returer eller reklamationer. Behandlingen behövs för att fullgöra köpet och våra skyldigheter enligt lag. Uppgifter i andra förfrågningar används för att kunna svara på dem.",
                "Shopify tillhandahåller kassa, betalnings- och ordertjänster samt kundkonton. De uppgifter som behövs för leveransen lämnas till transportören. Shopify beskriver sin egen behandling, sina internationella överföringar och tillämpliga skyddsåtgärder i sin integritetspolicy.",
                "Vi sparar uppgifter så länge de behövs för ditt köp, kundservice eller skyldigheter enligt lag. Kontakta oss om du vill veta mer om de uppgifter som rör dig.",
              ]
            : [
                "We use the name, contact, delivery and order details you provide to handle your purchase, deliver goods, answer questions and manage returns or complaints. This processing is necessary to fulfil the purchase and our legal obligations. Information in other enquiries is used to respond to them.",
                "Shopify provides checkout, payment and order services, and customer accounts. Information needed for delivery is shared with the carrier. Shopify describes its own processing, international transfers and applicable safeguards in its privacy policy.",
                "We retain information for as long as it is needed for your purchase, customer service or legal obligations. Contact us for more information about the data relating to you.",
              ],
          links: [
            {
              label: sv
                ? "Shopifys integritetspolicy"
                : "Shopify privacy policy",
              href: "https://www.shopify.com/legal/privacy",
            },
          ],
        },
        {
          id: "privacy-choices",
          heading: sv ? "Dina val och rättigheter" : "Your choices and rights",
          paragraphs: sv
            ? [
                "Nödvändig lagring används för webbplatsens funktion, varukorgen och dina cookieval. Frivillig analys och marknadsföring på den här webbplatsen aktiveras bara med ditt samtycke. Du kan ändra framtida användning genom Cookieinställningar i sidfoten. Shopifys kassa och tjänster kan ha egna inställningar och information.",
                `Kontakta ${brand.supportEmail} om du vill begära tillgång till, rättelse eller radering av uppgifter, begränsa behandling, invända eller begära dataportabilitet. Rättigheterna gäller enligt förutsättningarna i dataskyddsreglerna. Du kan också lämna klagomål till Integritetsskyddsmyndigheten (IMY).`,
              ]
            : [
                "Necessary storage supports the website, your cart and cookie preferences. Optional analytics and marketing on this website operate only with your consent. You can change future use through Cookie settings in the footer. Shopify checkout and services may provide their own settings and information.",
                `Contact ${brand.supportEmail} to request access, correction or deletion, restrict processing, object or request data portability. These rights apply under the conditions in data protection law. You can also complain to Sweden's data protection authority, IMY.`,
              ],
          links: [
            {
              label: sv
                ? "Dina rättigheter hos IMY"
                : "Data protection rights at IMY",
              href: "https://www.imy.se/privatperson/dataskydd/dina-rattigheter/",
            },
          ],
        },
      ],
    };
  }
  return undefined;
}
