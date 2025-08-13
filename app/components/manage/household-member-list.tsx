import * as React from "react";
import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Crown, 
  User, 
  Baby,
  Mail,
  Calendar
} from "lucide-react";

interface Householdmember {
  id: number;
  name: string;
  email: string;
  role: string;
  age?: number;
  relationshipToAdmin?: string;
}

interface HouseholdmemberListProps {
  householdMembers: Householdmember[];
  householdId: string;
  onMemberUpdated: () => void;
  onMemberRemoved: () => void;
}

export const HouseholdmemberList: React.FC<HouseholdmemberListProps> = ({
  householdMembers,
  householdId,
  onMemberUpdated,
  onMemberRemoved,
}) => {
  const [removingMember, setRemovingMember] = useState<Householdmember | null>(null);
  const fetcher = useFetcher();

  const handleRemove = (member: Householdmember) => {
    setRemovingMember(member);
  };

  const handleRemoveConfirm = async (member: Householdmember) => {
    try {
      const formData = new FormData();
      formData.append("memberId", member.id.toString());

      fetcher.submit(formData, {
        method: "post",
        action: "/api/household-members/remove",
      });

      setRemovingMember(null);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  // Handle fetcher data changes
  React.useEffect(() => {
    if (fetcher.data?.success) {
      onMemberRemoved();
    }
  }, [fetcher.data, onMemberRemoved]);

  const getRoleIcon = (role: string, age?: number) => {
    if (role === "admin") return <Crown className="h-4 w-4 text-yellow-500" />;
    if (age) return <Baby className="h-4 w-4 text-pink-500" />;
    return <User className="h-4 w-4 text-blue-500" />;
  };

  const getRoleBadge = (role: string, age?: number) => {
    if (role === "admin") {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Admin</Badge>;
    }
    if (age) {
      return <Badge variant="secondary" className="bg-pink-500/20 text-pink-400 border-pink-500/30">Child</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Member</Badge>;
  };

  if (householdMembers.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">
            No Household members Yet
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Get started by adding your first household member to begin managing your household.
          </p>
          <Link to="/manage/add-member">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Household member
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">
          Household members ({householdMembers.length})
        </h2>
        <Link to="/manage/add-member">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </Link>
      </div>

      {/* Member Cards */}
      <div className="grid gap-4">
        {householdMembers.map((member) => (
          <Card key={member.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {getRoleIcon(member.role, member.age)}
                    <h3 className="text-lg font-semibold text-slate-100">
                      {member.name}
                    </h3>
                    {getRoleBadge(member.role, member.age)}
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-300">
                    {member.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{member.email}</span>
                      </div>
                    )}
                    
                    {member.age && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{member.age} years old</span>
                      </div>
                    )}
                    
                    {member.relationshipToAdmin && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span className="capitalize">{member.relationshipToAdmin}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Link to={`/manage/edit-member?memberId=${member.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  {member.role !== "admin" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(member)}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Remove Confirmation Modal */}
      {removingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-red-400">Remove Household member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                Are you sure you want to remove <strong>{removingMember.name}</strong> from your household?
              </p>
              <p className="text-sm text-slate-400">
                This action cannot be undone. All records associated with this member will be preserved.
              </p>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleRemoveConfirm(removingMember)}
                  disabled={fetcher.state === "submitting"}
                  className="flex-1"
                >
                  {fetcher.state === "submitting" ? "Removing..." : "Remove Member"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRemovingMember(null)}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
