import { ChatLayout } from "@/components/chat";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="h-screen">
      <ChatLayout />
    </div>
  );
}
