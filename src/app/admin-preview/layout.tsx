import "@/styles/admin-preview.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin | Noorly",
  robots: { index: false, follow: false },
};
export default function AdminPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
