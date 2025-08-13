import * as React from "react";
import { useState } from "react";
import { Form } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  FormField,
  FormLabel,
  FormInput,
  FormSelect,
  FormError,
  FormDescription,
} from "~/components/ui/form";
import { UserPlus, Users } from "lucide-react";
import { RELATIONSHIP_TYPES } from "~/lib/types";

interface HouseholdmemberFormProps {
  householdId: string;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    dateOfBirth?: string;
    relationship?: string;
    memberType?: "adult" | "child";
  };
  mode?: "add" | "edit";
}

export const HouseholdmemberForm: React.FC<HouseholdmemberFormProps> = ({
  householdId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  initialData = {},
  mode = "add",
}) => {
  const [memberType, setMemberType] = useState<"adult" | "child">(
    initialData.memberType || "adult"
  );
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    dateOfBirth: initialData.dateOfBirth || "",
    relationship: initialData.relationship || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleMemberTypeChange = (type: "adult" | "child") => {
    setMemberType(type);
    // Reset form when switching types
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      dateOfBirth: "",
      relationship: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (memberType === "adult") {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required for adult members";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (memberType === "child" && !formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is helpful for children";
    }

    if (!formData.relationship) {
      newErrors.relationship = "Please specify the relationship";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRelationshipOptions = () => {
    if (memberType === "child") {
      return [
        { value: RELATIONSHIP_TYPES.CHILD, label: "Child" },
        { value: RELATIONSHIP_TYPES.GRANDCHILD, label: "Grandchild" },
      ];
    } else {
      return [
        { value: RELATIONSHIP_TYPES.SPOUSE, label: "Spouse/Partner" },
        { value: RELATIONSHIP_TYPES.SIBLING, label: "Sibling" },
        { value: RELATIONSHIP_TYPES.PARENT, label: "Parent" },
        { value: RELATIONSHIP_TYPES.GRANDPARENT, label: "Grandparent" },
        { value: RELATIONSHIP_TYPES.OTHER, label: "Other" },
      ];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (!validateForm()) {
      e.preventDefault();
      return;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader className="text-center">
        <div
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            memberType === "adult"
              ? "bg-gradient-to-r from-blue-500 to-purple-600"
              : "bg-gradient-to-r from-purple-500 to-pink-600"
          }`}
        >
          {memberType === "adult" ? (
            <Users className="h-8 w-8 text-white" />
          ) : (
            <UserPlus className="h-8 w-8 text-white" />
          )}
        </div>
        <CardTitle className="text-xl text-slate-100">
          {mode === "edit" 
            ? `Edit ${memberType === "adult" ? "Adult Member" : "Child"}`
            : memberType === "adult" 
              ? "Add Adult Member" 
              : "Add Child"
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" onSubmit={handleSubmit}>
          {/* Hidden fields for form data */}
          <input type="hidden" name="memberType" value={memberType} />
          <input
            type="hidden"
            name="currentHouseholdId"
                            value={householdId || ""}
          />

          {/* Member Type Selection */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={memberType === "adult" ? "default" : "outline"}
                onClick={() => handleMemberTypeChange("adult")}
                className={
                  memberType === "adult"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800"
                }
              >
                <Users className="mr-2 h-4 w-4" />
                Adult Member
              </Button>
              <Button
                type="button"
                variant={memberType === "child" ? "default" : "outline"}
                onClick={() => handleMemberTypeChange("child")}
                className={
                  memberType === "child"
                    ? "bg-gradient-to-r from-purple-500 to-pink-600"
                    : "border-slate-600 text-slate-300 hover:bg-slate-800"
                }
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Child
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField>
              <FormLabel htmlFor="firstName" required>
                First Name
              </FormLabel>
              <FormInput
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={e =>
                  handleInputChange("firstName", e.target.value)
                }
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <FormError>{errors.firstName}</FormError>
              )}
            </FormField>

            <FormField>
              <FormLabel htmlFor="lastName" required>
                Last Name
              </FormLabel>
              <FormInput
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={e =>
                  handleInputChange("lastName", e.target.value)
                }
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <FormError>{errors.lastName}</FormError>
              )}
            </FormField>
          </div>

          {memberType === "adult" && (
            <FormField>
              <FormLabel htmlFor="email" required>
                Email Address
              </FormLabel>
              <FormInput
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
              {errors.email && <FormError>{errors.email}</FormError>}
              <FormDescription>
                Email is required for adult members to access the system
              </FormDescription>
            </FormField>
          )}

          {memberType === "child" && (
            <FormField>
              <FormLabel htmlFor="dateOfBirth">Date of Birth</FormLabel>
              <FormInput
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={e =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
              />
              {errors.dateOfBirth && (
                <FormError>{errors.dateOfBirth}</FormError>
              )}
              <FormDescription>
                Date of birth helps with age-appropriate features and
                records
              </FormDescription>
            </FormField>
          )}

          <FormField>
            <FormLabel htmlFor="relationship" required>
              Relationship
            </FormLabel>
            <FormSelect
              id="relationship"
              name="relationship"
              value={formData.relationship}
              onChange={e =>
                handleInputChange("relationship", e.target.value)
              }
            >
              <option value="">Select relationship</option>
              {getRelationshipOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
            {errors.relationship && (
              <FormError>{errors.relationship}</FormError>
            )}
          </FormField>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isSubmitting
                ? mode === "edit" ? "Updating..." : "Adding Member..."
                : mode === "edit" ? "Update Member" : "Add Member"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};
