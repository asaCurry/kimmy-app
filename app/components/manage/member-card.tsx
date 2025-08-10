import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Users } from "lucide-react";
import type { FamilyMember } from "~/lib/utils";

interface MemberCardProps {
  title: string;
  members: FamilyMember[];
  iconColor: string;
  badgeColor: string;
  badgeText: string;
  emptyMessage: string;
  showAge?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  title,
  members,
  iconColor,
  badgeColor,
  badgeText,
  emptyMessage,
  showAge = false
}) => {
  const count = members.length;
  const singular = title.toLowerCase().slice(0, -1); // Remove 's' from end
  const plural = title.toLowerCase();

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
          <Users className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
        <CardDescription>
          {count} {count === 1 ? singular : plural}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {count > 0 ? (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="font-medium text-slate-200">{member.name}</p>
                  <p className="text-sm text-slate-400">
                    {member.email}
                    {showAge && member.age && (
                      <span className="ml-2">• Age {member.age}</span>
                    )}
                    {showAge && member.relationshipToAdmin && (
                      <span className="ml-2">• {member.relationshipToAdmin}</span>
                    )}
                  </p>
                </div>
                <span className={`text-xs ${badgeColor} px-2 py-1 rounded`}>
                  {badgeText}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              {emptyMessage}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
