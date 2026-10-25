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

// Legal sources checked 25 October 2026: DAL 2005:59, chapter 2 §§2–15;
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
  const address =
    brand.address.street && brand.address.postalCode && brand.address.city
      ? `${brand.address.street}, ${brand.address.postalCode} ${brand.address.city}, ${sv ? "Sverige" : "Sweden"}`
      : "";
  const seller: PolicySection = {
    id: "seller",
    heading: sv ? "Säljare och kontakt" : "Seller and contact",
    paragraphs: [
      brand.legalCompanyName || brand.name,
      ...(address ? [address] : []),
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
          "Ljussand och teakskål kan köpas var för sig eller tillsammans som paket. En påse ljussand med 300 g och fyra bomullsvekar kostar 349 kr utan doft eller 449 kr med doft. Den dekorativa teakskålen kostar 550 kr.",
          "Paketet innehåller en dekorativ teakskål och en påse ljussand med 300 g och fyra bomullsvekar. Paketpriset är 699 kr med vit, doftfri ljussand eller 749 kr med ljussand i vald färg och doft. Alla priser inkluderar moms och leverans inom Sverige; ingen extra fraktavgift tillkommer.",
          "Produkterna säljs som förbeställning. Vi skickar din beställning så snart varan finns i lager hos oss. Du får en orderbekräftelse via e-post och spårningsinformation när sådan finns tillgänglig.",
          "Om vi inte har avtalat om en annan leveranstid ska leveransen ske utan onödigt dröjsmål och senast 30 dagar efter att avtalet ingicks.",
          `Kontakta ${email} om leveransen dröjer eller paketet skadas eller försvinner. Vi ansvarar för leveransen tills du har tagit emot varan. Vid försening kan du kräva leverans och, när konsumentköplagens förutsättningar är uppfyllda, häva köpet och få tillbaka det du har betalat.`,
        ]
      : [
          "Candle sand and the teak bowl can be bought individually or together as a bundle. One 300 g pouch of candle sand with four cotton wicks costs SEK 349 unscented or SEK 449 scented. The decorative teak bowl costs SEK 550.",
          "The bundle contains one decorative teak bowl and one 300 g pouch of candle sand with four cotton wicks. The bundle price is SEK 699 with white, unscented candle sand or SEK 749 with candle sand in your chosen colour and scent. All prices include VAT and delivery within Sweden, with no additional shipping charge.",
          "Products are available to pre-order. We dispatch your order as soon as the goods arrive in stock with us. You receive an order confirmation by email and tracking information when available.",
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
              ? "Du kan använda länken Ångra avtalet här. Logga in med e-postadressen från ditt köp, välj beställningen och bekräfta vilka varor du vill ångra. Du får en bekräftelse via e-post när din begäran har tagits emot."
              : "You can use Withdraw from your purchase. Sign in with the email address used for your purchase, select the order and confirm which items you wish to withdraw from. You receive an email confirmation when your request is received.",
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
          address
            ? `Returadress: ${brand.legalCompanyName || brand.name}, ${address}. Kontakta ${email} om du behöver hjälp med returen.`
            : `Kontakta ${email} för returadress och returinstruktioner.`,
          "Låt varan vara oanvänd och otänd om du överväger en retur. Behåll helst förpackningen oöppnad och skicka tillbaka alla medföljande delar, gärna i originalförpackningen.",
          "En öppnad förpackning utesluter inte automatiskt lagstadgad ångerrätt. Om varan har tänts, förbrukats, skadats eller hanterats mer än nödvändigt för att fastställa dess egenskaper och funktion kan återbetalningen minskas med den faktiska värdeminskningen enligt lag.",
        ]
      : [
          "Return the goods without unnecessary delay and within 14 days of notifying us of your withdrawal. You pay the direct return postage when changing your mind. Pack the goods carefully and retain proof of posting.",
          address
            ? `Return address: ${brand.legalCompanyName || brand.name}, ${address}. Contact ${email} if you need help with your return.`
            : `Contact ${email} for the return address and return instructions.`,
          "Keep the goods unused and unlit if you are considering a return. Preferably leave the packaging unopened and return all included parts, ideally in the original packaging.",
          "Opening the packaging does not automatically exclude your statutory right of withdrawal. If goods have been lit, consumed, damaged or handled beyond what is necessary to establish their characteristics and function, the refund may be reduced by the actual diminished value as permitted by law.",
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
          "Dessa villkor gäller när du som konsument handlar hos Noorly med leverans inom Sverige. Produktens innehåll och valda alternativ framgår på produktsidan och i din beställning.",
          "Priser anges i svenska kronor inklusive moms. Ljussand och teakskål kan köpas var för sig eller tillsammans till paketpris, och leverans inom Sverige ingår. Kontrollera valda varor, färg och doft, leveransadress och totalbelopp innan du bekräftar köpet.",
          "Betalning sker i vår säkra kassa med de betalningssätt som visas där. Du får en orderbekräftelse via e-post. Kontakta oss om någon uppgift i beställningen är fel.",
        ]
      : [
          "These terms apply when you buy from Noorly as a consumer for delivery within Sweden. The product contents and selected options are shown on the product page and in your order.",
          "Prices are in Swedish kronor and include VAT. Candle sand and the teak bowl can be bought individually or together at a bundle price, and delivery within Sweden is included. Check your items, selected colour and scent, delivery address and total before confirming your purchase.",
          "Payment is completed through our secure checkout using the payment methods shown there. You receive an order confirmation by email. Contact us if any order detail is incorrect.",
        ],
  };
  // Network Intelligence is enabled. Keep the named controller disclosure in
  // terms/privacy, as required by the platform terms and data-processing terms.
  const dataServices: PolicySection = {
    id: "data-services",
    heading: sv
      ? "Handelsplattform och personuppgifter"
      : "Commerce platform and personal data",
    paragraphs: sv
      ? [
          "Vår butiks handelsplattform, kassa och orderhantering tillhandahålls och driftas av Shopify. Shopify samlar in och behandlar personuppgifter när du använder butiken eller handlar hos oss. Uppgifter delas med Shopify och andra tjänsteleverantörer som kan finnas i andra länder.",
          "Shopify Network Intelligence är aktiverat. Shopify är självständigt personuppgiftsansvarig för utökade tjänster som analys, anpassning och annonsering, där uppgifter om dina interaktioner med vår butik kan kombineras med uppgifter från andra handlare och Shopify. Läs konsumentintegritetspolicyn och använd integritetsportalen för information om dina rättigheter, inklusive att återkalla samtycke eller invända där det är tillämpligt.",
        ]
      : [
          "Our store’s commerce platform, checkout and order services are hosted and operated by Shopify. Shopify collects and processes personal data when you browse or buy from our store. Information is shared with Shopify and other service providers that may be in other countries.",
          "Shopify Network Intelligence is enabled. Shopify acts as an independent controller for Enhanced Services such as analytics, personalization and advertising, which may combine information about your interactions with our store, other merchants and Shopify. Read the Consumer Privacy Policy and use the privacy portal for information about your rights, including withdrawing consent or objecting where applicable.",
        ],
    links: [
      {
        label: sv
          ? "Shopifys konsumentintegritetspolicy"
          : "Shopify Consumer Privacy Policy",
        href: "https://www.shopify.com/legal/privacy/consumers",
      },
      {
        label: sv ? "Shopifys integritetsportal" : "Shopify privacy portal",
        href: "https://privacy.shopify.com/",
      },
    ],
  };
  return {
    seller,
    order,
    delivery,
    withdrawal,
    returns,
    refunds,
    complaints,
    dataServices,
  };
}

