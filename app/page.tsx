import { redirect } from "next/navigation";

// La app es pública — cualquier usuario puede acceder sin login
export default function Home() {
  redirect("/evacuacion");
}
