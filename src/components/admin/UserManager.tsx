import { useState, useEffect, useCallback } from "react";
import { Search, ChevronUp, ChevronDown, Trash2, AlertTriangle, ArrowUpDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";

const PLAN_OPTIONS = [
  { value: "none", label: "No Plan" },
  { value: "free", label: "Free – 7 Day Trial" },
  { value: "ninety_day_planner", label: "90 Day Magic Pass Planner" },
  { value: "ninety_day_friend", label: "90 Day Magic Pass Friend" },
  { value: "magic_pass_planner", label: "Magic Pass Planner" },
  { value: "magic_pass_plus", label: "Magic Pass Plus" },
  { value: "founders_pass", label: "Founders Pass" },
  { value: "vip_free_forever", label: "VIP Free Forever" },
];

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  plan_name: string | null;
  status: string;
  billing_interval: string | null;
  sub_updated_at: string | null;
  active_alerts: number;
  is_vip: boolean;
  vip_type: string | null;
  vip_status: string | null;
}

type SortKey = "email" | "plan_name" | "status" | "active_alerts" | "created_at";

export default function UserManager() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [filterTier, setFilterTier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Delete dialog
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Error viewer
  const [errorUser, setErrorUser] = useState<AdminUser | null>(null);
  const [errors, setErrors] = useState<{ dining_errors: any[]; event_errors: any[] } | null>(null);
  const [errorsLoading, setErrorsLoading] = useState(false);

  // Tier change loading
  const [tierLoading, setTierLoading] = useState<string | null>(null);

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${session?.access_token}`,
    "x-client-authorization": `Bearer ${session?.access_token}`,
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmVsaHJtZ3NwdXp0ZWhldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzcyNzgsImV4cCI6MjA5MDgxMzI3OH0.vjT4Iun32HsCfoO7nVnfzLBnJy-Lye6N9ZryBbWuAjo",
  }), [session]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadUsers = useCallback(async (append = false) => {
    if (!session) return;
    setLoading(true);
    try {
      const o = append ? offset : 0;
      const params = new URLSearchParams({ action: "list-users", offset: String(o), limit: "100" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-user-manage?${params}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (append) {
        setUsers(prev => [...prev, ...(data.users || [])]);
      } else {
        setUsers(data.users || []);
      }
      setHasMore(data.hasMore || false);
      setOffset(o + (data.users?.length || 0));
    } catch (err: any) {
      toast({ title: "Failed to load users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [session, debouncedSearch, offset, getHeaders, toast]);

  useEffect(() => {
    setOffset(0);
    loadUsers(false);
  }, [debouncedSearch, session]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleTierChange = async (userId: string, planName: string) => {
    setTierLoading(userId);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-user-manage?action=update-tier`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ user_id: userId, plan_name: planName, status: planName === "none" ? "canceled" : "active" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "✅ Tier updated" });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan_name: planName === "none" ? null : planName, status: planName === "none" ? "canceled" : "active" } : u));
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setTierLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-user-manage?action=delete-user-data`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify({ user_id: deleteUser.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "✅ User data deleted" });
      setUsers(prev => prev.filter(u => u.id !== deleteUser.id));
      setDeleteUser(null);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const viewErrors = async (u: AdminUser) => {
    setErrorUser(u);
    setErrorsLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-user-manage?action=user-errors&user_id=${u.id}`, { headers: getHeaders() });
      const data = await res.json();
      setErrors(data);
    } catch {
      setErrors({ dining_errors: [], event_errors: [] });
    } finally {
      setErrorsLoading(false);
    }
  };

  // Client-side sort & filter
  const filtered = users
    .filter(u => filterTier === "all" || (u.plan_name || "none") === filterTier)
    .filter(u => filterStatus === "all" || u.status === filterStatus)
    .sort((a, b) => {
      let va: any = a[sortKey] ?? "";
      let vb: any = b[sortKey] ?? "";
      if (sortKey === "active_alerts") { va = a.active_alerts; vb = b.active_alerts; }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortAsc ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const statusColor = (s: string) => {
    if (s === "active") return "bg-green-500/20 text-green-400";
    if (s === "trialing") return "bg-yellow-500/20 text-yellow-400";
    if (s === "canceled") return "bg-red-500/20 text-red-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by email or name..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Tiers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {PLAN_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} users</span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "var(--card)" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("email")}>
                <span className="flex items-center">User <SortIcon col="email" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("plan_name")}>
                <span className="flex items-center">Tier <SortIcon col="plan_name" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>
                <span className="flex items-center">Status <SortIcon col="status" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("active_alerts")}>
                <span className="flex items-center">Alerts <SortIcon col="active_alerts" /></span>
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort("created_at")}>
                <span className="flex items-center">Joined <SortIcon col="created_at" /></span>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>
            ) : filtered.map(u => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">{u.first_name || ""} {u.last_name || ""}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    {u.is_vip && u.vip_type === "beta_tester" && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0">Beta</Badge>
                    )}
                    {u.is_vip && u.vip_type !== "beta_tester" && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1.5 py-0">VIP</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={u.plan_name || "none"}
                    onValueChange={v => handleTierChange(u.id, v)}
                    disabled={tierLoading === u.id || (u.is_vip && u.vip_type !== "beta_tester")}
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge className={`${statusColor(u.status)} text-xs`}>{u.status}</Badge>
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-semibold ${u.active_alerts > 0 ? "text-primary" : "text-muted-foreground"}`}>{u.active_alerts}</span>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => viewErrors(u)} title="View errors">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)} title="Delete user data">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => loadUsers(true)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Load More
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={open => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all data for {deleteUser?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all alerts, trips, messages, game sessions, and profile data for this user. The auth account will remain (manage in Supabase dashboard). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting..." : "Delete All Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Viewer Dialog */}
      <Dialog open={!!errorUser} onOpenChange={open => !open && setErrorUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Failed Notifications — {errorUser?.email}</DialogTitle>
          </DialogHeader>
          {errorsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {(!errors?.dining_errors?.length && !errors?.event_errors?.length) ? (
                <p className="text-center text-muted-foreground py-6">No failed notifications found 🎉</p>
              ) : (
                <>
                  {(errors?.dining_errors || []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Dining Notification Failures</h3>
                      <div className="space-y-2">
                        {errors!.dining_errors.map((e: any) => (
                          <div key={e.id} className="rounded-lg border border-white/8 p-3 text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium">{e.restaurant_name || "Unknown"}</span>
                              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-muted-foreground mt-1">{e.notification_type} — {JSON.stringify(e.delivery_details)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(errors?.event_errors || []).length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Event Notification Failures</h3>
                      <div className="space-y-2">
                        {errors!.event_errors.map((e: any) => (
                          <div key={e.id} className="rounded-lg border border-white/8 p-3 text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium">{e.event_name || "Unknown"}</span>
                              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-muted-foreground mt-1">{e.notification_type} — {JSON.stringify(e.delivery_details)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
