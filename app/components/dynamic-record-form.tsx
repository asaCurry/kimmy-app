import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFetcher, useNavigate } from "react-router";
import { PageHeader } from "~/components/ui/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { DynamicField } from "~/components/ui/form-field";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import type { FamilyMember, FormField } from "~/lib/utils";
import type { RecordType as DbRecordType } from "~/db/schema";

// Local interface that extends the database RecordType with parsed fields
interface ParsedRecordType extends Omit<DbRecordType, "fields"> {
  fields: FormField[];
}

// Dynamic schema generation based on record type fields
const createRecordSchema = (fields: FormField[]) => {
  const baseSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().optional(),
    tags: z.string().optional(),
    isPrivate: z.boolean().default(false),
    datetime: z.string().optional(), // ISO string for when the record occurred
  });

  // Add dynamic fields to the schema
  const dynamicFields: Record<string, any> = {};

  fields.forEach(field => {
    let fieldSchema: any;

    switch (field.type) {
      case "text":
      case "textarea":
        fieldSchema = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
        break;
      case "number":
        fieldSchema = field.required
          ? z
              .number()
              .min(field.validation?.min || -Infinity)
              .max(field.validation?.max || Infinity)
          : z.number().optional();
        break;
      case "date":
        fieldSchema = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
        break;
      case "select":
        fieldSchema = field.required
          ? z.string().min(1, `${field.label} is required`)
          : z.string().optional();
        break;
      case "checkbox":
        fieldSchema = z.boolean().default(false);
        break;
      case "file":
        fieldSchema = z.any().optional();
        break;
      default:
        fieldSchema = z.string().optional();
    }

    dynamicFields[`field_${field.id}`] = fieldSchema;
  });

  return baseSchema.extend(dynamicFields);
};

interface DynamicRecordFormProps {
  member: FamilyMember;
  recordType: ParsedRecordType;
  familyId: string;
  onBack: () => void;
}

export const DynamicRecordForm: React.FC<DynamicRecordFormProps> = ({
  member,
  recordType,
  familyId,
  onBack,
}) => {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  // Generate schema based on record type fields
  const schema = createRecordSchema(recordType.fields || []);
  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      isPrivate: false,
      datetime: new Date().toISOString().slice(0, 16), // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      ...Object.fromEntries(
        (recordType.fields || []).map(field => [
          `field_${field.id}`,
          field.type === "checkbox"
            ? false
            : field.type === "number"
              ? undefined
              : "",
        ])
      ),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "fields" as any,
  });

  const watchedIsPrivate = watch("isPrivate");

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    formData.append("_action", "create");
    formData.append("title", data.title);
    formData.append("content", data.content || "");
    formData.append("tags", data.tags || "");
    formData.append("recordTypeId", recordType.id.toString());
    formData.append("familyId", familyId);
    formData.append("isPrivate", data.isPrivate.toString());

    // Handle datetime field - convert to ISO string if provided
    if (data.datetime) {
      // The datetime-local input gives us YYYY-MM-DDTHH:MM format
      // We need to convert this to a full ISO string
      const dateTime = new Date(data.datetime);
      if (!isNaN(dateTime.getTime())) {
        formData.append("datetime", dateTime.toISOString());
      }
    }

    // Add dynamic field values
    (recordType.fields || []).forEach(field => {
      const fieldKey = `field_${field.id}` as keyof FormData;
      const value = data[fieldKey];

      if (value !== undefined && value !== null && value !== "") {
        if (field.type === "checkbox") {
          formData.append(`field_${field.id}`, value ? "true" : "false");
        } else {
          formData.append(`field_${field.id}`, String(value));
        }
      }
    });

    fetcher.submit(formData, {
      method: "post",
    });
  };

  // Handle successful submission
  React.useEffect(() => {
    if (fetcher.data?.success) {
      // Navigate back to the member's category view
      onBack();
    }
  }, [fetcher.data]); // Removed onBack from dependencies

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
          <fetcher.Form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Title <span className="text-red-400">*</span>
              </Label>
              <input
                {...register("title")}
                type="text"
                id="title"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter record title"
              />
              {errors.title && (
                <p className="text-red-400 text-sm">
                  {String(errors.title.message) || "Title is required"}
                </p>
              )}
            </div>

            {/* Datetime Field */}
            <div className="space-y-2">
              <Label
                htmlFor="datetime"
                className="text-sm font-medium leading-none text-slate-200"
              >
                When did this happen?
              </Label>
              <input
                {...register("datetime")}
                type="datetime-local"
                id="datetime"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400">
                Leave empty to use current date and time
              </p>
              {errors.datetime && (
                <p className="text-red-400 text-sm">
                  {String(errors.datetime.message) || "Invalid datetime"}
                </p>
              )}
            </div>

            {/* Content Field */}
            <div className="space-y-2">
              <Label
                htmlFor="content"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Description
              </Label>
              <textarea
                {...register("content")}
                id="content"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter record description"
                rows={4}
              />
              {errors.content && (
                <p className="text-red-400 text-sm">
                  {String(errors.content.message) || "Invalid content"}
                </p>
              )}
            </div>

            {/* Dynamic Fields */}
            {(recordType.fields || []).map(field => (
              <div key={field.id} className="space-y-2">
                <Label
                  htmlFor={`field_${field.id}`}
                  className="text-sm font-medium leading-none text-slate-200"
                >
                  {field.label}
                  {field.required && <span className="text-red-400">*</span>}
                </Label>

                <DynamicField
                  field={{
                    ...field,
                    id: `field_${field.id}`,
                    register: register(`field_${field.id}` as any),
                    error: errors[`field_${field.id}` as keyof typeof errors],
                  }}
                />

                {errors[`field_${field.id}` as keyof typeof errors] && (
                  <p className="text-red-400 text-sm">
                    {String(
                      errors[`field_${field.id}` as keyof typeof errors]
                        ?.message
                    ) || `${field.label} is invalid`}
                  </p>
                )}
              </div>
            ))}

            {/* Tags Field */}
            <div className="space-y-2">
              <Label
                htmlFor="tags"
                className="text-sm font-medium leading-none text-slate-200"
              >
                Tags
              </Label>
              <input
                {...register("tags")}
                type="text"
                id="tags"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas"
              />
              {errors.tags && (
                <p className="text-red-400 text-sm">
                  {String(errors.tags.message) || "Invalid tags"}
                </p>
              )}
            </div>

            {/* Privacy Toggle */}
            {recordType.allowPrivate === 1 && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPrivate"
                  checked={watchedIsPrivate}
                  onCheckedChange={checked => setValue("isPrivate", checked)}
                />
                <Label htmlFor="isPrivate" className="text-sm text-slate-200">
                  Make this record private (only visible to you)
                </Label>
              </div>
            )}

            {/* Error Display */}
            {fetcher.data?.error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
                <p className="text-red-400 text-sm">{fetcher.data.error}</p>
              </div>
            )}

            {/* Success Message */}
            {fetcher.data?.success && (
              <div className="p-3 bg-green-900/20 border border-green-700 rounded-md">
                <p className="text-green-400 text-sm">{fetcher.data.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="border-slate-600 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 w-full sm:w-auto"
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Record"
                )}
              </Button>
            </div>
          </fetcher.Form>
        </CardContent>
      </Card>
    </div>
  );
};
