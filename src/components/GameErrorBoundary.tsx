import { Component, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("Game error:", error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen bg-[#060a14] p-4 flex items-center justify-center"
        >
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Game Error</h2>
            <p className="text-white/60 mb-6">
              Something went wrong. Please try again or return to the games menu.
            </p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-red-400 mb-6 font-mono">
                {this.state.error?.message}
              </p>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
