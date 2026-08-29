import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ClipboardList, Send, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  actOnTunasMessage,
  checkTunasForecast,
  createTunasTestAlert,
  getTunasMessages,
  markTunasRead,
  type TunasAction,
  type TunasMessage,
  type TunasState,
} from "@/api/tunas";
import { Button } from "@/components/ui/Button";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANT_PREFILL_EVENT, LEGACY_ASSISTANT_PREFILL_EVENT } from "@/components/app/assistantControl";

const empty: TunasState = { messages: [], unreadCount: 0 };

type AssistantMessage = { id: number; role: "assistant" | "user"; text: string };
type TunasAssistantProps = {
  contextLabel?: string;
  contextTone?: BadgeProps["variant"];
  starterMessage?: string;
  subtitle?: string;
  inputPlaceholder?: string;
  onAsk?: (question: string) => Promise<string> | string;
};

type MascotPresentation = {
  alt: string;
  detail: string;
  image: string;
  label: string;
};

function TunasTypingIndicator({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`tunas-typing-indicator ${className}`}><span /><span /><span /></span>;
}

function getMascotPresentation({ error, loading, state, working }: { error: string | null; loading: boolean; state: TunasState; working: string | null }): MascotPresentation {
  if (error) {
    return {
      alt: "TUNAS AI mascot reacting to an assistant connection problem",
      detail: "The assistant needs attention before it can continue.",
      image: "/images/mascot-shocked.png",
      label: "Connection needs attention",
    };
  }

  if (loading) {
    return {
      alt: "TUNAS AI mascot reading mission context",
      detail: "Reviewing weather and your active missions.",
      image: "/images/mascot-reading.png",
      label: "Reviewing mission context",
    };
  }

  if (working?.endsWith(":regenerate")) {
    return {
      alt: "TUNAS AI mascot creating a revised plan",
      detail: "Preparing a replacement plan for you to review.",
      image: "/images/mascot-creatingPlan.png",
      label: "Creating a replacement plan",
    };
  }

  if (working?.endsWith(":reschedule") || working?.includes("rain")) {
    return {
      alt: "TUNAS AI mascot examining plan details",
      detail: "Checking the effect of this change on the mission plan.",
      image: "/images/mascot-thinking3.png",
      label: "Reviewing plan details",
    };
  }

  if (working) {
    return {
      alt: "TUNAS AI mascot thinking through an approved action",
      detail: "Applying your choice and keeping the mission history up to date.",
      image: "/images/mascot-thinking.png",
      label: "Saving your decision",
    };
  }

  const latestAssistantMessage = [...state.messages].reverse().find((message) => message.role === "assistant");
  if (latestAssistantMessage?.actions.length) {
    return {
      alt: "TUNAS AI mascot with a recommendation ready to review",
      detail: "A mission recommendation is ready for your review and approval.",
      image: "/images/mascot-eureka.png",
      label: "Recommendation ready",
    };
  }

  if (!state.messages.length) {
    return {
      alt: "TUNAS AI mascot considering future mission context",
      detail: "No active prompts right now. TUNAS AI will check again with the next update.",
      image: "/images/mascot-thinking2.png",
      label: "Monitoring mission context",
    };
  }

  return {
    alt: "TUNAS AI mascot ready to help with the next mission decision",
    detail: "Your latest mission context is available to review.",
    image: "/images/mascot-suprised.png",
    label: "Ready for your next decision",
  };
}

export function TunasAssistant(props: TunasAssistantProps) {
  if (props.contextLabel && props.starterMessage && props.onAsk) return <ContextualTunasAssistant {...props} contextLabel={props.contextLabel} starterMessage={props.starterMessage} onAsk={props.onAsk} />;
  return <GlobalTunasAssistant />;
}

