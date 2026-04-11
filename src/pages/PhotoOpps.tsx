import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Sparkles, Sun } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureGate } from "@/components/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";

const PhotoOpps = () => {
  const { access } = useSubscription();
  return (
    <DashboardLayout title="📸 Photo Opportunities" subtitle="Capture magical moments">
      <Tabs defaultValue="fireworks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fireworks">Fireworks Ride Timing</TabsTrigger>
          <TabsTrigger value="golden">Golden Hour Planner</TabsTrigger>
          <TabsTrigger value="photopass">PhotoPass Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="fireworks">
          <FeatureGate hasAccess={!!access.fireworksRideCalculator} featureName="Fireworks Ride Timing Calculator" requiredPlan="90 Day Magic Pass Planner">
            <Card className="border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <Sparkles className="w-12 h-12 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
                <p className="text-muted-foreground max-w-md">
                  Time your rides to sync with fireworks for the perfect experience.
                </p>
              </CardContent>
            </Card>
          </FeatureGate>
        </TabsContent>

        <TabsContent value="golden">
          <FeatureGate hasAccess={!!access.goldenHourPlanner} featureName="Golden Hour & Sunset Shot Planner" requiredPlan="90 Day Magic Pass Planner">
            <Card className="border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <Sun className="w-12 h-12 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
                <p className="text-muted-foreground max-w-md">
                  Find the best spots and times for golden hour and sunset photos in each park.
                </p>
              </CardContent>
            </Card>
          </FeatureGate>
        </TabsContent>

        <TabsContent value="photopass">
          <FeatureGate hasAccess={!!access.photoPassAlerts} featureName="PhotoPass Proximity Alerts" requiredPlan="90 Day Magic Pass Planner">
            <Card className="border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <Camera className="w-12 h-12 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
                <p className="text-muted-foreground max-w-md">
                  Get alerts when you're near a PhotoPass photographer so you never miss a shot.
                </p>
              </CardContent>
            </Card>
          </FeatureGate>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default PhotoOpps;
