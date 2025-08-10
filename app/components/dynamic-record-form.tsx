import * as React from "react";
import { PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DynamicField } from "~/components/ui/form-field";
import type { FamilyMember, RecordType } from "~/lib/utils";

interface DynamicRecordFormProps {
  member: FamilyMember;
  recordType: RecordType;
  onBack: () => void;
}

export const DynamicRecordForm: React.FC<DynamicRecordFormProps> = ({ 
  member, 
  recordType, 
  onBack 
}) => {
  return (
    <div>
      <PageHeader
        title={`New ${recordType.name}`}
        subtitle={`for ${member.name}`}
      />

      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center space-x-2 sm:space-x-3 text-slate-100">
            <span className="text-xl sm:text-2xl bg-slate-700/50 p-1.5 sm:p-2 rounded-lg">
              {recordType.icon || "📝"}
            </span>
            <span className="text-lg sm:text-xl">{recordType.name}</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            {recordType.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {/* TODO: Implement dynamic fields based on recordType.fields JSON */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-200">
                Title <span className="text-red-400">*</span>
              </label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter record title"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-200">
                Content
              </label>
              <textarea 
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter record content"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-200">
                Tags
              </label>
              <input 
                type="text"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas"
              />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={onBack} 
                className="border-slate-600 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto">
                Save Record
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};