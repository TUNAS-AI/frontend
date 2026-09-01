import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ClipboardList, Send, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import {
  actOnTunasMessage,
  approveTunasPendingAction,
  cancelTunasPendingAction,
  getTunasInteractions,
  getTunasMessages,
  markTunasRead,
  rejectTunasPendingAction,
  sendTunasInteraction,
  type TunasAction,
  type TunasInteraction,
  type TunasInteractionState,
  type TunasMessage,
  type TunasState,
} from "@/api/tunas";
import { confirmMissionReplan } from "@/api/missions";
import { Button } from "@/components/ui/Button";
import { ChatBubble } from "@/components/ui/ChatBubble";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANT_PREFILL_EVENT, LEGACY_ASSISTANT_PREFILL_EVENT } from "@/components/app/assistantControl";

const empty: TunasState = { messages: [], unreadCount: 0 };

type AssistantMessage = { id: string; role: "assistant" | "user"; text: string };
type TunasAssistantProps = {
  contextLabel?: string;
  contextTone?: BadgeProps["variant"];
  starterMessage?: string;
  subtitle?: string;
  inputPlaceholder?: string;
  onAsk?: (question: string) => Promise<string> | string;
  assistantMissionId?: string;
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
  return <GlobalTunasAssistant assistantMissionId={props.assistantMissionId} />;
}

function ContextualTunasAssistant({ contextLabel, contextTone = "ai", starterMessage, subtitle = "Page-specific guidance", inputPlaceholder = "Ask Tunas AI…", onAsk }: Required<Pick<TunasAssistantProps, "contextLabel" | "starterMessage" | "onAsk">> & Omit<TunasAssistantProps, "contextLabel" | "starterMessage" | "onAsk">) {
  const inputId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [working, setWorking] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([{ id: "starter", role: "assistant", text: starterMessage }]);

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
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: question }]);
    try {
      const response = await onAsk(question);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: response }]);
    }
    catch { setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: "I couldn’t answer that just now. Please try again." }]); }
    finally { setWorking(false); }
  }

  return <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-3 z-40 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6">
    {open ? <section aria-label="Tunas AI" className="motion-enter flex h-[min(430px,calc(100dvh-8rem))] w-[min(390px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-ai-100 bg-card shadow-lift">
      <header className="flex items-center justify-between gap-3 bg-ai-700 px-4 py-3 text-white"><div className="min-w-0"><h2 className="font-bold">Tunas AI</h2><p className="truncate text-xs text-white/80">{subtitle}</p></div><Button type="button" size="icon" variant="ghost" className="border-transparent text-white hover:bg-white/15 hover:text-white" aria-label="Close Tunas AI" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button></header>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4" aria-live="polite"><div className="flex min-h-full flex-col justify-end gap-3"><Badge variant={contextTone}>{contextLabel}</Badge>{messages.map((message) => <ChatBubble key={message.id} variant={message.role}>{message.text}</ChatBubble>)}{working ? <ChatBubble variant="assistant"><TunasTypingIndicator className="text-ai-700" /></ChatBubble> : null}</div></div>
      <form className="flex gap-2 border-t bg-muted/30 p-3" onSubmit={(event) => void ask(event)}><label className="sr-only" htmlFor={inputId}>Ask Tunas AI</label><Textarea id={inputId} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={inputPlaceholder} disabled={working} /><Button type="submit" size="icon" disabled={!draft.trim() || working} aria-label="Send question"><Send aria-hidden="true" /></Button></form>
    </section> : <Button type="button" size="icon" className="h-12 w-12 min-h-12 rounded-full border-ai-700 bg-ai-700 p-0 text-white shadow-lift hover:bg-ai-700/90" aria-label="Open Tunas AI" onClick={() => setOpen(true)}><img src="/images/tunas-ai-icon-white.png" alt="" className="h-6 w-6 object-contain" /></Button>}
  </div>;
}

