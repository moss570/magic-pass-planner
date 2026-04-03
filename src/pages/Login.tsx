import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Castle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #080E1E 0%, #0D1230 100%)" }}>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
        <div className="rounded-xl bg-card gold-border p-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Castle className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold text-primary">Magic Pass</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Log in to your Magic Pass account
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="mt-1 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Link to="#" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="mt-1 bg-muted border-border text-foreground placeholder:text-muted-foreground rounded-lg"
              />
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg h-11">
              Log In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-card px-3">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full border-border text-foreground hover:bg-muted rounded-lg h-11 font-medium"
          >
            Continue with Google
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Start free trial
            </Link>
          </p>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
