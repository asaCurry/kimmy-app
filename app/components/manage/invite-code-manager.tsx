import * as React from "react";
import { useFetcher } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { 
  Key, 
  Copy, 
  RefreshCw, 
  Check, 
  Users,
  Share2,
  QrCode
} from "lucide-react";

interface InviteCodeManagerProps {
  householdId: string;
  currentInviteCode?: string;
  onInviteCodeGenerated?: (newCode: string) => void;
}

export const InviteCodeManager: React.FC<InviteCodeManagerProps> = ({
  householdId,
  currentInviteCode,
  onInviteCodeGenerated,
}) => {
  const [inviteCode, setInviteCode] = React.useState(currentInviteCode || "Loading...");
  const [copied, setCopied] = React.useState(false);
  const fetcher = useFetcher();

  // Update local state when prop changes
  React.useEffect(() => {
    if (currentInviteCode) {
      setInviteCode(currentInviteCode);
    }
  }, [currentInviteCode]);

  // Handle fetcher data changes
  React.useEffect(() => {
    if (fetcher.data?.success && fetcher.data.inviteCode) {
      setInviteCode(fetcher.data.inviteCode);
      onInviteCodeGenerated?.(fetcher.data.inviteCode);
    }
  }, [fetcher.data, onInviteCodeGenerated]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite code:', error);
    }
  };

  const handleGenerateNewCode = () => {
    const formData = new FormData();
    formData.append("householdId", householdId);

    fetcher.submit(formData, {
      method: "post",
      action: "/api/invite-codes/regenerate",
    });
  };

  const handleShareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join My Household',
          text: `Use this invite code to join my household: ${inviteCode}`,
          url: window.location.origin,
        });
      } catch (error) {
        console.error('Failed to share invite code:', error);
      }
    } else {
      // Fallback to copying to clipboard
      handleCopyCode();
    }
  };

  const isGenerating = fetcher.state === "submitting";

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Key className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-slate-100">Invite Code</CardTitle>
            <p className="text-sm text-slate-400">
              Share this code with household members to let them join your household
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Invite Code */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-300">Current Invite Code</label>
          <div className="flex gap-2">
            <Input
              value={inviteCode}
              readOnly
              className="font-mono text-lg text-center bg-slate-700 border-slate-600 text-blue-400"
            />
            <Button
              onClick={handleCopyCode}
              variant="outline"
              size="icon"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {copied && (
            <p className="text-sm text-green-400 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Copied to clipboard!
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={handleShareCode}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button
            onClick={handleGenerateNewCode}
            disabled={isGenerating}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'New Code'}
          </Button>
          
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
          <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            How to Use
          </h4>
          <div className="text-sm text-slate-300 space-y-1">
            <p>• Share this code with household members via text, email, or social media</p>
            <p>• They can enter this code when creating their account or joining</p>
            <p>• The code will automatically add them to your household</p>
            <p>• Generate a new code anytime for security</p>
          </div>
        </div>

        {/* Security Note */}
        <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
          <p className="text-sm text-amber-400">
            <strong>Security Note:</strong> Only share this code with people you trust. 
            Anyone with this code can join your household. Generate a new code if you suspect it has been compromised.
          </p>
        </div>

        {/* Error Display */}
        {fetcher.data?.error && (
          <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20">
            <p className="text-sm text-red-400">
              <strong>Error:</strong> {fetcher.data.error}
            </p>
          </div>
        )}

        {/* Success Message */}
        {fetcher.data?.success && (
          <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/20">
            <p className="text-sm text-green-400">
              <strong>Success:</strong> {fetcher.data.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
