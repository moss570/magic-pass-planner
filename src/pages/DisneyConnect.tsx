import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Castle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SUPABASE_URL = "https://wknelhrmgspuztehetpa.supabase.co";
const SUPABASE_ANON = "sb_publishable_nQdtcwDbXVyr0Tc44YLTKA_9BfIKXQC";

export default function DisneyConnect() {
  const [status, setStatus] = useState<"loading" | "capturing" | "saving" | "success" | "error">("loading");
  const [message, setMessage] = useState("Connecting to Disney...");
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const run = async () => {
      // Step 1: Check if we're returning from Disney (have session cookies)
      setStatus("capturing");
      setMessage("Capturing your Disney session...");

      try {
        // Try to fetch the Disney guest token using the page's session context
        // This works because the browser has Disney's session cookies from visiting their site
        const resp = await fetch("https://disneyworld.disney.go.com/profile-api/authentication/get-client-token", {
          credentials: "include",
          headers: { "Accept": "application/json" }
        });

        if (resp.ok) {
          const data = await resp.json() as { access_token?: string };
          const token = data.access_token;

          if (token && session) {
            setStatus("saving");
            setMessage("Saving your Disney connection...");

            // Save to Supabase
            const saveResp = await fetch(`${SUPABASE_URL}/functions/v1/disney-auth?action=save`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
                "x-client-authorization": `Bearer ${session.access_token}`,
                "apikey": SUPABASE_ANON,
              },
              body: JSON.stringify({ access_token: token }),
            });

            const saveData = await saveResp.json();
            if (saveData.success) {
              setStatus("success");
              setMessage(saveData.hasFullScope
                ? "✅ Disney account connected! Real-time dining alerts are now active."
                : "⚠️ Connected! Some dining features may need a Disney login refresh.");
              setTimeout(() => navigate("/settings?disney=connected"), 2500);
              return;
            }
          }
        }

        // If we couldn't get a token directly, it means Disney session isn't active
        // Redirect to Disney's login page, then come back
        const returnUrl = `${window.location.origin}/disney-connect?return=1`;
        window.location.href = `https://disneyworld.disney.go.com/login/?returnURL=${encodeURIComponent("https://disneyworld.disney.go.com/dine-res/availability/?connected=1")}`;

      } catch (err) {
        setStatus("error");
        setMessage("Connection failed. Please try again.");
        setTimeout(() => navigate("/settings"), 3000);
      }
    };

    // If returning from Disney with return param, try capture again
    if (searchParams.get("return")) {
      run();
    } else {
      // First visit — check if already have Disney session, else redirect
      run();
    }
  }, [session, navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#080E1E" }}>
      <div className="text-center max-w-sm">
        <Castle className={`w-12 h-12 mx-auto mb-6 ${status === "success" ? "text-green-400" : status === "error" ? "text-red-400" : "text-primary"}`} style={status === "loading" || status === "capturing" || status === "saving" ? { animation: "pulse 2s infinite" } : {}} />
        <h2 className="text-xl font-bold text-foreground mb-3">
          {status === "success" ? "Connected!" : status === "error" ? "Connection Failed" : "Connecting Disney Account"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        {(status === "loading" || status === "capturing" || status === "saving") && (
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        {status === "success" && (
          <p className="text-xs text-muted-foreground mt-4">Returning to Settings...</p>
        )}
        {status === "error" && (
          <button onClick={() => navigate("/settings")} className="mt-4 px-6 py-2 rounded-lg font-bold text-sm text-[#080E1E]" style={{ background: "#F5C842" }}>
            Back to Settings
          </button>
        )}
      </div>
    </div>
  );
}
