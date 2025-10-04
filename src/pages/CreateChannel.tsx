import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const channelSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Channel name is required")
    .max(50, "Channel name must be less than 50 characters"),
  handle: z.string()
    .trim()
    .min(3, "Handle must be at least 3 characters")
    .max(30, "Handle must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Handle can only contain letters, numbers, and underscores"),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
});

export default function CreateChannel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setSession(session);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const rawData = {
        name: formData.get("name") as string,
        handle: formData.get("handle") as string,
        description: formData.get("description") as string || undefined,
      };

      // Validate input
      const validation = channelSchema.safeParse(rawData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const { name, handle, description } = validation.data;

      const { error } = await supabase
        .from("channels")
        .insert({
          user_id: session.user.id,
          name,
          handle: `@${handle}`,
          description,
        });

      setLoading(false);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Channel created successfully!",
      });
      navigate("/upload");
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Channel</CardTitle>
            <CardDescription>
              Set up your channel to start uploading videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Channel Name *
                </label>
                <Input
                  name="name"
                  placeholder="Your channel name"
                  required
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Handle *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">@</span>
                  <Input
                    name="handle"
                    placeholder="yourhandle"
                    required
                    maxLength={30}
                    pattern="[a-zA-Z0-9_]+"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <Textarea
                  name="description"
                  placeholder="Tell viewers about your channel"
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Channel"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
