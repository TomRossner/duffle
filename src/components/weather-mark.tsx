import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const WEATHER_LOOK: Record<string, { icon: LucideIcon; panel: string; chip: string }> = {
  Clear: { icon: Sun, panel: "bg-sky-100 text-sky-950", chip: "bg-amber-400 text-amber-950" },
  Cloudy: { icon: Cloud, panel: "bg-slate-200 text-slate-900", chip: "bg-slate-500 text-white" },
  Fog: { icon: CloudFog, panel: "bg-zinc-200 text-zinc-900", chip: "bg-zinc-500 text-white" },
  Rain: { icon: CloudRain, panel: "bg-blue-100 text-blue-950", chip: "bg-blue-600 text-white" },
  Snow: { icon: Snowflake, panel: "bg-cyan-100 text-cyan-950", chip: "bg-cyan-500 text-cyan-950" },
  Thunderstorm: { icon: CloudLightning, panel: "bg-violet-100 text-violet-950", chip: "bg-violet-600 text-white" },
  Mixed: { icon: CloudSun, panel: "bg-muted text-foreground", chip: "bg-muted-foreground text-background" },
};

export function weatherLook(condition: string) {
  return WEATHER_LOOK[condition] ?? WEATHER_LOOK.Mixed;
}

export function WeatherMark({ condition, className }: { condition: string; className?: string }) {
  const style = weatherLook(condition);
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full", style.chip, className)}>
      <Icon className="size-4" aria-hidden />
    </span>
  );
}
