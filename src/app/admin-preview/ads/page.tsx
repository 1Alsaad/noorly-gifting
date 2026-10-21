import { redirect } from "next/navigation";
import { hasAdminPreviewSession } from "@/lib/security/admin-preview";

export default async function FormerAdGallery() {
  if (!(await hasAdminPreviewSession())) redirect("/admin-preview");
  redirect("/sv");
}
