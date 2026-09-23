import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import ChatInbox from "@/components/admin/ChatInbox";

export default async function AdminChatPage({ searchParams }: { searchParams: Promise<{ conversation?: string }> }) {
  const admin = await getAdmin();
  const params = await searchParams;
  if (!admin) redirect(`/admin/login${params.conversation ? `?conversation=${encodeURIComponent(params.conversation)}` : ""}`);
  return <ChatInbox adminEmail={admin.email} />;
}
