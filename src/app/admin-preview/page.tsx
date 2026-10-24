import Link from "next/link";
import { hasAdminPreviewSession } from "@/lib/security/admin-preview";

export default async function AdminPreviewLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const signedIn = await hasAdminPreviewSession();
  return (
    <main className="admin-preview-page" id="main-content">
      <div className="admin-preview-card">
        <p className="eyebrow">NOORLY / INTERN VISNING</p>
        <h1>Se vad vi bygger.</h1>
        <p>
          Logga in för att granska Noorlys produktsidor och köpupplevelse.
          Kundernas beställning och betalning är fortfarande avstängda.
        </p>
        {signedIn ? (
          <div className="admin-preview-actions">
            <Link className="button button-dark" href="/sv">
              Visa butiken
            </Link>
            <Link className="text-link" href="/admin-preview/ads">
              Visa annonsutkast
            </Link>
            <form action="/api/admin-preview" method="post">
              <input type="hidden" name="action" value="logout" />
              <button className="text-link" type="submit">
                Logga ut
              </button>
            </form>
          </div>
        ) : (
          <form
            action="/api/admin-preview"
            method="post"
            className="admin-preview-form"
          >
            <label htmlFor="admin-preview-password">
              Administratörslösenord
            </label>
            <input
              id="admin-preview-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
            />
            {error === "invalid" && (
              <p role="alert">Fel lösenord. Försök igen.</p>
            )}
            <button className="button button-dark" type="submit">
              Visa förhandsvisningen
            </button>
          </form>
        )}
        <Link className="text-link" href="/sv">
          Till den publika sidan
        </Link>
      </div>
    </main>
  );
}
