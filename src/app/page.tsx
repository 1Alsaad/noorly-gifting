import { redirect } from "next/navigation";
import { brand } from "@/config/brand";
export default function Index() {
  redirect(`/${brand.defaultLocale}`);
}
