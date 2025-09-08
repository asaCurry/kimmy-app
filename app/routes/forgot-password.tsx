import * as React from "react";
import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

export function meta() {
  return [
    { title: "Forgot Password - Hey, Kimmy" },
    { name: "description", content: "Reset your Hey, Kimmy account password" },
  ];
}

export default function ForgotPasswordPage() {
  const fetcher = useFetcher();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.success) {
        setIsSubmitted(true);
        toast.success("Password reset email sent!", {
          position: "top-right",
        });
      } else {
        const errorMessage = fetcher.data.error || "Failed to send reset email";

        // Show rate limiting specific message
        if (fetcher.data.retryAfter) {
          const minutes = Math.ceil(fetcher.data.retryAfter / 60);
          toast.error(
            `Too many requests. Please wait ${minutes} minute${minutes > 1 ? "s" : ""} before trying again.`,
            { position: "top-right", autoClose: 8000 }
          );
        } else {
          toast.error(errorMessage, {
            position: "top-right",
          });
        }
      }
    }
  }, [fetcher.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address", {
        position: "top-right",
      });
      return;
    }

    const formData = new FormData();
    formData.append("_action", "request-reset");
    formData.append("email", email.trim());

    fetcher.submit(formData, {
      method: "post",
      action: "/api/password-reset",
    });
  };

  const isLoading = fetcher.state === "submitting";

  if (isSubmitted) {
    return (
      <PageLayout maxWidth="2xl" showFooter={false}>
        <div className="max-w-md mx-auto">
          <PageHeader
            title="Check Your Email"
            subtitle="Password reset instructions sent"
          />

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-slate-100">
                Email Sent!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-slate-300">
                We've sent password reset instructions to:
              </p>
              <p className="font-medium text-blue-400 bg-blue-500/10 px-3 py-2 rounded">
                {email}
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm text-amber-400 font-medium mb-1">
                      Check your spam folder
                    </p>
                    <p className="text-xs text-amber-300/80">
                      Sometimes our emails end up in spam or promotional
                      folders. The reset link expires in 30 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
                >
                  Send to Different Email
                </Button>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center w-full text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="2xl" showFooter={false}>
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Reset Password"
          subtitle="Enter your email to get started"
        />

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl text-slate-100">
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  disabled={isLoading}
                  className="bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-sm text-slate-400">
                  We'll send password reset instructions to this email address.
                </p>
              </div>

              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Back to Sign In
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg">
          <h4 className="text-sm font-medium text-slate-300 mb-2">
            Security Notice
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            For security reasons, we'll send reset instructions to your email
            regardless of whether an account exists with that address.
          </p>
          <p className="text-xs text-slate-500 mb-2">
            Reset links expire after 30 minutes and can only be used once.
          </p>
          <p className="text-xs text-slate-500">
            Limited to 3 requests per email address every 15 minutes to prevent
            abuse.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
