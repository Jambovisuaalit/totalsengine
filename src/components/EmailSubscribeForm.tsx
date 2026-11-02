import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";

interface SubscribeResponse {
  message?: string;
  alreadySubscribed?: boolean;
  error?: string;
}

interface EmailSubscribeFormProps {
  buttonText?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
}

export const EmailSubscribeForm = ({
  buttonText = "Get daily summary",
  variant = "secondary",
}: EmailSubscribeFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes("@") || trimmedEmail.length > 255) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke<SubscribeResponse>(
        "subscribe-email",
        { body: { email: trimmedEmail } }
      );

      if (error) throw error;

      if (data?.alreadySubscribed) {
        toast({
          title: "Already subscribed",
          description: "This email is already on our list.",
        });
      } else {
        toast({
          title: "Subscribed",
          description: "You'll receive the daily summary starting tomorrow.",
        });
      }

      setEmail("");
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-12 sm:h-11 bg-card border-border/60 text-base transition-colors focus:border-foreground/30"
      />
      <Button
        type="submit"
        size="lg"
        variant={variant}
        className="h-12 sm:h-11 px-5 font-medium text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        disabled={isSubmitting}
      >
        <Mail className="h-4 w-4 mr-2" />
        {isSubmitting ? "Subscribing..." : buttonText}
      </Button>
    </form>
  );
};