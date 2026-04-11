import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { AlertLimit } from '@/lib/planFeatures';
import { alertLimitLabel } from '@/lib/planFeatures';

interface AlertLimitBannerProps {
  limit: AlertLimit;
  currentCount: number;
  alertTypeName: string;
}

export function AlertLimitBanner({ limit, currentCount, alertTypeName }: AlertLimitBannerProps) {
  const navigate = useNavigate();

  if (limit === 'unlimited') return null;

  if (limit === 'none') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 mb-4">
        <Lock className="w-4 h-4 text-destructive shrink-0" />
        <span className="text-sm text-destructive flex-1">
          {alertTypeName} are not included in your current plan.
        </span>
        <Button size="sm" variant="destructive" onClick={() => navigate('/pricing')}>
          Upgrade
        </Button>
      </div>
    );
  }

  if (limit === 'links_only') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 mb-4">
        <Lock className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground flex-1">
          Your plan allows viewing shared {alertTypeName.toLowerCase()} links only. Upgrade to create your own alerts.
        </span>
        <Button size="sm" onClick={() => navigate('/pricing')}>
          Upgrade
        </Button>
      </div>
    );
  }

  const atLimit = currentCount >= limit;
  const nearLimit = currentCount >= limit - 1 && currentCount < limit;

  if (atLimit) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 mb-4">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
        <span className="text-sm text-destructive flex-1">
          You've reached your limit of {limit} active {alertTypeName.toLowerCase()}. Upgrade for more.
        </span>
        <Button size="sm" variant="destructive" onClick={() => navigate('/pricing')}>
          Upgrade
        </Button>
      </div>
    );
  }

  if (nearLimit) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mb-4">
        <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm text-muted-foreground flex-1">
          {currentCount} of {limit} {alertTypeName.toLowerCase()} used. {alertLimitLabel(limit)} on your plan.
        </span>
      </div>
    );
  }

  return null;
}

export function useAlertLimitGuard(limit: AlertLimit, currentCount: number) {
  const canAddAlert =
    limit === 'unlimited' ||
    (typeof limit === 'number' && currentCount < limit);
  const isLinksOnly = limit === 'links_only';
  const isBlocked = limit === 'none';
  return { canAddAlert, isLinksOnly, isBlocked };
}
