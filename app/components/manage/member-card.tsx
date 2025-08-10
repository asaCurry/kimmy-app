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
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-100 min-w-0">
          <Users className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
          <span className="truncate">{title}</span>
        </CardTitle>
        <CardDescription className="text-slate-400">
          {count} {count === 1 ? singular : plural}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {count > 0 ? (
            members.map((member) => (
              <div key={member.id} className="flex items-start justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-medium text-slate-200 truncate">{member.name}</p>
                  <div className="text-sm text-slate-400 space-y-1 mt-1">
                    {member.email && (
                      <p className="truncate">{member.email}</p>
                    )}
                    {showAge && (member.age || member.relationshipToAdmin) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {member.age && (
                          <span className="inline-flex items-center px-2 py-1 bg-slate-600/50 rounded-full">
                            Age {member.age}
                          </span>
                        )}
                        {member.relationshipToAdmin && (
                          <span className="inline-flex items-center px-2 py-1 bg-slate-600/50 rounded-full">
                            {member.relationshipToAdmin}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium ${badgeColor} px-2.5 py-1 rounded-full flex-shrink-0 shadow-sm`}>
                  {badgeText}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-6 px-4">
              {emptyMessage}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
