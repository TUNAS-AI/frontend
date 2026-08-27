import { useEffect, useId, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANT_PREFILL_EVENT, LEGACY_ASSISTANT_PREFILL_EVENT } from "./assistantControl";

type AssistantMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type TunasAssistantProps = {
  contextLabel: string;
  contextTone?: BadgeProps["variant"];
  starterMessage: string;
  subtitle?: string;
  inputPlaceholder?: string;
  onAsk: (question: string) => Promise<string> | string;
};

export function TunasAssistant({
  contextLabel,
  contextTone = "source",
  starterMessage,
  subtitle = "Questions, explanations and revisions",
  inputPlaceholder = "Ask TUNAS...",
  onAsk,
}: TunasAssistantProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AssistantMessage[]>([{ id: 1, role: "assistant", text: starterMessage }]);
  const [pending, setPending] = useState(false);
  const nextId = useRef(2);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [open, messages, pending]);

  useEffect(() => {
    function handlePrefill(event: Event) {
      const draftEvent = event as CustomEvent<string>;
      setDraft(draftEvent.detail);
      setOpen(true);
    }
    window.addEventListener(ASSISTANT_PREFILL_EVENT, handlePrefill);
    window.addEventListener(LEGACY_ASSISTANT_PREFILL_EVENT, handlePrefill);
    return () => {
      window.removeEventListener(ASSISTANT_PREFILL_EVENT, handlePrefill);
      window.removeEventListener(LEGACY_ASSISTANT_PREFILL_EVENT, handlePrefill);
    };
  }, []);

  function addMessage(role: AssistantMessage["role"], text: string) {
    setMessages((current) => [...current, { id: nextId.current++, role, text }]);
  }

  async function sendMessage() {
    const question = draft.trim();
    if (!question || pending) return;
    setDraft("");
    addMessage("user", question);
    setPending(true);
    try {
      addMessage("assistant", await onAsk(question));
    } catch {
      addMessage("assistant", "I could not answer that right now. Your page data and any structured mission state remain unchanged.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-3 z-40 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6">
      {open ? (
        <section
          aria-label="TUNAS assistant"
          className="flex h-[min(620px,calc(100dvh-7rem))] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border bg-card shadow-lift"
          onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
        >
          <header className="flex items-center justify-between gap-3 border-b bg-ai-700 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15"><Bot className="h-5 w-5" aria-hidden="true" /></span>
              <div className="min-w-0"><h2 className="truncate font-bold">TUNAS assistant</h2><p className="truncate text-xs text-white/80">{subtitle}</p></div>
            </div>
            <Button type="button" size="icon" variant="ghost" className="border-transparent text-white hover:bg-white/15 hover:text-white" aria-label="Close TUNAS assistant" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button>
          </header>

          <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            <Badge variant={contextTone}>{contextLabel}</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-busy={pending}>
            {messages.map((message) => <ChatBubble key={message.id} variant={message.role}>{message.text}</ChatBubble>)}
            {pending ? <ChatBubble className="text-muted-foreground">Thinking...</ChatBubble> : null}
          </div>

          <div className="border-t p-3">
            <label className="sr-only" htmlFor={inputId}>Ask TUNAS</label>
            <Textarea ref={inputRef} id={inputId} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} placeholder={inputPlaceholder} className="min-h-20 resize-none text-base" disabled={pending} />
            <div className="mt-2 flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Enter to send - Shift+Enter for a new line</p><Button type="button" size="icon" aria-label="Send message" disabled={!draft.trim() || pending} onClick={() => void sendMessage()}><Send aria-hidden="true" /></Button></div>
          </div>
        </section>
      ) : (
        <Button type="button" size="lg" className="rounded-full border-ai-700 bg-ai-700 px-5 text-white shadow-lift hover:bg-ai-700/90" aria-label="Open TUNAS assistant" aria-expanded={false} onClick={() => setOpen(true)} icon={<Sparkles aria-hidden="true" />}>Ask TUNAS</Button>
      )}
    </div>
  );
}
