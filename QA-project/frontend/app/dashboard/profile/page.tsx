"use client";

import { useState } from "react";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { users } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Send, CheckCircle, ShieldCheck } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loadingCode, setLoadingCode] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    setLoadingCode(true);
    try {
      const response = await users.getTelegramCode();
      setLinkCode(response.code);
      toast.success("Connection code generated!");
    } catch (error) {
      toast.error("Failed to generate code. Please try again.");
    } finally {
      setLoadingCode(false);
    }
  };

  return (
    <>
      <Topbar title="Profile & Settings" description="Manage your account and bot connectivity" />
      <div className="p-6 max-w-4xl space-y-6">
        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your basic profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-lg font-medium">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <p className="text-lg font-medium">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Role</label>
                <div className="flex items-center gap-2 mt-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Linking */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <CardTitle>Telegram Connectivity</CardTitle>
            </div>
            <CardDescription>Link your account to the AI QA Telegram Bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!linkCode ? (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 rounded-xl bg-background/50">
                <p className="text-sm text-center text-muted-foreground mb-6 max-w-sm">
                  Connect your Telegram account to get AI insights, daily summaries, and risk reports directly on your phone.
                </p>
                <Button 
                  onClick={handleGenerateCode} 
                  disabled={loadingCode}
                  size="lg"
                  className="gap-2"
                >
                  {loadingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Generate Connection Code
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center p-6 bg-background border border-primary/30 rounded-xl shadow-sm">
                  <p className="text-sm font-medium mb-3">Your Telegram Link Code:</p>
                  <div className="flex gap-2">
                    {linkCode.split("").map((digit, i) => (
                      <div key={i} className="w-10 h-14 flex items-center justify-center bg-secondary text-2xl font-bold rounded-lg border border-border">
                        {digit}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    This code will expire soon for your security.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Next Steps:</h4>
                  <ul className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                    <li>Open your Telegram app.</li>
                    <li>Search for the bot (or type <code className="bg-secondary px-1 py-0.5 rounded">/start</code> if you've already opened it).</li>
                    <li>Paste the 6-digit code above directly in the chat.</li>
                    <li>You'll receive a confirmation message once linked! ✅</li>
                  </ul>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setLinkCode(null)} className="text-xs">
                  Generate a different code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
