import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";

const CharacterMeets = () => {
  const { access } = useSubscription();
  return (
    <DashboardLayout title="💖 Character Meet Priorities" subtitle="Plan your character meet-and-greet schedule">
      <FeatureGate hasAccess={!!access.characterMeetsPriorities} featureName="Character Meet Priorities" requiredPlan="90 Day Magic Pass Planner">
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Heart className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md">
              Rank your must-meet characters, track locations, and get optimized schedules for character appearances.
            </p>
          </CardContent>
        </Card>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default CharacterMeets;
