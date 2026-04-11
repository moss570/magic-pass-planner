import { useState } from "react";
import { Copy, Trash2, Check, Pencil, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export interface TripVersion {
  id: string;
  trip_id: string;
  version_number: number;
  name: string;
  inputs: any;
  plans: any[];
  totals: any;
  warnings: any[];
  is_active: boolean;
}

interface Props {
  versions: TripVersion[];
  activeVersionId: string | null;
  onSwitch: (version: TripVersion) => void;
  onDuplicate: () => void;
  onRename: (versionId: string, newName: string) => void;
  onDelete: (versionId: string) => void;
  onSetActive: (versionId: string) => void;
  onCompare: () => void;
  disabled?: boolean;
}

export default function VersionSwitcher({
  versions, activeVersionId, onSwitch, onDuplicate, onRename, onDelete, onSetActive, onCompare, disabled,
}: Props) {
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const { toast } = useToast();

  const activeVersion = versions.find(v => v.id === activeVersionId) || versions[0];

  const handleRenameSubmit = () => {
    if (renameId && renameName.trim()) {
      onRename(renameId, renameName.trim());
      setRenameId(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={disabled}>
              <GitBranch className="w-3.5 h-3.5" />
              {activeVersion?.name || "Version 1"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {versions.map(v => (
              <DropdownMenuItem key={v.id} onClick={() => onSwitch(v)} className="flex items-center justify-between">
                <span className={v.id === activeVersionId ? "font-bold" : ""}>{v.name}</span>
                {v.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold">Active</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDuplicate} disabled={versions.length >= 3}>
              <Plus className="w-3.5 h-3.5 mr-2" />
              {versions.length >= 3 ? "Max 3 versions" : "Duplicate as new version"}
            </DropdownMenuItem>
            {activeVersion && (
              <>
                <DropdownMenuItem onClick={() => { setRenameId(activeVersion.id); setRenameName(activeVersion.name); }}>
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                </DropdownMenuItem>
                {!activeVersion.is_active && (
                  <DropdownMenuItem onClick={() => onSetActive(activeVersion.id)}>
                    <Check className="w-3.5 h-3.5 mr-2" /> Set as active
                  </DropdownMenuItem>
                )}
                {versions.length > 1 && (
                  <DropdownMenuItem onClick={() => onDelete(activeVersion.id)} className="text-destructive">
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete version
                  </DropdownMenuItem>
                )}
              </>
            )}
            {versions.length >= 2 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCompare}>
                  <Copy className="w-3.5 h-3.5 mr-2" /> Compare versions
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick version pills */}
        {versions.length > 1 && versions.map(v => (
          <button
            key={v.id}
            onClick={() => onSwitch(v)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              v.id === activeVersionId
                ? "border-primary bg-primary/10 text-primary font-bold"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            V{v.version_number}
          </button>
        ))}
      </div>

      {/* Rename dialog */}
      <Dialog open={!!renameId} onOpenChange={open => { if (!open) setRenameId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Rename Version</DialogTitle></DialogHeader>
          <Input value={renameName} onChange={e => setRenameName(e.target.value)} placeholder="Version name" onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
