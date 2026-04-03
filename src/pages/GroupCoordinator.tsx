import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Plus, Send, ChevronDown, ChevronUp } from "lucide-react";
import CompassButton from "@/components/CompassButton";

const members = [
  { initial: "B", name: "Brandon", role: "Trip Organizer", status: "Joined", pass: "Incredi-Pass", color: "bg-primary" },
  { initial: "S", name: "Sarah", role: "Member", status: "Joined", pass: "Incredi-Pass", color: "bg-blue-500" },
  { initial: "E", name: "Emma", role: "Member", status: "Joined", pass: "Day Ticket", color: "bg-pink-500" },
  { initial: "J", name: "Jake", role: "Member", status: "Joined", pass: "Day Ticket", color: "bg-green-500" },
];

const itinerary = [
  { time: "8:00 AM", title: "Rope Drop: Tron Lightcycle Run", status: "all", label: "✅ All 5 members confirmed", location: "Tron Lightcycle Run", land: "Tomorrowland · Magic Kingdom" },
  { time: "9:30 AM", title: "Be Our Guest Breakfast", status: "partial", label: "⚠️ 4/5 confirmed · Jake hasn't responded", action: "Send Jake a Reminder", location: "Be Our Guest Restaurant", land: "Fantasyland · Magic Kingdom" },
  { time: "11:00 AM", title: "Space Mountain (Lightning Lane)", status: "all", label: "✅ All 5 members confirmed", location: "Space Mountain", land: "Tomorrowland · Magic Kingdom" },
  { time: "1:00 PM", title: "Group Lunch — Columbia Harbour House", status: "vote", label: "🗳️ Vote in progress — see poll below", location: "Columbia Harbour House", land: "Liberty Square · Magic Kingdom" },
  { time: "2:30 PM", title: "Festival of Fantasy Parade", status: "all", label: "✅ All 5 members confirmed", location: null, land: "" },
  { time: "9:00 PM", title: "Happily Ever After Fireworks", status: "all", label: "✅ All 5 members confirmed", location: "Main Street Hub", land: "Main Street U.S.A. · Magic Kingdom" },
];

const expenses = [
  { desc: "Park tickets (4 day tickets)", amount: "$1,200.00", paidBy: "Brandon", split: "All 5", date: "May 1" },
  { desc: "Be Our Guest breakfast", amount: "$187.50", paidBy: "Sarah", split: "All 5", date: "May 20" },
  { desc: "Souvenir run — gift shop", amount: "$94.00", paidBy: "Brandon", split: "All 5", date: "May 20" },
  { desc: "Jake's Lightning Lane (individual)", amount: "$22.00", paidBy: "Jake", split: "Jake only", date: "May 20" },
  { desc: "Columbia Harbour House lunch", amount: "$143.00", paidBy: "Emma", split: "All 5", date: "May 20" },
  { desc: "Mickey ears (kids)", amount: "$68.00", paidBy: "Brandon", split: "Emma, Jake", date: "May 20" },
];

