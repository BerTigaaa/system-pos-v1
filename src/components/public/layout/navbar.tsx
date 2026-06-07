import { auth } from "@/lib/auth";
import NavbarClient from "./navbar-client";

export const dynamic = "force-dynamic";

export default async function Navbar() {
  const session = await auth();

  const isLoggedIn = !!session?.user;

  return <NavbarClient isLoggedIn={isLoggedIn} />;
}