import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const OrlandoInsidersGuide = () => {
  return (
    <DashboardLayout title="🌴 Orlando Insiders Guide" subtitle="Tips, tricks & local secrets">
      <Card className="border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
          <MapPin className="w-12 h-12 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            Insider tips for Orlando beyond the parks — restaurants, attractions, hidden gems, and local favorites.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default OrlandoInsidersGuide;