const GroupCoordinator = () => {
  const [expenseOpen, setExpenseOpen] = useState(true);

  return (
    <DashboardLayout title="👨‍👩‍👧 Group Coordinator" subtitle="Plan together, stay in sync — shared itinerary, expenses, and alerts for your whole group">
      {/* Group name */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-base md:text-lg font-bold text-foreground">🏰 The Moss Family Trip — Magic Kingdom · May 20–23, 2026</span>
        <button className="p-1 rounded border border-primary/30 text-primary hover:bg-primary/10"><Pencil className="w-3.5 h-3.5" /></button>
      </div>

      {/* Section 1: Group Members */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Your Travel Group (5 members)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {members.map((m) => (
              <div key={m.name} className="flex-shrink-0 w-[140px] md:w-[160px] rounded-xl border border-primary/15 bg-[#0D1230]/60 p-3 flex flex-col items-center gap-1.5 text-center">
                <div className={`w-10 h-10 rounded-full ${m.color} flex items-center justify-center text-sm font-bold text-white`}>{m.initial}</div>
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.role === "Trip Organizer" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{m.role}</span>
                <span className="text-[10px] font-medium text-green-400">✅ {m.status}</span>
                <span className="text-[10px] text-muted-foreground">{m.pass}</span>
              </div>
            ))}
            {/* Add member */}
            <div className="flex-shrink-0 w-[140px] md:w-[160px] rounded-xl border-2 border-dashed border-primary/30 bg-transparent p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-primary/60 transition-colors">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-primary">Invite Someone</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-xs"><Send className="w-3.5 h-3.5 mr-1" /> Invite to Group — They Get $1 First Month</Button>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">Non-members get a special discount offer</span>
            </div>
            <span className="text-xs text-muted-foreground">Magic Pass members are added instantly. Non-members receive a $1 first-month offer.</span>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Itinerary + Polls */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
        {/* Itinerary */}
        <Card className="lg:col-span-3 border-primary/20 bg-card/80 overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">📅 Group Itinerary — Magic Kingdom · May 20</CardTitle>
            <CardDescription>Live — all members see updates in real time</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-0">
            {itinerary.map((item, i) => (
              <div key={i} className="flex gap-3 py-3 border-b border-primary/10 last:border-0">
                <div className="w-16 md:w-20 shrink-0 text-xs md:text-sm font-mono text-primary font-semibold pt-0.5">{item.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    {item.location && (
                      <CompassButton destination={item.location} context={item.land} />
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${item.status === "partial" ? "text-yellow-400" : item.status === "vote" ? "text-blue-400" : "text-green-400"}`}>{item.label}</p>
                  {item.action && <Button size="sm" className="mt-1.5 h-7 text-[11px] bg-primary/20 text-primary hover:bg-primary/30 border-0">{item.action}</Button>}
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add Activity</Button>
              <Button variant="outline" className="border-muted text-muted-foreground hover:text-foreground text-xs">📤 Export Full Itinerary</Button>
            </div>
          </CardContent>
        </Card>

        {/* Polls */}
        <Card className="lg:col-span-2 border-primary/20 bg-card/80 overflow-hidden">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">🗳️ Active Polls</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
            {/* Poll 1 */}
            <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">Where should we eat lunch on May 20?</p>
              {[
                { label: "Columbia Harbour House", votes: 3, pct: 60 },
                { label: "Skipper Canteen", votes: 2, pct: 40 },
                { label: "Quick service / split up", votes: 0, pct: 0 },
              ].map((o) => (
                <div key={o.label} className="space-y-0.5">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">{o.label}</span><span className="text-primary font-semibold">{o.votes}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${o.pct}%` }} /></div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">Poll closes in 2 hours · Brandon hasn't voted yet</p>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[11px]">Cast My Vote</Button>
                <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground">Close Poll</Button>
              </div>
            </div>
            {/* Poll 2 */}
            <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 space-y-1 opacity-70">
              <p className="text-sm font-semibold text-foreground">Which park on Day 2?</p>
              <p className="text-xs text-primary font-semibold">🏆 EPCOT — 4/5 votes</p>
              <p className="text-[10px] text-muted-foreground">Closed · Added to itinerary ✅</p>
            </div>
            <Button variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Create New Poll</Button>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: Split Expense Tracker */}
      <Card className="border-primary/20 bg-card/80 mb-6 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">💸 Split Expense Tracker</CardTitle>
          <CardDescription>Log what you paid — Magic Pass calculates who owes who at the end</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Group Spend</p>
              <p className="text-xl font-bold text-primary">$1,847.50</p>
            </div>
            <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 text-center">
              <p className="text-xs text-muted-foreground">Your Share</p>
              <p className="text-xl font-bold text-foreground">$369.50<span className="text-sm text-muted-foreground">/person</span></p>
            </div>
            <div className="rounded-lg border border-primary/15 bg-[#0D1230]/60 p-3 text-center">
              <p className="text-xs text-muted-foreground">Settle Up</p>
              <p className="text-xl font-bold text-green-400">Jake owes you $43.20</p>
            </div>
          </div>

          {/* Add Expense form */}
          <div className="rounded-lg border border-primary/15 bg-[#0D1230]/40 p-3 space-y-3">
            <button onClick={() => setExpenseOpen(!expenseOpen)} className="flex items-center justify-between w-full text-sm font-semibold text-foreground">
              Add Expense {expenseOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {expenseOpen && (
              <div className="space-y-3">
                <Input placeholder="e.g. Lunch at Be Our Guest" className="bg-background/50 border-primary/20 text-sm" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input type="number" placeholder="$120" className="bg-background/50 border-primary/20 text-sm" />
                  <Select><SelectTrigger className="bg-background/50 border-primary/20 text-sm"><SelectValue placeholder="Paid by..." /></SelectTrigger>
                    <SelectContent>{members.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Split between:</p>
                  <div className="flex flex-wrap gap-3">
                    {members.map(m => (
                      <label key={m.name} className="flex items-center gap-1.5 text-xs text-foreground"><Checkbox defaultChecked className="border-primary/40" />{m.name}</label>
                    ))}
                  </div>
                </div>
                <Button className="text-xs">Add Expense</Button>
              </div>
            )}
          </div>

          {/* Expense table */}
          <div className="overflow-x-auto max-w-full">
            <Table className="min-w-[500px]">
              <TableHeader><TableRow className="border-primary/10">
                <TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Paid By</TableHead><TableHead className="text-xs">Split</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {expenses.map((e, i) => (
                  <TableRow key={i} className="border-primary/10">
                    <TableCell className="text-xs font-medium text-foreground">{e.desc}</TableCell>
                    <TableCell className="text-xs text-primary font-semibold">{e.amount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.paidBy}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.split}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.date}</TableCell>
                    <TableCell><button className="text-xs text-primary hover:underline">Edit</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Settle Up */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
            <p className="text-sm font-bold text-primary">💰 Settle Up Summary</p>
            <ul className="text-xs text-foreground space-y-1">
              <li>• Jake owes Brandon <span className="text-primary font-semibold">$43.20</span></li>
              <li>• Emma owes Sarah <span className="text-primary font-semibold">$12.75</span></li>
              <li>• Sarah owes Brandon <span className="text-primary font-semibold">$8.50</span></li>
            </ul>
            <Button className="text-xs mt-1">📤 Send Settle Up Summary to Group</Button>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Group Dining Alerts */}
      <Card className="border-primary/20 bg-card/80 overflow-hidden">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">🍽️ Group Dining Alerts</CardTitle>
          <CardDescription>All members are notified simultaneously when a reservation opens</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-yellow-500/20 bg-[#0D1230]/60 p-3">
              <p className="text-sm font-semibold text-foreground">Be Our Guest · May 21 · Party of 5 · Dinner</p>
              <p className="text-xs text-yellow-400 mt-1 font-semibold">🟡 Watching...</p>
            </div>
            <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <p className="text-sm font-semibold text-foreground">Cinderella's Royal Table · May 22 · Party of 5 · Breakfast</p>
              <p className="text-xs text-green-400 mt-1 font-semibold">🟢 AVAILABLE — Book Now!</p>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" className="h-7 text-[11px]">Book Now</Button>
                <CompassButton destination="Cinderella's Royal Table" context="Fantasyland · Magic Kingdom" />
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Add Group Dining Alert</Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default GroupCoordinator;