function GlobalTunasAssistant({ assistantMissionId }: { assistantMissionId?: string }) {
  const navigate = useNavigate();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<TunasState>(empty);
  const [interactions, setInteractions] = useState<TunasInteraction[]>([]);
  const [conversation, setConversation] = useState<Array<AssistantMessage & { response?: TunasInteractionState }>>([]);
  const [replanContext, setReplanContext] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mascot = getMascotPresentation({ error, loading, state, working });
  const visibleInteractions = interactions.filter((interaction) => !assistantMissionId || interaction.response.missionId === assistantMissionId);
  const visibleMessages = state.messages.filter((message) => !assistantMissionId || message.missionId === assistantMissionId);

  async function refresh() {
    const [messages, history] = await Promise.allSettled([getTunasMessages(), getTunasInteractions()]);
    if (messages.status === "fulfilled") setState(messages.value);
    if (history.status === "fulfilled") setInteractions(history.value.interactions);
    if (messages.status === "rejected" && history.status === "rejected") setError("Tunas AI could not load your operational workflow. Try again.");
  }

  useEffect(() => {
    let live = true;
    void refresh()
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 25_000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [open, state.messages, interactions, conversation]);

  async function show() {
    setOpen(true);
    void refresh();
    try {
      setState(await markTunasRead());
    } catch {
      // History stays available if marking read fails.
    }
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || working) return;
    const externalMessageId = crypto.randomUUID();
    const userMessage = { id: externalMessageId, role: "user" as const, text: message };
    setConversation((current) => [...current, userMessage]);
    setDraft("");
    setWorking(`send:${externalMessageId}`);
    setError(null);
    try {
      const response = await sendTunasInteraction(message, externalMessageId, assistantMissionId, replanContext);
      setConversation((current) => [...current, { id: response.interactionId, role: "assistant", text: response.message, response }]);
      setReplanContext(response.replan?.status === "clarification" ? [...replanContext, message].slice(-8) : []);
      if (!response.transient) await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tunas AI could not send your request. Try again.");
    } finally {
      setWorking(null);
    }
  }

  async function decide(response: TunasInteractionState, decision: "approve" | "reject") {
    const pending = response.pendingAction;
    if (!pending || working) return;
    setWorking(`${pending.pendingActionId}:${decision}`); setError(null);
    try {
      const updated = decision === "approve" ? await approveTunasPendingAction(pending.pendingActionId) : await rejectTunasPendingAction(pending.pendingActionId);
      setInteractions((current) => current.map((item) => item.response.interactionId === response.interactionId ? { ...item, response: updated, completedAt: new Date().toISOString() } : item));
      try { setInteractions((await getTunasInteractions()).interactions); } catch { /* Keep the confirmed local state. */ }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Tunas AI could not save that decision. Try again."); }
    finally { setWorking(null); }
  }

  async function cancel(response: TunasInteractionState) {
    const pending = response.pendingAction;
    if (!pending || working) return;
    setWorking(`${pending.pendingActionId}:cancel`); setError(null);
    try { const updated = await cancelTunasPendingAction(pending.pendingActionId); setConversation((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: updated.message, response: updated }]); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Tunas AI could not cancel that workflow."); }
    finally { setWorking(null); }
  }

  async function approveReplan(response: TunasInteractionState) {
    const replan = response.replan;
    if (!replan || replan.status !== "feasible" || working) return;
    setWorking(`${response.interactionId}:replan`); setError(null);
    try {
      const result = await confirmMissionReplan(replan.missionId, replan.previewToken, replan.recommendation.planId);
      const calendar = result.calendarSync.status === "SYNCED" ? " Google Calendar is synced." : result.calendarSync.status === "NOT_CONNECTED" ? " Google Calendar is not connected." : " The mission is saved; check Calendar sync status if needed.";
      setConversation((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: `Replan approved. The mission schedule is updated.${calendar}` }]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Tunas AI could not approve that replan."); }
    finally { setWorking(null); }
  }

  async function act(message: TunasMessage, item: TunasAction) {
    setWorking(`${message.tunasMessageId}:${item.id}`);
    setError(null);
    try {
      const result = await actOnTunasMessage(message.tunasMessageId, item.id);
      setState(result.messages);
      if (result.navigation) {
        navigate(`/missions/${result.navigation.missionId}`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save that decision.");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className={open ? "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 sm:inset-x-auto sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6" : "fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-3 z-40 sm:bottom-5 sm:right-5"}>
      {open ? (
        <section aria-label="Tunas AI" className="tunas-assistant-window motion-enter flex h-[min(36rem,calc(100dvh-1.5rem))] min-h-[20rem] w-full max-w-full flex-col overflow-hidden rounded-2xl border border-ai-100 bg-card shadow-lift sm:h-[min(40rem,calc(100dvh-2.5rem))] sm:w-[min(440px,calc(100vw-2.5rem))]" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
          <header className="tunas-assistant-header relative z-10 flex min-h-16 items-center justify-between gap-3 rounded-t-xl bg-ai-700 py-2 pr-4 text-white">
            <img src={mascot.image} alt={mascot.alt} className="tunas-assistant-mascot pointer-events-none absolute z-20 object-contain object-bottom" />
            <div className="min-w-0">
                <h2 className="sr-only">Tunas AI</h2>
                 <p className="text-sm font-semibold leading-5 text-white/90">Tunas AI</p><p className="text-xs text-white/70">Ask, report, or replan without leaving the farm.</p>
            </div>
            <Button type="button" size="icon" variant="ghost" className="border-transparent text-white hover:bg-white/15 hover:text-white" aria-label="Close Tunas AI" onClick={() => setOpen(false)}><X aria-hidden="true" /></Button>
          </header>

          <div ref={scrollRef} className="tunas-chat-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4" aria-live="polite" aria-busy={loading || Boolean(working)}>
            <div className="flex min-h-full min-w-0 flex-col gap-3">
             <div className="mt-auto" aria-hidden="true" />
             <p className="sr-only" role="status">{mascot.label}. {mascot.detail}</p>
             {assistantMissionId ? <Badge variant="ai">Current mission context</Badge> : null}
             {loading ? <ChatBubble variant="assistant"><TunasTypingIndicator className="text-ai-700" /></ChatBubble> : null}
             {!loading ? visibleInteractions.map((interaction) => <Interaction key={interaction.operationalInteractionId} interaction={interaction} working={working} onDecide={decide} />) : null}
             {!loading && visibleMessages.length ? visibleMessages.map((message) => (
               <div key={message.tunasMessageId} className="grid min-w-0 gap-2">
                <ChatBubble variant={message.role === "farmer" ? "user" : "assistant"}>{message.content}</ChatBubble>
                {message.mission ? (
                  <Link to={`/missions/${message.mission.missionId}`} aria-label={`View related mission: ${message.mission.originalMessage}`} className="grid min-w-0 max-w-full gap-1 overflow-hidden rounded-md border border-ai-100 bg-ai-50 px-3 py-2 text-left text-sm transition-colors hover:bg-ai-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30">
                    <span className="flex items-center gap-2 font-bold text-ai-700"><ClipboardList className="h-4 w-4" aria-hidden="true" />Related mission</span>
                    <span className="truncate font-medium text-foreground">{message.mission.originalMessage}</span>
                    <span className="text-xs text-muted-foreground">{message.mission.status} · {message.mission.stage}</span>
                  </Link>
                ) : null}
                {message.actions.length ? <div className="flex flex-wrap gap-2">{message.actions.map((item) => <Button key={item.id} type="button" size="sm" variant={item.id === "keep" ? "outline" : "primary"} disabled={working !== null} isLoading={working === `${message.tunasMessageId}:${item.id}`} loadingLabel="Saving" onClick={() => void act(message, item)}>{item.label}</Button>)}</div> : null}
              </div>
            )) : null}
             {conversation.map((message) => <div key={message.id} className="grid min-w-0 gap-2"><ChatBubble variant={message.role}>{message.text}</ChatBubble>{message.response ? <ResponseActions response={message.response} working={working} onCancel={cancel} onReplan={approveReplan} /> : null}</div>)}
             {!loading && !visibleMessages.length && !visibleInteractions.length && !conversation.length ? <div className="rounded-xl border border-dashed border-ai-200 bg-ai-50/60 p-4 text-sm leading-6 text-muted-foreground"><p className="font-bold text-ai-700">What can Tunas do?</p><p className="mt-1">Ask about your farm, report field conditions, check mission status, or request a schedule change.</p></div> : null}
            {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p> : null}
            </div>
          </div>

          <form className="flex gap-2 rounded-b-2xl border-t bg-muted/30 p-3" onSubmit={(event) => void send(event)}><label className="sr-only" htmlFor={inputId}>Ask Tunas AI for operational help</label><Textarea id={inputId} rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask, report a change, or request a replan…" disabled={working !== null} /><Button type="submit" size="icon" disabled={!draft.trim() || working !== null} isLoading={working?.startsWith("send:")} loadingLabel="Sending request" aria-label="Send request"><Send aria-hidden="true" /></Button></form>
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

function ResponseActions({ response, working, onCancel, onReplan }: { response: TunasInteractionState; working: string | null; onCancel: (response: TunasInteractionState) => Promise<void>; onReplan: (response: TunasInteractionState) => Promise<void> }) {
  const replan = response.replan;
  if (response.pendingAction?.kind === "CLARIFICATION" && response.pendingAction.status === "PENDING") return <Button type="button" size="sm" variant="outline" className="w-fit" disabled={working !== null} onClick={() => void onCancel(response)}>Cancel report</Button>;
  if (!replan) return null;
  if (replan.status === "infeasible") return <p className="rounded-lg border border-risk-200 bg-risk-50 p-3 text-sm">{replan.blockers.join(" ")}</p>;
  if (replan.status !== "feasible") return null;
  const plan = replan.candidates.find((item) => item.planId === replan.recommendation.planId);
  return <div className="grid gap-3 rounded-xl border border-ai-200 bg-ai-50 p-3 text-sm"><div><p className="font-bold text-ai-700">Proposed schedule</p>{replan.changes?.map((change) => <p key={change.title} className="mt-1 text-muted-foreground">{change.title}: {change.after.date}{change.after.start ? `, ${change.after.start}` : ""}</p>)}</div>{plan ? <div className="grid gap-1">{plan.activities.map((activity) => <p key={`${activity.title}-${activity.startsOn}`}>{activity.title} · {new Date(activity.startsOn).toLocaleDateString()}</p>)}</div> : null}<p className="text-muted-foreground">{replan.recommendation.reasons.map((reason) => reason.text).join(" ")}</p><div className="flex gap-2"><Button type="button" size="sm" disabled={working !== null} isLoading={working === `${response.interactionId}:replan`} onClick={() => void onReplan(response)}>Approve replan</Button></div></div>;
}

function Interaction({ interaction, working, onDecide }: { interaction: TunasInteraction; working: string | null; onDecide: (response: TunasInteractionState, decision: "approve" | "reject") => Promise<void> }) {
  const pending = interaction.response.pendingAction;
  const canDecide = pending?.status.toLowerCase() === "pending";
  const clarification = pending?.kind === "CLARIFICATION";
  const canReplan = interaction.response.impact?.replanSupported && interaction.response.semanticActions?.some((action) => action.type === "OPEN_REPLAN");
  return <article className="grid gap-2"><ChatBubble variant="user">{interaction.message}</ChatBubble><ChatBubble variant="assistant">{interaction.response.message}</ChatBubble>{pending ? <div className="grid gap-3 rounded-md border border-ai-100 bg-ai-50 p-3 text-sm"><div><p className="font-bold text-ai-700">{pending.preview.question || (clarification ? "More information needed" : "Review proposed change")}</p><p className="mt-1 text-xs font-semibold text-muted-foreground">{checkpointLabel(pending.kind)} · {statusLabel(pending.status)}</p></div>{!clarification ? <div className="grid gap-2 sm:grid-cols-2">{pending.preview.before !== undefined ? <Preview label="Before" value={pending.preview.before} /> : null}<Preview label={pending.kind === "OPERATIONAL_REPORT" ? "Report" : "After"} value={pending.preview.report ?? pending.preview.after} /></div> : null}{interaction.response.impact ? <div className="rounded-md bg-card p-3"><p className="font-bold">Impact: {interaction.response.impact.level === "MATERIAL" ? "Material" : "None"}</p>{interaction.response.impact.reasons.map((reason, index) => <p key={`${index}-${reason}`} className="mt-1 text-muted-foreground">{reason}</p>)}</div> : null}{canDecide && !clarification ? <div className="flex flex-wrap gap-2"><Button type="button" size="sm" disabled={working !== null} isLoading={working === `${pending.pendingActionId}:approve`} loadingLabel="Approving" onClick={() => void onDecide(interaction.response, "approve")}>Approve</Button><Button type="button" size="sm" variant="outline" disabled={working !== null} isLoading={working === `${pending.pendingActionId}:reject`} loadingLabel="Rejecting" onClick={() => void onDecide(interaction.response, "reject")}>Reject</Button></div> : null}{canReplan && interaction.response.missionId ? <Button asChild type="button" size="sm" variant="outline" className="w-fit"><Link to={`/missions/${interaction.response.missionId}/edit`}>Open replan</Link></Button> : null}{interaction.response.missionId ? <Link className="text-sm font-bold text-ai-700 underline-offset-4 hover:underline" to={`/missions/${interaction.response.missionId}`}>View mission</Link> : null}</div> : null}</article>;
}

function Preview({ label, value }: { label: string; value: unknown }) {
  return <div className="min-w-0 rounded-md border bg-card p-2"><p className="text-xs font-bold text-muted-foreground">{label}</p>{isRecord(value) ? <dl className="mt-1 grid gap-1">{Object.entries(value).map(([key, item]) => <div key={key}><dt className="font-semibold text-muted-foreground">{readableKey(key)}</dt><dd className="break-words">{readableValue(item)}</dd></div>)}</dl> : <p className="mt-1 break-words">{readableValue(value)}</p>}</div>;
}

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function readableKey(key: string) { return key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (letter) => letter.toUpperCase()); }
function readableValue(value: unknown): string { if (value === null || value === undefined) return "Not recorded"; if (typeof value === "boolean") return value ? "Yes" : "No"; if (Array.isArray(value)) return value.map(readableValue).join(", "); if (isRecord(value)) return Object.entries(value).map(([key, item]) => `${readableKey(key)}: ${readableValue(item)}`).join(" · "); return String(value); }
function checkpointLabel(kind: string) { return kind === "OPERATIONAL_REPORT" ? "Operational report" : kind === "CLARIFICATION" ? "Clarification" : readableKey(kind.toLowerCase()); }
function statusLabel(status: string) { return readableKey(status.toLowerCase()); }
