import { UserCircle } from "lucide-react";
import { IconCard } from "~/components/ui/interactive-card";
import type { Householdmember } from "~/lib/utils";

interface MemberCardProps {
  member: Householdmember;
  onSelect?: () => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, onSelect }) => {
  const icon = (
    <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-2 sm:p-3 shadow-lg">
      <UserCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
    </div>
  );

  return (
    <IconCard
      icon={icon}
      title={member.name}
      description={member.role}
      onClick={onSelect}
    />
  );
};
