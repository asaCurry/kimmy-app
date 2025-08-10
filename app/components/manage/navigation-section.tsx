import * as React from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export const NavigationSection: React.FC = () => {
  return (
    <section className="border-t border-slate-700 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-slate-200">Ready to add records?</h3>
          <p className="text-slate-400">Start managing your family's information</p>
        </div>
        <Link to="/">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            Go to Records
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
