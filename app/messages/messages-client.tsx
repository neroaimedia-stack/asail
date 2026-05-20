"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  markConversationRead,
  sendMessage,
  startBusinessConversation,
  startCreatorInvitedConversation,
} from "./actions";
import { createClient } from "@/lib/supabase/client";

export type ConversationSummary = {
  avatarInitials: string;
  avatarUrl: string | null;
  campaignId: string | null;
  campaignTitle: string | null;
  id: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  otherHandle: string | null;
  otherName: string;
  unreadCount: number;
};

export type MessageItem = {
  content: string;
  conversationId: string;
  createdAt: string;
  id: string;
  read: boolean;
  senderId: string;
};

type CreatorOption = {
  fullName: string;
  handle: string;
  id: string;
};

type CampaignOption = {
  id: string;
  title: string;
};

type InvitedConversationOption = {
  businessName: string;
  campaignTitle: string;
  id: string;
};

type MessagesClientProps = {
  campaignOptions: CampaignOption[];
  conversations: ConversationSummary[];
  creatorOptions: CreatorOption[];
  currentUserId: string;
  invitedOptions: InvitedConversationOption[];
  isBusiness: boolean;
  selectedConversationId: string | null;
  selectedMessages: MessageItem[];
};

function formatTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "Now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFullTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function handleWithAt(handle: string | null) {
  if (!handle) {
    return null;
  }

  return handle.startsWith("@") ? handle : `@${handle}`;
}

function shouldGroup(previous: MessageItem | undefined, current: MessageItem) {
  if (!previous || previous.senderId !== current.senderId) {
    return false;
  }

  return (
    new Date(current.createdAt).getTime() -
      new Date(previous.createdAt).getTime() <=
    60000
  );
}

