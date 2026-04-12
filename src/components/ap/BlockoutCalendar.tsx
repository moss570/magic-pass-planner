import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BlockoutCalendarProps {
  passTier?: string;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const BlockoutCalendar = ({ passTier = "incredi-pass" }: BlockoutCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const { daysInMonth, startDay, days, startStr, endStr } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const dim = last.getDate();
    const sd = first.getDay();
    const ds = Array.from({ length: dim }, (_, i) => i + 1);
    const ss = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const es = `${year}-${String(month + 1).padStart(2, "0")}-${String(dim).padStart(2, "0")}`;
    return { daysInMonth: dim, startDay: sd, days: ds, startStr: ss, endStr: es };
  }, [year, month]);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("pass_tier_blockouts")
      .select("blockout_date, is_blocked")
      .eq("pass_tier", passTier)
      .gte("blockout_date", startStr)
      .lte("blockout_date", endStr)
      .then(({ data }) => {
        const set = new Set<string>();
        for (const row of data || []) {
          if (row.is_blocked) set.add(row.blockout_date);
        }
        setBlockedDates(set);
        setLoading(false);
      });
  }, [passTier, startStr, endStr]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthLabel = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Find next blocked period and next open stretch
  const nextBlockedInfo = useMemo(() => {
    if (blockedDates.size === 0) return null;
    const sorted = Array.from(blockedDates).sort();
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return `${new Date(first + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(last + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }, [blockedDates]);

  return (
    <div className="rounded-xl bg-card gold-border p-4 md:p-6">
      <h2 className="text-sm md:text-base font-bold text-foreground mb-1">📅 Blockout Calendar — {passTier.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</h2>
      <p className="text-xs text-muted-foreground mb-4">Days you CANNOT enter the parks on your pass</p>

      <div className="rounded-xl bg-muted/20 border border-primary/10 p-3 md:p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 rounded-md hover:bg-muted/40 transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="text-sm font-bold text-foreground">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1 rounded-md hover:bg-muted/40 transition-colors">
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
          {DAY_LABELS.map((d) => <span key={d} className="font-semibold">{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => <div key={`e${i}`} />)}
          {days.map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const blocked = blockedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <div
                key={day}
                className={`aspect-square flex items-center justify-center rounded-md text-[11px] font-semibold ${
                  blocked ? "bg-red-500/20 text-red-400" : "text-green-400"
                } ${isToday ? "ring-2 ring-primary" : ""}`}
              >
                {day}
              </div>
            );
          })}
        </div>
        {loading && <p className="text-[10px] text-muted-foreground text-center mt-2">Loading...</p>}
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mb-3">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500/20" /> Blocked</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-500/20" /> Available</span>
      </div>

      {nextBlockedInfo ? (
        <p className="text-xs text-foreground mb-1">Blocked dates this month: <span className="text-red-400 font-semibold">{nextBlockedInfo}</span></p>
      ) : (
        <p className="text-xs text-green-400 mb-1">No blockout dates this month — all days available! 🎉</p>
      )}
      <p className="text-[10px] text-muted-foreground italic">Blockout dates are estimated based on your pass tier. Always verify at disneyworld.com before visiting.</p>
    </div>
  );
};

export default BlockoutCalendar;
