import { redirect } from "next/navigation";
import { configured, serverClient, permitted } from "@/lib/supabase/server";
import Workspace from "@/components/workspace";
import Setup from "@/components/setup";
export const dynamic = "force-dynamic";
export default async function Home() {
  if (!configured()) return <Setup />;
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  if (!permitted(user.email)) return <Setup denied />;
  return <Workspace email={user.email || ""} />;
}