export function getCustomerPolicy(
  locale: Locale,
  page: string,
): CustomerPolicy | undefined {
  const sv = locale === "sv";
  const sections = customerPolicySections(locale);
  const eyebrow = sv ? "KUNDSERVICE" : "CUSTOMER CARE";
  const meta: PolicySection = {
    id: "meta-marketing",
    heading: sv ? "Meta och annonsmätning" : "Meta and advertising measurement",
    paragraphs: sv
      ? [
          "Med ditt samtycke använder vi Meta för att mäta annonser och matcha besök och köp. Butikssidorna skickar sidvisningar, produktvisningar, varukorgshändelser och påbörjad kassa via Meta Pixel. Kassans anslutning använder nivån Maximum med Meta Pixel, avancerad matchning och Conversions API, och kan använda nya tekniker som ingår i denna nivå.",
          "Kontaktuppgifter som namn, e-postadress, telefonnummer och plats samt webbläsar-, besöks- och köpdata kan delas med Meta för konverteringsmatchning och annonsoptimering, enligt dina samtyckesval. Matchningsuppgifter kan hashkodas före överföring; det gör dem inte anonyma. Meta kan behandla uppgifter i andra länder. Läs Metas integritetspolicy för information om lagring, användning och rättigheter.",
          "Du kan neka eller återkalla Marknadsföring i Cookieinställningar. Kassan har egna samtyckesinställningar som du också kan ändra där. Meta-pixeln i kassan kräver tillstånd för både analys och marknadsföring och respekterar avstående från dataförsäljning. Meta kan använda _fbp och _fbc (upp till 90 dagar). Ett avslag hindrar inte köp. Återkallelse stoppar framtida insamling men raderar inte automatiskt redan överförda uppgifter.",
        ]
      : [
          "With your consent, we use Meta to measure advertising and match visits and purchases. Shopping pages send page views, product views, cart events and checkout starts through Meta Pixel. The checkout connection uses Maximum sharing with Meta Pixel, advanced matching and Conversions API, and may use new technologies included in that level.",
          "Contact details such as name, email, phone number and location, together with browser, browsing and purchase information, may be shared with Meta for conversion matching and ad optimization according to your consent choices. Matching details may be hashed before transfer; this does not make them anonymous. Meta may process data in other countries. Its privacy policy explains retention, use and your rights.",
          "Reject or withdraw Marketing in Cookie settings. Checkout has its own consent settings, which you can also change there. The checkout Meta pixel requires both analytics and marketing permission and respects a data-sale opt-out. Meta may use _fbp and _fbc (up to 90 days). Rejecting does not prevent shopping. Withdrawal stops future collection but does not automatically erase previously transferred information.",
        ],
    links: [
      {
        label: sv ? "Metas integritetspolicy" : "Meta privacy policy",
        href: "https://www.facebook.com/privacy/policy/",
      },
    ],
  };
  const heatmaps: PolicySection = {
    id: "heatmaps",
    heading: sv
      ? "Värmekartor och sessionsinspelningar"
      : "Heatmaps and session recordings",
    paragraphs: sv
      ? [
          "Med ditt samtycke till Analys använder vi Microsoft Clarity för att förstå klick, scrollning och hur publika butikssidor används. Microsoft får teknisk information om webbläsare och enhet, sidans adress och maskerade interaktioner. Detta hjälper oss att förbättra webbplatsen.",
          "All text och bildinnehåll maskeras i inspelningar. Formulär, varukorg, konto, administration och kassa är undantagna, liksom besök med frågeparametrar i adressen. Vi skickar inte namn, e-post, orderuppgifter eller ett eget kund-ID till Clarity. Microsofts annonslagring aktiveras inte av denna funktion.",
          "Clarity kan använda _clck (upp till ett år) och _clsk (upp till ett dygn) för att koppla ihop besök och sidvisningar. Inspelningar sparas normalt i 30 dagar; värmekartor och vissa sparade inspelningar kan finnas i upp till 9 månader. Du kan neka eller återkalla Analys i Cookieinställningar. Då stoppas insamlingen och dessa cookies tas bort; sidan kan laddas om. Återkallelse raderar inte automatiskt redan insamlade uppgifter. Kontakta oss för frågor eller rättighetsbegäran.",
          "Microsoft kan behandla uppgifter i andra länder enligt sin integritetspolicy. Läs Microsofts information om behandling, lagring och dina rättigheter via länkarna nedan.",
        ]
      : [
          "With your Analytics consent, we use Microsoft Clarity to understand clicks, scrolling and use of public shopping pages. Microsoft receives technical browser/device information, the page address and masked interactions to help us improve the website.",
          "All text and image content is masked in recordings. Forms, cart, account, administration and checkout are excluded, as are visits with query parameters in the address. We do not send names, email addresses, order details or a custom customer ID to Clarity. This feature does not enable Microsoft advertising storage.",
          "Clarity may use _clck (up to one year) and _clsk (up to one day) to link visits and page views. Recordings are normally retained for 30 days; heatmaps and some saved recordings may be retained for up to 9 months. Reject or withdraw Analytics in Cookie settings to stop collection and delete these cookies; the page may reload. Withdrawal does not automatically erase previously collected data. Contact us with questions or rights requests.",
          "Microsoft may process data in other countries under its privacy policy. The links below explain Microsoft's processing, retention and your rights.",
        ],
    links: [
      {
        label: sv
          ? "Microsofts integritetspolicy"
          : "Microsoft Privacy Statement",
        href: "https://privacy.microsoft.com/privacystatement",
      },
      {
        label: sv ? "Clarity och datalagring" : "Clarity data retention",
        href: "https://learn.microsoft.com/en-us/clarity/data-retention",
      },
    ],
  };
  if (page === "cookies")
    return {
      eyebrow: sv ? "DINA VAL" : "YOUR CHOICES",
      title: sv ? "Cookies och dina val" : "Cookies and your choices",
      description: sv
        ? "Nödvändiga funktioner och separata val för analys och marknadsföring."
        : "Necessary functions and separate analytics and marketing choices.",
      sections: [
        {
          id: "cookie-choices",
          heading: sv ? "Du bestämmer" : "You decide",
          paragraphs: sv
            ? [
                "Nödvändig lagring håller varukorg, säkerhet och cookieval igång. Valen sparas i upp till 180 dagar. Analys och marknadsföring är frivilliga och separata. Du kan handla även om du avvisar båda och ändra dina val i Cookieinställningar i sidfoten.",
                "Shopify-analys mäter sid- och produktvisningar. Våra slumpmässiga besöks-ID:n sparas i upp till 180 dagar och sessions-ID:n förnyas efter 30 minuters inaktivitet. De tas bort vid återkallelse. Meta-pixeln mäter shoppinghändelser för annonsutvärdering endast med marknadsföringssamtycke. Kassans egna integritetsval gäller där.",
              ]
            : [
                "Necessary storage keeps your cart, security and cookie choices working. Choices are stored for up to 180 days. Analytics and marketing are optional, separate categories. You can shop after rejecting both and change your choices using Cookie settings in the footer.",
                "Shopify analytics measures page and product views. Our random visitor IDs last up to 180 days; session IDs renew after 30 minutes of inactivity. These IDs are deleted on withdrawal. The Meta pixel measures shopping events for ad evaluation only with marketing consent. Checkout has its own privacy choices.",
              ],
        },
        heatmaps,
        meta,
      ],
    };
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
        ? "Villkor för ditt köp hos Noorly: betalning, leverans, ångerrätt och reklamation."
        : "Terms for your purchase from Noorly: payment, delivery, withdrawal and complaints.",
      sections: [
        sections.seller,
        sections.order,
        sections.dataServices,
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
        ? "Information om hur Noorly använder uppgifter för köp, kundservice och webbplatsens funktion."
        : "How Noorly uses information for purchases, customer service and the operation of this website.",
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
                "De uppgifter som behövs för leveransen lämnas till transportören.",
                "Vi sparar uppgifter så länge de behövs för ditt köp, kundservice eller skyldigheter enligt lag. Kontakta oss om du vill veta mer om de uppgifter som rör dig.",
              ]
            : [
                "We use the name, contact, delivery and order details you provide to handle your purchase, deliver goods, answer questions and manage returns or complaints. This processing is necessary to fulfil the purchase and our legal obligations. Information in other enquiries is used to respond to them.",
                "Information needed for delivery is shared with the carrier.",
                "We retain information for as long as it is needed for your purchase, customer service or legal obligations. Contact us for more information about the data relating to you.",
              ],
        },
        sections.dataServices,
        {
          id: "privacy-choices",
          heading: sv ? "Dina val och rättigheter" : "Your choices and rights",
          paragraphs: sv
            ? [
                "Nödvändig lagring används för webbplatsens funktion, varukorgen och dina cookieval. Frivillig analys och marknadsföring på den här webbplatsen aktiveras bara med ditt samtycke. Du kan ändra framtida användning genom Cookieinställningar i sidfoten. Kassan och anslutna tjänster kan ha egna inställningar och information.",
                `Kontakta ${brand.supportEmail} om du vill begära tillgång till, rättelse eller radering av uppgifter, begränsa behandling, invända eller begära dataportabilitet. Rättigheterna gäller enligt förutsättningarna i dataskyddsreglerna. Du kan också lämna klagomål till Integritetsskyddsmyndigheten (IMY).`,
              ]
            : [
                "Necessary storage supports the website, your cart and cookie preferences. Optional analytics and marketing on this website operate only with your consent. You can change future use through Cookie settings in the footer. Checkout and connected services may provide their own settings and information.",
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
        heatmaps,
        meta,
      ],
    };
  }
  return undefined;
}
