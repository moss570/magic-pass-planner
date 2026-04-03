import { Castle } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(180deg, #080E1E 0%, #0D1230 100%)" }}
    >
      <div className="text-center">
        <Castle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Dashboard coming in next build</h1>
        <p className="text-muted-foreground mb-6">We're working on something magical ✨</p>
        <Link to="/" className="text-primary hover:underline text-sm font-medium">
          ← Back to home
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
