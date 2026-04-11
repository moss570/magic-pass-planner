import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  hasAccess: boolean;
  featureName: string;
  requiredPlan?: string;
  inline?: boolean;
  children: React.ReactNode;
}

export function FeatureGate({
  hasAccess,
  featureName,
  requiredPlan = 'Magic Pass Planner',
  inline = false,
  children,
}: FeatureGateProps) {
  const navigate = useNavigate();

  if (hasAccess) return <>{children}</>;

  if (inline) {
    return (
      <div className="relative">
        <div className="opacity-40 pointer-events-none select-none blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pricing')}
            className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
          >
            <Lock className="w-3.5 h-3.5" />
            Upgrade to unlock
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-card/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{featureName}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            This feature is available on the {requiredPlan} plan and above.
          </p>
        </div>
        <Button
          onClick={() => navigate('/pricing')}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Upgrade Your Plan
        </Button>
      </CardContent>
    </Card>
  );
}
