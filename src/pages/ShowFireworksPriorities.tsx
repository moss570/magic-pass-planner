import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";

const ShowFireworksPriorities = () => {
  const { access } = useSubscription();
  return (
    <DashboardLayout title="🎆 Shows & Fireworks Priorities" subtitle="Never miss the shows that matter most">
      <FeatureGate hasAccess={!!access.showFireworksPriorities} featureName="Shows & Fireworks Priorities" requiredPlan="90 Day Magic Pass Planner">
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Sparkles className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md">
              Rank your must-see shows and fireworks, get optimal viewing spot suggestions, and sync with your itinerary.
            </p>
          </CardContent>
        </Card>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default ShowFireworksPriorities;
