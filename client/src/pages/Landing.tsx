import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Zap, History } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  return (
    <div
      className="flex flex-col items-center min-h-[90vh]
    px-4 overflow-hidden"
    >
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col items-center mt-24 relative z-10">
        <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm">
          ✨ Real-time Collaborative Whiteboard
        </Badge>

        <h1 className="text-6xl font-bold tracking-tight mb-6 max-w-3xl leading-tight">
          Draw together,{" "}
          <span className="text-purple-600 dark:text-purple-400">
            in real time
          </span>
        </h1>

        <p className="text-muted-foreground text-xl mb-10 max-w-xl leading-relaxed">
          Create a room, share the link and collaborate on a whiteboard{" "}
        </p>

        <div className="flex gap-4">
          <Button
            size="lg"
            className="gap-2 px-8 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => navigate(isLoggedIn ? "/dashboard" : "/register")}
          >
            {isLoggedIn ? "Start Drawing" : "Get started"}{" "}
            <ArrowRight size={16} />
          </Button>

          
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full relative z-10 pb-8">
        <div className="border border-border rounded-2xl p-6 flex flex-col gap-3 bg-card hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Users size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg">Real-time Collaborations</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Multiple users can draw on the same canvas simultaneously in real
            time.
          </p>
        </div>

        <div className="border border-border rounded-2xl p-6 flex flex-col gap-3 bg-card hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Zap size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-lg">Instant Sharing</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Share a unique room code with anyone to invite them to your
            whiteboard.
          </p>
        </div>
        <div className="border border-border rounded-2xl p-6 flex flex-col gap-3 bg-card hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <History
              size={20}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
          <h3 className="font-semibold text-lg">Persistent History</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            All strokes are saved — rejoin any room and see the full drawing
            history.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
