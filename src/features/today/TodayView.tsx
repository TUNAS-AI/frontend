import { ArrowRight, CalendarCheck, ClipboardCheck, MapPinned, PackageCheck, ShieldAlert } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { MissionContext } from "@/features/missions/components/MissionContext";
import type { TodayIconKey, TodayPageData } from "./types";

const signalIcons = {
  calendar: CalendarCheck,
  field: MapPinned,
  result: ClipboardCheck,
} satisfies Record<TodayIconKey, typeof PackageCheck>;

export function TodayView({ data }: { data: TodayPageData }) {
  return (
    <div className="grid gap-5">
      <PageHeader
        badges={data.header.badges.map((badge) => <Badge key={badge.id} variant={badge.tone}>{badge.label}</Badge>)}
        eyebrow={data.header.greeting}
        title={data.header.title}
        description={data.header.description}
      />

      <Card variant="highlight">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <Badge variant={data.attentionMission.status.tone} className="w-fit">{data.attentionMission.status.label}</Badge>
              <CardTitle className="text-2xl">{data.attentionMission.title}</CardTitle>
              <CardDescription>{data.attentionMission.description}</CardDescription>
            </div>
            <ShieldAlert className="h-7 w-7 text-harvest-700" aria-label={data.attentionMission.riskLabel} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {data.attentionMission.metrics.map((metric) => <MetricCard key={metric.id} {...metric} />)}
        </CardContent>
        <CardFooter className="border-t border-forest-200/70 pt-5">
          <Button asChild>
            <Link to={data.attentionMission.action.href}>
              {data.attentionMission.action.label}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="text-sm font-medium text-muted-foreground">{data.attentionMission.notice}</p>
        </CardFooter>
      </Card>

      <section className="grid gap-3" aria-labelledby="signals-heading">
        <div>
          <h2 id="signals-heading" className="text-xl font-extrabold">{data.signals.title}</h2>
          <p className="mt-1 text-base text-muted-foreground">{data.signals.description}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {data.signals.items.map((signal) => {
            const Icon = signalIcons[signal.icon];
            return (
              <Card key={signal.id}>
                <CardContent className="grid gap-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-5 w-5 text-forest-700" aria-hidden="true" />
                    <Badge variant={signal.tone}>{signal.toneLabel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{signal.label}</p>
                    <p className="mt-1 text-lg font-bold">{signal.value}</p>
                    <p className="text-sm text-muted-foreground">{signal.detail}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]" aria-labelledby="next-heading">
        <Card>
          <CardHeader>
            <CardTitle id="next-heading">{data.nextSteps.title}</CardTitle>
            <CardDescription>{data.nextSteps.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {data.nextSteps.items.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-start">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest-100 text-sm font-bold text-forest-700" aria-hidden="true">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{item.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto"><Badge variant={item.status.tone}>{item.status.label}</Badge>{item.action ? <Button asChild size="sm" variant="outline"><Link to={item.action.href}>{item.action.label}<ArrowRight aria-hidden="true" /></Link></Button> : null}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <MissionContext context={data.context} />
      </section>
    </div>
  );
}