export function MessagesClient({
  campaignOptions,
  conversations,
  creatorOptions,
  currentUserId,
  invitedOptions,
  isBusiness,
  selectedConversationId,
  selectedMessages,
}: MessagesClientProps) {
  const [conversationRows, setConversationRows] = useState(conversations);
  const [error, setError] = useState("");
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState(selectedMessages);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = conversationRows.find(
    (conversation) => conversation.id === selectedConversationId,
  );
  const filteredConversations = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return conversationRows;
    }

    return conversationRows.filter((conversation) => {
      return [
        conversation.otherName,
        conversation.otherHandle ?? "",
        conversation.campaignTitle ?? "",
        conversation.lastMessagePreview,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [conversationRows, query]);

  useEffect(() => {
    setConversationRows(conversations);
  }, [conversations]);

  useEffect(() => {
    setMessages(selectedMessages);
  }, [selectedMessages]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    markConversationRead(selectedConversationId);
    setConversationRows((rows) =>
      rows.map((conversation) =>
        conversation.id === selectedConversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      ),
    );
  }, [selectedConversationId]);

  useEffect(() => {
    const supabase = createClient();
    const conversationIds = new Set(conversations.map((row) => row.id));
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const rawMessage = payload.new as {
            content: string;
            conversation_id: string;
            created_at: string;
            id: string;
            read: boolean;
            sender_id: string;
          };
          const nextMessage: MessageItem = {
            content: rawMessage.content,
            conversationId: rawMessage.conversation_id,
            createdAt: rawMessage.created_at,
            id: rawMessage.id,
            read: rawMessage.read,
            senderId: rawMessage.sender_id,
          };

          if (!conversationIds.has(nextMessage.conversationId)) {
            return;
          }

          setConversationRows((rows) =>
            rows
              .map((conversation) => {
                if (conversation.id !== nextMessage.conversationId) {
                  return conversation;
                }

                const isOpen = conversation.id === selectedConversationId;
                const isMine = nextMessage.senderId === currentUserId;

                return {
                  ...conversation,
                  lastMessageAt: nextMessage.createdAt,
                  lastMessagePreview: nextMessage.content,
                  unreadCount: isOpen || isMine ? 0 : conversation.unreadCount + 1,
                };
              })
              .sort(
                (first, second) =>
                  new Date(second.lastMessageAt).getTime() -
                  new Date(first.lastMessageAt).getTime(),
              ),
          );

          if (nextMessage.conversationId === selectedConversationId) {
            setMessages((items) =>
              items.some((item) => item.id === nextMessage.id)
                ? items
                : [...items, nextMessage],
            );

            if (nextMessage.senderId !== currentUserId) {
              markConversationRead(nextMessage.conversationId);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversations, currentUserId, selectedConversationId]);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-950">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-stone-200 bg-white md:border-b-0 md:border-r">
          <div className="border-b border-stone-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <Link className="text-lg font-semibold" href="/">
                Asail
              </Link>
              {isBusiness || invitedOptions.length ? (
                <button
                  className="rounded-md bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                  onClick={() => setIsNewMessageOpen(true)}
                  type="button"
                >
                  New message
                </button>
              ) : null}
            </div>
            <label className="mt-4 block">
              <span className="sr-only">Search conversations</span>
              <input
                className="h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search conversations"
                value={query}
              />
            </label>
          </div>

          <div className="max-h-[calc(100vh-129px)] overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <Link
                className={`flex gap-3 border-b border-stone-100 px-4 py-4 transition hover:bg-stone-50 ${
                  conversation.id === selectedConversationId ? "bg-stone-100" : ""
                }`}
                href={`/messages?conversation=${conversation.id}`}
                key={conversation.id}
              >
                <Avatar
                  initials={conversation.avatarInitials}
                  name={conversation.otherName}
                  url={conversation.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold">
                        {conversation.otherName}
                      </h2>
                      {conversation.campaignTitle ? (
                        <p className="mt-0.5 truncate text-xs text-stone-500">
                          {conversation.campaignTitle}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs text-stone-500">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="truncate text-sm text-stone-600">
                      {conversation.lastMessagePreview}
                    </p>
                    {conversation.unreadCount > 0 ? (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}

            {!filteredConversations.length ? (
              <div className="px-5 py-12 text-center text-sm text-stone-500">
                No conversations yet.
              </div>
            ) : null}
          </div>
        </aside>

        <section className="flex min-h-[70vh] flex-col bg-stone-50 md:min-h-screen">
          {selectedConversation ? (
            <>
              <header className="flex items-center justify-between gap-4 border-b border-stone-200 bg-white px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    initials={selectedConversation.avatarInitials}
                    name={selectedConversation.otherName}
                    url={selectedConversation.avatarUrl}
                  />
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-semibold">
                      {selectedConversation.otherName}
                    </h1>
                    <p className="truncate text-sm text-stone-500">
                      {handleWithAt(selectedConversation.otherHandle)}
                    </p>
                  </div>
                </div>
                {selectedConversation.campaignId &&
                selectedConversation.campaignTitle ? (
                  <Link
                    className="hidden rounded-md border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 sm:inline-flex"
                    href={
                      isBusiness
                        ? `/business/campaigns/${selectedConversation.campaignId}`
                        : `/creator/browse/${selectedConversation.campaignId}`
                    }
                  >
                    {selectedConversation.campaignTitle}
                  </Link>
                ) : null}
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="mx-auto flex max-w-3xl flex-col">
                  {messages.map((message, index) => {
                    const mine = message.senderId === currentUserId;
                    const grouped = shouldGroup(messages[index - 1], message);

                    return (
                      <div
                        className={`group flex ${mine ? "justify-end" : "justify-start"} ${
                          grouped ? "mt-1" : "mt-4"
                        }`}
                        key={message.id}
                      >
                        <div
                          className={`max-w-[78%] rounded-lg px-4 py-2 text-sm leading-6 shadow-sm ${
                            mine
                              ? "bg-stone-950 text-white"
                              : "border border-stone-200 bg-white text-stone-800"
                          }`}
                          title={formatFullTime(message.createdAt)}
                        >
                          <p className="whitespace-pre-line">{message.content}</p>
                          <span
                            className={`mt-1 hidden text-[11px] group-hover:block ${
                              mine ? "text-stone-300" : "text-stone-500"
                            }`}
                          >
                            {formatFullTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </div>

              <form
                action={async (formData) => {
                  setError("");
                  const result = await sendMessage(formData);

                  if (result?.error) {
                    setError(result.error);
                    return;
                  }

                  const sentMessage = result?.message;

                  if (sentMessage) {
                    setMessages((items) =>
                      items.some((item) => item.id === sentMessage.id)
                        ? items
                        : [...items, sentMessage],
                    );
                    setConversationRows((rows) =>
                      rows
                        .map((conversation) =>
                          conversation.id === sentMessage.conversationId
                            ? {
                                ...conversation,
                                lastMessageAt: sentMessage.createdAt,
                                lastMessagePreview: sentMessage.content,
                              }
                            : conversation,
                        )
                        .sort(
                          (first, second) =>
                            new Date(second.lastMessageAt).getTime() -
                            new Date(first.lastMessageAt).getTime(),
                        ),
                    );
                  }

                  setMessageText("");
                }}
                className="border-t border-stone-200 bg-white p-4"
              >
                <input
                  name="conversationId"
                  type="hidden"
                  value={selectedConversation.id}
                />
                {error ? (
                  <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                ) : null}
                <div className="mx-auto flex max-w-3xl items-end gap-3">
                  <label className="flex-1">
                    <span className="sr-only">Message</span>
                    <textarea
                      className="max-h-36 min-h-12 w-full resize-none rounded-md border border-stone-300 px-3 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
                      name="content"
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      placeholder="Write a message..."
                      rows={1}
                      value={messageText}
                    />
                  </label>
                  <button
                    className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                    disabled={!messageText.trim()}
                    type="submit"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-5 py-16 text-center">
              <div>
                <h1 className="text-xl font-semibold">Messages</h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-stone-600">
                  Conversations with businesses and creators will appear here.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {isNewMessageOpen ? (
        isBusiness ? (
          <NewMessageModal
            campaignOptions={campaignOptions}
            creatorOptions={creatorOptions}
            onClose={() => setIsNewMessageOpen(false)}
          />
        ) : (
          <InvitedMessageModal
            invitedOptions={invitedOptions}
            onClose={() => setIsNewMessageOpen(false)}
          />
        )
      ) : null}
    </main>
  );
}

function InvitedMessageModal({
  invitedOptions,
  onClose,
}: {
  invitedOptions: InvitedConversationOption[];
  onClose: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4"
      role="dialog"
    >
      <form
        action={startCreatorInvitedConversation}
        className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">New message</h2>
            <p className="mt-1 text-sm text-stone-600">
              Message a business that invited you.
            </p>
          </div>
          <button
            className="rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Invitation
          </span>
          <select
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            disabled={!invitedOptions.length}
            name="invitationId"
            required
          >
            {invitedOptions.map((invitation) => (
              <option key={invitation.id} value={invitation.id}>
                {invitation.businessName} - {invitation.campaignTitle}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            type="submit"
          >
            Open conversation
          </button>
        </div>
      </form>
    </div>
  );
}

function Avatar({
  initials,
  name,
  url,
}: {
  initials: string;
  name: string;
  url: string | null;
}) {
  if (url) {
    return (
      <Image
        alt={`${name} avatar`}
        className="h-11 w-11 rounded-md border border-stone-200 object-cover"
        height={44}
        src={url}
        width={44}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-100 text-sm font-semibold text-stone-700">
      {initials}
    </div>
  );
}

function NewMessageModal({
  campaignOptions,
  creatorOptions,
  onClose,
}: {
  campaignOptions: CampaignOption[];
  creatorOptions: CreatorOption[];
  onClose: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4"
      role="dialog"
    >
      <form
        action={startBusinessConversation}
        className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">New message</h2>
            <p className="mt-1 text-sm text-stone-600">
              Start a conversation with a creator.
            </p>
          </div>
          <button
            className="rounded-md px-2 py-1 text-stone-500 hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Creator
          </span>
          <select
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            disabled={!creatorOptions.length}
            name="creatorId"
            required
          >
            {creatorOptions.length ? (
              creatorOptions.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.fullName} {handleWithAt(creator.handle)}
                </option>
              ))
            ) : (
              <option>No creators available</option>
            )}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Campaign
          </span>
          <select
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            name="campaignId"
          >
            <option value="">General message</option>
            {campaignOptions.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 flex justify-end gap-3">
          <button
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            disabled={!creatorOptions.length}
            type="submit"
          >
            Open conversation
          </button>
        </div>
      </form>
    </div>
  );
}
