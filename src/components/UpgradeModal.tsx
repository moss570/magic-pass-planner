import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureName: string;
  requiredPlan?: string;
  description?: string;
}

export function UpgradeModal({ open, onClose, featureName, requiredPlan = 'Magic Pass Planner', description }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <DialogTitle className="text-center">{featureName}</DialogTitle>
          <DialogDescription className="text-center">
            {description ?? `Unlock ${featureName} by upgrading to the ${requiredPlan} plan or above.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-center mt-4">
          <Button variant="outline" onClick={onClose}>Maybe Later</Button>
          <Button onClick={() => { onClose(); navigate('/pricing'); }}>
            See Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
