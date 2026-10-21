import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminPreviewSession } from "@/lib/security/admin-preview";

const drafts = [
  {
    label: "A / PRODUKTEN",
    headline: "Doft och levande ljus till hemmakvällen.",
    body: "Vi förbereder ett erbjudande med doftande ljussand. Se vad som planeras och vad som ingår. Försäljningen är ännu inte öppen.",
    cta: "Läs om ljussand",
  },
  {
    label: "B / PRESENTIDÉN",
    headline: "En presentidé för den som tycker om att skapa hemma.",
    body: "Upptäck hur ljussand används med vekar och ett lämpligt kärl. Vi arbetar med innehåll, pris och leveransvillkor inför ett möjligt släpp. Ingen beställning eller betalning tas emot ännu.",
    cta: "Se vad vi förbereder",
  },
];

export default async function AdminAdDrafts() {
  if (!(await hasAdminPreviewSession())) redirect("/admin-preview");
  return (
    <main className="admin-preview-page" id="main-content">
      <div className="admin-preview-drafts">
        <p className="eyebrow">NOORLY / ANNONSUTKAST</p>
        <h1>Två vinklar. Samma ärliga erbjudande.</h1>
        <p>
          Textutkast för granskning. Inga bildannonser är färdiga, schemalagda
          eller aktiverade. Pris, innehåll och leveransvillkor behöver
          fastställas före köpannonsering.
        </p>
        <div className="admin-preview-grid">
          {drafts.map((draft) => (
            <article className="admin-preview-card" key={draft.label}>
              <p className="eyebrow">{draft.label}</p>
              <span className="admin-preview-status">
                UTKAST / EJ PUBLICERAD
              </span>
              <h2>{draft.headline}</h2>
              <p>{draft.body}</p>
              <p>
                <strong>Föreslagen knapp:</strong> {draft.cta}
              </p>
              <div className="admin-preview-image-note">
                Ingen godkänd annonsbild ännu. Endast verifierade produktbilder
                eller granskade provbilder får användas.
              </div>
            </article>
          ))}
        </div>
        <p>
          Dessa förberedelseutkast ska inte använda budgeten för köpvalidering
          medan försäljningen är stängd.
        </p>
        <Link className="text-link" href="/sv">
          Till butikens förhandsvisning
        </Link>
      </div>
    </main>
  );
}
