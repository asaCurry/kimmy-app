import * as React from "react";
import { Link } from "react-router";
import { Home, User, FolderOpen, FileText } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import type { Householdmember, RecordType } from "~/lib/utils";

interface NavigationProps {
  currentView: "home" | "categories" | "record-types" | "form";
  member?: Householdmember;
  category?: string;
  recordType?: RecordType;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  member,
  category,
  recordType,
}) => {
  const getIcon = (view: string) => {
    switch (view) {
      case "home":
        return <Home className="h-4 w-4" />;
      case "categories":
        return <User className="h-4 w-4" />;
      case "record-types":
        return <FolderOpen className="h-4 w-4" />;
      case "form":
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="mb-4 sm:mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-2">
                {getIcon("home")}
                <span className="hidden sm:inline">Hey, Kimmy</span>
                <span className="sm:hidden">Home</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {member && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {currentView === "categories" ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {getIcon("categories")}
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {member.name}
                    </span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={`/member/${member.id}`}
                      className="flex items-center gap-2"
                    >
                      {getIcon("categories")}
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {member.name}
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )}

          {category && member && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {currentView === "record-types" ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {getIcon("record-types")}
                    <span className="truncate max-w-[100px] sm:max-w-none">
                      {category}
                    </span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      to={`/member/${member.id}/category/${encodeURIComponent(category)}`}
                      className="flex items-center gap-2"
                    >
                      {getIcon("record-types")}
                      <span className="truncate max-w-[100px] sm:max-w-none">
                        {category}
                      </span>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </>
          )}

          {recordType && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-2">
                  {getIcon("form")}
                  <span className="truncate max-w-[100px] sm:max-w-none">
                    {recordType.name}
                  </span>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