function ContextualTunasAssistant({ contextLabel, contextTone = "ai", starterMessage, subtitle = "Page-specific guidance", inputPlaceholder = "Ask Tunas AI…", onAsk }: Required<Pick<TunasAssistantProps, "contextLabel" | "starterMessage" | "onAsk">> & Omit<TunasAssistantProps, "contextLabel" | "starterMessage" | "onAsk">) {
  const inputId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [working, setWorking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([{ id: 0, role: "assistant", text: starterMessage }]);

  useEffect(() => {
    const prefill = (event: Event) => { const text = (event as CustomEvent<string>).detail; if (text) { setDraft(text); setOpen(true); } };
    window.addEventListener(ASSISTANT_PREFILL_EVENT, prefill);
    window.addEventListener(LEGACY_ASSISTANT_PREFILL_EVENT, prefill);
    return () => { window.removeEventListener(ASSISTANT_PREFILL_EVENT, prefill); window.removeEventListener(LEGACY_ASSISTANT_PREFILL_EVENT, prefill); };
  }, []);
  useEffect(() => { if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [open, messages, working]);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || working) return;
    setDraft(""); setWorking(true);
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: question }]);
    try {
      const response = await onAsk(question);
      setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: response }]);
    }
    catch { setMessages((current) => [...current, { id: Date.now() + 1, role: "assistant", text: "I couldn’t answer that just now. Please try again." }]); }
    finally { setWorking(false); }
  }

  return <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-3 z-40 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6">
    {open ? <section aria-label="Tunas AI" className="motion-enter flex h-[min(430px,calc(100dvh-8rem))] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-ai-100 bg-card shadow-lift">
      <header className="flex items-center justify-between gap-3 bg-ai-700 px-4 py-3 text-white"><div className="min-w-0"><h2 className="font-bold">Tunas AI</h2><p className="truncate text-xs text-white/80">{subtitle}</p></div><Button type="button" size="icon" variant="ghost" className="border-transparent text-white hover:bg-white/15 hover:text-white" aria-label="Close Tunas AI" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button></header>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite"><Badge variant={contextTone}>{contextLabel}</Badge>{messages.map((message) => <ChatBubble key={message.id} variant={message.role}>{message.text}</ChatBubble>)}{working ? <ChatBubble variant="assistant"><TunasTypingIndicator className="text-ai-700" /></ChatBubble> : null}</div>
      <form className="flex gap-2 border-t bg-muted/30 p-3" onSubmit={(event) => void ask(event)}><label className="sr-only" htmlFor={inputId}>Ask Tunas AI</label><Textarea id={inputId} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={inputPlaceholder} disabled={working} /><Button type="submit" size="icon" disabled={!draft.trim() || working} aria-label="Send question"><Send aria-hidden="true" /></Button></form>
    </section> : <Button type="button" size="icon" className="h-12 w-12 min-h-12 rounded-full border-ai-700 bg-ai-700 p-0 text-white shadow-lift hover:bg-ai-700/90" aria-label="Open Tunas AI" onClick={() => setOpen(true)}><img src="/images/tunas-ai-icon-white.png" alt="" className="h-6 w-6 object-contain" /></Button>}
  </div>;
}

function GlobalTunasAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TunasState>(empty);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mascot = getMascotPresentation({ error, loading, state, working });

  useEffect(() => {
    let live = true;
    void Promise.all([getTunasMessages(), checkTunasForecast()])
      .then(([, result]) => { if (live) setState(result); })
      .catch((reason) => { if (live) setError(reason instanceof Error ? reason.message : "Tunas AI could not load."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [open, state.messages]);

  async function show() {
    setOpen(true);
    try {
      setState(await markTunasRead());
    } catch {
      // History stays available if marking read fails.
    }
  }

  async function test(scenario: "drying-rain" | "harvest-rain" | "irregular-rain") {
    setWorking(scenario);
    setError(null);
    try {
      setState(await createTunasTestAlert(scenario));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not generate the demo alert.");
    } finally {
      setWorking(null);
    }
  }

  async function act(message: TunasMessage, item: TunasAction) {
    setWorking(`${message.tunasMessageId}:${item.id}`);
    setError(null);
    try {
      const result = await actOnTunasMessage(message.tunasMessageId, item.id);
      setState(result.messages);
      if (result.navigation) {
        navigate(`/missions/${result.navigation.missionId}/edit`, {
          state: {
            tunasAutoGenerate: result.navigation.autoGenerate,
            tunasDraft: result.navigation.draft,
          },
        });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save that decision.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-3 z-40 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6">
      {open ? (
        <section aria-label="Tunas AI" className="tunas-assistant-window motion-enter flex h-[min(430px,calc(100dvh-8rem))] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-visible rounded-xl border border-ai-100 bg-card shadow-lift" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          <header className="tunas-assistant-header relative z-10 flex min-h-16 items-center justify-between gap-3 rounded-t-xl bg-ai-700 py-2 pr-4 text-white">
            <img src={mascot.image} alt={mascot.alt} className="tunas-assistant-mascot pointer-events-none absolute z-20 object-contain object-bottom" />
            <div className="min-w-0">
                <h2 className="sr-only">Tunas AI</h2>
                <p className="text-sm font-semibold leading-5 text-white/90">I'm Tunas, your weather-aware mission support.</p>
            </div>
            <Button type="button" size="icon" variant="ghost" className="border-transparent text-white hover:bg-white/15 hover:text-white" aria-label="Close Tunas AI" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite" aria-busy={loading || Boolean(working)}>
            <p className="sr-only" role="status">{mascot.label}. {mascot.detail}</p>
            {loading ? <ChatBubble variant="assistant"><TunasTypingIndicator className="text-ai-700" /></ChatBubble> : null}
            {!loading && state.messages.length ? state.messages.map((message) => (
              <div key={message.tunasMessageId} className="grid gap-2">
                <ChatBubble variant={message.role === "farmer" ? "user" : "assistant"}>{message.content}</ChatBubble>
                {message.mission ? (
                  <Link to={`/missions/${message.mission.missionId}`} aria-label={`View related mission: ${message.mission.originalMessage}`} className="grid gap-1 rounded-md border border-ai-100 bg-ai-50 px-3 py-2 text-left text-sm transition-colors hover:bg-ai-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30">
                    <span className="flex items-center gap-2 font-bold text-ai-700"><ClipboardList className="h-4 w-4" aria-hidden="true" />Related mission</span>
                    <span className="truncate font-medium text-foreground">{message.mission.originalMessage}</span>
                    <span className="text-xs text-muted-foreground">{message.mission.status} · {message.mission.stage}</span>
                  </Link>
                ) : null}
                {message.actions.length ? <div className="flex flex-wrap gap-2">{message.actions.map((item) => <Button key={item.id} type="button" size="sm" variant={item.id === "keep" ? "outline" : "primary"} disabled={working !== null} isLoading={working === `${message.tunasMessageId}:${item.id}`} loadingLabel="Saving" onClick={() => void act(message, item)}>{item.label}</Button>)}</div> : null}
              </div>
            )) : null}
            {!loading && !state.messages.length ? <p className="rounded-md border border-dashed p-4 text-sm leading-6 text-muted-foreground">No weather risks need action right now. TUNAS will check active missions again tomorrow.</p> : null}
            {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p> : null}
          </div>

          <footer className="rounded-b-xl border-t bg-muted/30 p-3">
            <p className="mb-2 text-xs font-bold text-muted-foreground">Test Tunas alerts</p>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" size="sm" variant="outline" disabled={working !== null} onClick={() => void test("drying-rain")}>Drying rain</Button>
              <Button type="button" size="sm" variant="outline" disabled={working !== null} onClick={() => void test("harvest-rain")}>Harvest rain</Button>
              <Button type="button" size="sm" variant="outline" disabled={working !== null} onClick={() => void test("irregular-rain")}>Irregular rain</Button>
            </div>
          </footer>
        </section>
      ) : (
        <Button type="button" size="icon" className="relative h-12 w-12 min-h-12 rounded-full border-ai-700 bg-ai-700 p-0 text-white shadow-lift hover:bg-ai-700/90 sm:h-14 sm:w-auto sm:min-h-14 sm:px-6" aria-label={`Open Tunas AI${state.unreadCount ? `, ${state.unreadCount} unread alerts` : ""}`} aria-expanded="false" onClick={() => void show()}>
          <img src="/images/tunas-ai-icon-white.png" alt="" className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
          <span className="hidden sm:inline">Tunas AI</span>
          {loading ? <TunasTypingIndicator className="absolute -bottom-0.5 -right-0.5 text-white" /> : null}
          {state.unreadCount ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-risk-700 px-1 text-xs font-bold text-white" aria-hidden="true">{state.unreadCount > 9 ? "9+" : state.unreadCount}</span> : null}
        </Button>
      )}
    </div>
  );
}
