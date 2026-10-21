export function PresaleHold({ locale }: { locale: "sv" | "en" }) {
  const swedish = locale === "sv";
  return (
    <main id="main-content" className="presale-hold">
      <div className="presale-hold__content">
        <p className="presale-hold__brand">NOORLY</p>
        <h1>{swedish ? "Vi förbereder Noorly." : "We’re preparing Noorly."}</h1>
        <p className="presale-hold__intro">
          {swedish
            ? "En liten ljusstund, på ditt sätt."
            : "A little candlelit moment, your way."}
        </p>
        <div className="presale-hold__notice">
          <h2>
            {swedish
              ? "Förbeställningen är ännu inte öppen"
              : "Preorders are not open yet"}
          </h2>
          <p>
            {swedish
              ? "Vi inväntar bekräftad tillgång och leveransperiod för vår ljussand. Du kan inte beställa eller betala här ännu."
              : "We’re waiting for confirmed availability and a delivery window for our candle sand. You cannot order or pay here yet."}
          </p>
          <p>
            {swedish
              ? "Innan vi öppnar visar vi innehåll, totalpris, frakt, betalningsvillkor och beräknad avsändningsperiod samt information om avbeställning och ångerrätt."
              : "Before opening, we’ll show the contents, total price, shipping, payment terms, estimated dispatch window, and cancellation and withdrawal information."}
          </p>
        </div>
      </div>
    </main>
  );
}
