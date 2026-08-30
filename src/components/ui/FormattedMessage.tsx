import { Fragment, type ReactNode } from "react";

const decode = (value: string) => value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&");
const safeLink = (value?: string) => { try { return Boolean(value && ["http:", "https:"].includes(new URL(value).protocol)); } catch { return false; } };

function inline(value: string, key: string): ReactNode[] {
  const pattern = /(<\/?(?:b|strong|i|em|code)>|<a\s+href=(?:"([^"]*)"|'([^']*)')\s*>|<\/a>|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|(?<!\*)\*([^*\n]+)\*(?!\*)|_([^_\n]+)_)/gi;
  const nodes: ReactNode[] = [];
  const stack: Array<{ tag: "strong" | "em" | "code" | "a"; href?: string; children: ReactNode[] }> = [];
  const target = () => stack.at(-1)?.children ?? nodes;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) target().push(decode(value.slice(cursor, index)));
    const token = match[0];
    const open = token.match(/^<(b|strong|i|em|code)>$/i)?.[1]?.toLowerCase();
    const close = token.match(/^<\/(b|strong|i|em|code|a)>$/i);
    const href = match[2] ?? match[3];
    if (open) stack.push({ tag: open === "b" || open === "strong" ? "strong" : open === "i" || open === "em" ? "em" : "code", children: [] });
    else if (href !== undefined) stack.push({ tag: "a", href, children: [] });
    else if (close && stack.length) {
      const item = stack.pop()!;
      const child = item.tag === "strong" ? <strong key={`${key}-${index}`}>{item.children}</strong> : item.tag === "em" ? <em key={`${key}-${index}`}>{item.children}</em> : item.tag === "code" ? <code key={`${key}-${index}`} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">{item.children}</code> : safeLink(item.href) ? <a key={`${key}-${index}`} href={item.href} target="_blank" rel="noreferrer noopener" className="font-semibold text-primary underline underline-offset-2">{item.children}</a> : <Fragment key={`${key}-${index}`}>{item.children}</Fragment>;
      target().push(child);
    } else if (match[4] !== undefined) target().push(safeLink(match[5]) ? <a key={`${key}-${index}`} href={match[5]} target="_blank" rel="noreferrer noopener" className="font-semibold text-primary underline underline-offset-2">{match[4]}</a> : decode(token));
    else if (match[6] !== undefined || match[7] !== undefined) target().push(<strong key={`${key}-${index}`}>{match[6] ?? match[7]}</strong>);
    else if (match[8] !== undefined) target().push(<code key={`${key}-${index}`} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">{match[8]}</code>);
    else if (match[9] !== undefined || match[10] !== undefined) target().push(<em key={`${key}-${index}`}>{match[9] ?? match[10]}</em>);
    cursor = index + token.length;
  }
  if (cursor < value.length) target().push(decode(value.slice(cursor)));
  while (stack.length) nodes.push(...stack.shift()!.children);
  return nodes;
}

export function FormattedMessage({ children }: { children: string }) {
  const blocks = children.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?(?:p|pre)>/gi, "\n").trim().split(/\n{2,}/);
  return <div className="grid min-w-0 gap-2 whitespace-normal">{blocks.map((block, index) => {
    const code = block.match(/^```(?:\w+)?\n?([\s\S]*?)```$/);
    if (code) return <pre key={index} className="max-w-full overflow-x-auto rounded-lg bg-foreground/10 p-3 font-mono text-xs whitespace-pre-wrap [overflow-wrap:anywhere]"><code>{code[1]}</code></pre>;
    const lines = block.split("\n");
    if (lines.every((line) => /^\s*[-*•]\s+/.test(line))) return <ul key={index} className="grid list-disc gap-1 pl-5">{lines.map((line, lineIndex) => <li key={lineIndex}>{inline(line.replace(/^\s*[-*•]\s+/, ""), `${index}-${lineIndex}`)}</li>)}</ul>;
    return <p key={index} className="whitespace-pre-line">{inline(block, String(index))}</p>;
  })}</div>;
}
