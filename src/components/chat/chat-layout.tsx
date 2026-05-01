"use client";

import { useState } from "react";
import { ChatWindow } from "@/components/chat/chat-window";
import { ConversationList } from "@/components/chat/conversation-list";

export function ChatLayout() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [selectedParticipants, setSelectedParticipants] = useState<
    string[]
  >([]);

  return (
    <div className="grid grid-cols-3 gap-4 h-screen p-4 bg-gray-50">
      {/* Sidebar */}
      <div className="col-span-1 border rounded-lg bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold">Messages</h2>
        </div>
        <ConversationList
          selectedConversationId={selectedConversationId || undefined}
          onSelectConversation={(id) => {
            setSelectedConversationId(id);
          }}
        />
      </div>

      {/* Chat area */}
      <div className="col-span-2">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            participantIds={selectedParticipants}
          />
        ) : (
          <div className="flex items-center justify-center h-full rounded-lg bg-white border text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
