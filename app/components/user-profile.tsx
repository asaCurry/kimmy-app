/**
 * User profile and settings component
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
  Settings as SettingsIcon,
} from "lucide-react";
import { useAuth } from "~/contexts/auth-context";
import { Badge } from "~/components/ui/badge";

interface UserProfileProps {
  onPasswordChangeSuccess?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  onPasswordChangeSuccess,
}) => {
  const { session } = useAuth();
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isSubmitting = navigation.state === "submitting";

  // Handle password change success callback
  useEffect(() => {
    if (
      actionData?.success &&
      actionData.action === "change-password" &&
      onPasswordChangeSuccess
    ) {
      onPasswordChangeSuccess();
    }
  }, [actionData, onPasswordChangeSuccess]);

  if (!session) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardContent className="p-6 text-center">
          <p className="text-slate-400">Please sign in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                {session.name}
                <Badge
                  variant={
                    session.role === "admin" ? "destructive" : "secondary"
                  }
                  className="text-xs"
                >
                  {session.role}
                </Badge>
              </CardTitle>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {session.email}
              </p>
              {session.currentHouseholdId && (
                <p className="text-slate-500 text-sm mt-1">
                  Household: {session.currentHouseholdId}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <SettingsIcon className="inline w-4 h-4 mr-2" />
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "password"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <Lock className="inline w-4 h-4 mr-2" />
          Change Password
        </button>
      </div>

      {/* Profile Settings Tab */}
      {activeTab === "profile" && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="update-profile" />

              {actionData?.error && actionData.action === "update-profile" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{actionData.error}</p>
                </div>
              )}

              {actionData?.success &&
                actionData.action === "update-profile" && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      {actionData.message}
                    </p>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  defaultValue={session.name}
                  className="bg-slate-900 border-slate-600 text-slate-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={session.email}
                  className="bg-slate-900 border-slate-600 text-slate-100"
                  required
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Password Change Tab */}
      {activeTab === "password" && (
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Change Password
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Update your password to keep your account secure.
            </p>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <input type="hidden" name="_action" value="change-password" />

              {actionData?.error && actionData.action === "change-password" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{actionData.error}</p>
                </div>
              )}

              {actionData?.success &&
                actionData.action === "change-password" && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      {actionData.message}
                    </p>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-slate-200">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    className="bg-slate-900 border-slate-600 text-slate-100 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-200">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    className="bg-slate-900 border-slate-600 text-slate-100 pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="bg-slate-900 border-slate-600 text-slate-100 pr-10"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
