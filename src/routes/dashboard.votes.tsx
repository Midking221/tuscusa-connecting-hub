import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, X, Vote as VoteIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard/votes")({
  component: VotesPage,
});

function VotesPage() {
  const { user, isStaff, isVerified } = useAuth();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [pollForm, setPollForm] = useState({ title: "", description: "", options: ["", ""] });

  const { data: polls, isLoading } = useQuery({
    queryKey: ["polls-all", user?.id],
    queryFn: async () => {
      const { data: polls, error } = await supabase
        .from("polls")
        .select("*, poll_options(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: tallies } = await (supabase as any).from("poll_vote_tallies").select("poll_id, option_id, vote_count");
      const { data: myVotes } = user
        ? await supabase.from("poll_votes").select("poll_id, option_id, user_id").eq("user_id", user.id)
        : { data: [] as { poll_id: string; option_id: string; user_id: string }[] };
      const tallyList = (tallies ?? []) as { poll_id: string; option_id: string; vote_count: number }[];
      const mine = (myVotes ?? []) as { poll_id: string; option_id: string; user_id: string }[];
      return (polls ?? []).map((p: any) => {
        const pTallies = tallyList.filter((t) => t.poll_id === p.id);
        const my = mine.find((v) => v.poll_id === p.id);
        const pollVotes: { option_id: string; user_id: string }[] = [];
        for (const t of pTallies) {
          const isMine = my?.option_id === t.option_id;
          const synthetic = isMine ? t.vote_count - 1 : t.vote_count;
          for (let i = 0; i < synthetic; i++) pollVotes.push({ option_id: t.option_id, user_id: "" });
          if (isMine) pollVotes.push({ option_id: t.option_id, user_id: my!.user_id });
        }
        return { ...p, poll_votes: pollVotes };
      });
    },
  });

  const createPoll = useMutation({
    mutationFn: async () => {
      const opts = pollForm.options.map((o) => o.trim()).filter(Boolean);
      if (pollForm.title.trim().length < 3) throw new Error("Title too short");
      if (opts.length < 2) throw new Error("Need at least 2 options");
      const { data: poll, error } = await supabase
        .from("polls")
        .insert({
          title: pollForm.title.trim(),
          description: pollForm.description.trim() || null,
          status: "active",
          starts_at: new Date().toISOString(),
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: optErr } = await supabase
        .from("poll_options")
        .insert(opts.map((label, i) => ({ poll_id: poll.id, label, position: i })));
      if (optErr) throw optErr;
    },
    onSuccess: () => {
      toast.success("Poll created");
      setCreateOpen(false);
      setPollForm({ title: "", description: "", options: ["", ""] });
      qc.invalidateQueries({ queryKey: ["polls-all"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const castVote = useMutation({
    mutationFn: async ({ poll_id, option_id }: { poll_id: string; option_id: string }) => {
      const { error } = await supabase.from("poll_votes").insert({ poll_id, option_id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vote cast");
      qc.invalidateQueries({ queryKey: ["polls-all"] });
    },
    onError: (e: Error) => {
      if (e.message.includes("duplicate")) toast.error("You already voted on this poll.");
      else toast.error(e.message);
    },
  });

  const closePoll = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("polls").update({ status: "closed", ends_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Poll closed"); qc.invalidateQueries({ queryKey: ["polls-all"] }); },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Votes & polls</h1>
          <p className="text-muted-foreground mt-1">Cast your vote on key decisions.</p>
        </div>
        {isStaff && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Create poll</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create new poll</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={pollForm.title} onChange={(e) => setPollForm({ ...pollForm, title: e.target.value })} maxLength={200} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Textarea rows={3} value={pollForm.description} onChange={(e) => setPollForm({ ...pollForm, description: e.target.value })} maxLength={1000} />
                </div>
                <div className="space-y-1.5">
                  <Label>Options</Label>
                  {pollForm.options.map((o, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={o}
                        onChange={(e) => {
                          const next = [...pollForm.options];
                          next[i] = e.target.value;
                          setPollForm({ ...pollForm, options: next });
                        }}
                        placeholder={`Option ${i + 1}`}
                        maxLength={200}
                      />
                      {pollForm.options.length > 2 && (
                        <Button variant="ghost" size="icon" onClick={() => setPollForm({ ...pollForm, options: pollForm.options.filter((_, idx) => idx !== i) })}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setPollForm({ ...pollForm, options: [...pollForm.options, ""] })}>
                    Add option
                  </Button>
                </div>
                <Button className="w-full" onClick={() => createPoll.mutate()} disabled={createPoll.isPending}>
                  {createPoll.isPending ? "Creating…" : "Launch poll"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isVerified && !isStaff && (
        <Card className="p-4 border-warning/40 bg-warning/10 text-sm">
          Your account must be verified before you can vote. Visit your profile to complete it.
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && polls?.length === 0 && (
        <Card className="p-12 text-center text-muted-foreground"><VoteIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />No polls yet.</Card>
      )}

      <div className="space-y-4">
        {(polls ?? []).map((p: { id: string; title: string; description: string | null; status: string; poll_options: { id: string; label: string; position: number }[]; poll_votes: { option_id: string; user_id: string }[] }) => {
          const userVote = p.poll_votes.find((v) => v.user_id === user?.id);
          const totalVotes = p.poll_votes.length;
          const canVote = p.status === "active" && !userVote && isVerified;
          return (
            <Card key={p.id} className="p-5 shadow-card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{p.title}</h3>
                  {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                </div>
                <Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge>
              </div>
              <div className="space-y-2 mt-4">
                {p.poll_options.sort((a, b) => a.position - b.position).map((opt) => {
                  const count = p.poll_votes.filter((v) => v.option_id === opt.id).length;
                  const pct = totalVotes ? Math.round((count / totalVotes) * 100) : 0;
                  const isUserChoice = userVote?.option_id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!canVote}
                      onClick={() => canVote && castVote.mutate({ poll_id: p.id, option_id: opt.id })}
                      className={`relative w-full text-left p-3 rounded-md border overflow-hidden transition-all ${
                        canVote ? "hover:border-primary cursor-pointer" : "cursor-default"
                      } ${isUserChoice ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <div className="absolute inset-y-0 left-0 bg-primary/10" style={{ width: `${pct}%` }} />
                      <div className="relative flex items-center justify-between text-sm">
                        <span className="font-medium">{opt.label} {isUserChoice && "✓"}</span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                {isStaff && p.status === "active" && (
                  <Button size="sm" variant="ghost" onClick={() => closePoll.mutate(p.id)}>Close poll</Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
