import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";

const AttractionPriorities = () => {
  const { access } = useSubscription();
  return (
    <DashboardLayout title="⭐ Attraction Priorities" subtitle="Organize your must-do attractions before you go">
      <FeatureGate hasAccess={!!access.attractionPriorities} featureName="Attraction Priorities Tool" requiredPlan="90 Day Magic Pass Planner">
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Star className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md">
              Organize your must-do attractions before you go. Rank rides, set priorities, and let the trip planner optimize your day.
            </p>
          </CardContent>
        </Card>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default AttractionPriorities;
