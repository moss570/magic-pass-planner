import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Vote } from "lucide-react";
import { FeatureGate } from "@/components/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";

const GroupPolls = () => {
  const { access } = useSubscription();
  return (
    <DashboardLayout title="🗳️ Group Trip Planning Polls" subtitle="Let your group vote on plans">
      <FeatureGate hasAccess={!!access.groupPolls} featureName="Group Trip Planning Polls" requiredPlan="90 Day Magic Pass Planner">
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Vote className="w-12 h-12 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md">
              Create polls to let your travel party vote on restaurants, rides, parks, and more.
            </p>
          </CardContent>
        </Card>
      </FeatureGate>
    </DashboardLayout>
  );
};

export default GroupPolls;
