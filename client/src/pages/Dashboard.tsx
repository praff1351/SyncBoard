import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users, ArrowRight, Copy, Check } from "lucide-react";
import api from "@/api/axios";

interface Room {
  id: string;
  name: string;
  share_key: string;
  owner_id: string;
  member_count: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [roomName, setRoomName] = useState("");
  const [shareKey, setShareKey] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await api.get("/rooms");
      return res.data.rooms as Room[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/rooms/create", { name: roomName });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setCreateOpen(false);
      setRoomName("");
      navigate(`/whiteboard/${data.room.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Something went wrong");
    },
  });
  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/rooms/join", { shareKey });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setJoinOpen(false);
      setShareKey("");
      navigate(`/whiteboard/${data.room.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Room not found");
    },
  });

  const copyShareKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/*HEADER*/}
      <div className="flex items-center justify-between mb-10">
        <div className="">
          <h1 className="text-3xl font-bold">
            {" "}
            Hey, {user.name?.split(" ")[0]}
          </h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Your collaborative whiteboards
        </p>
      </div>
      <div className="flex gap-3">
        {/*JOIN ROOM */}
        <Dialog
          open={joinOpen}
          onOpenChange={(o) => {
            setJoinOpen(o);
            setError("");
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline">Join Room</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Room</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <Label>Share Key</Label>
                <Input
                  placeholder="Enter a room share key"
                  value={shareKey}
                  onChange={(e) => setShareKey(e.target.value.toUpperCase())}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!shareKey || joinMutation.isPending}
                onClick={() => joinMutation.mutate()}
              >
                {joinMutation.isPending ? "Joining..." : "Join Room"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/*CREATE ROOM */}
        <Dialog
          open={createOpen}
          onOpenChange={(o) => {
            setCreateOpen(o);
            setError("");
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Plus size={16} />
              New Room
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new Room</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-2 ">
              <div className="flex flex-col gap-2 ">
                <Label>Room Name</Label>
                <Input
                  placeholder="e.g. Design Meeting"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!roomName || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending
                  ? "Creating a room..."
                  : "Create a room"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/*ROOMS */}
      <div className="mt-6">
      {isLoading ? (
        <p className="text-muted-foreground">Loading rooms...</p>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
          {data.map((room) => (
            <Card
              key={room.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/whiteboard/${room.id}`)}
            >
              <CardContent className="pt-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="">
                    <h3 className="font-semibold text-lg">{room.name}</h3>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                      <Users size={14} />
                      <span>
                        {room.member_count} member
                        {Number(room.member_count) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-muted-foreground mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="font-mono text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                  >
                    {room.share_key}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyShareKey(room.share_key, room.id);
                    }}
                  >
                    {copiedId === room.id ? (
                      <>
                        <Check size={12} />
                        Copied!
                      </>
                    ) : (
                      <>
                        {" "}
                        <Copy size={12} /> Copy Key{" "}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <p className="text-muted-foreground text-center">
              No rooms yet. Create one or join with a share key!
            </p>

            <Button className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setCreateOpen(true)}
              >
              Create your first room
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
