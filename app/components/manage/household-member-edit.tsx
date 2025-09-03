import * as React from "react";
import { useState, useEffect } from "react";
import { Form, useActionData, useNavigation } from "react-router";
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
import { UserPlus, Users, Edit3 } from "lucide-react";
import { RELATIONSHIP_TYPES } from "~/lib/types";

interface HouseholdmemberEditProps {
  householdId: string;
  member: {
    id: number;
    name: string;
    email: string;
    role: string;
    age?: number;
    relationshipToAdmin?: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

export const HouseholdmemberEdit: React.FC<HouseholdmemberEditProps> = ({
  householdId,
  member,
  onCancel,
  onSuccess,
}) => {
  const actionData = useActionData<any>();
  const navigation = useNavigation();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine member type based on age and role
  const memberType: "adult" | "child" = member.age ? "child" : "adult";

  // Parse name into first and last name
  const nameParts = member.name.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const [formData, setFormData] = useState({
    firstName,
    lastName,
    email: member.email,
    dateOfBirth: member.age ? getDateFromAge(member.age) : "",
    relationship: member.relationshipToAdmin || "",
  });

  // Handle action data changes
  useEffect(() => {
    if (actionData?.success) {
      onSuccess();
    } else if (actionData?.error) {
      setErrors({ submit: actionData.error });
    }
  }, [actionData, onSuccess]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: "" }));
    }
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
        <CardTitle className="text-xl text-slate-100 flex items-center justify-center">
          <Edit3 className="h-5 w-5 mr-2" />
          Edit {memberType === "adult" ? "Adult Member" : "Child"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form method="post" onSubmit={handleSubmit}>
          {/* Hidden fields */}
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="memberType" value={memberType} />
          <input type="hidden" name="currentHouseholdId" value={householdId} />

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

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
                onChange={e => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
              />
              {errors.firstName && <FormError>{errors.firstName}</FormError>}
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
                onChange={e => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
              />
              {errors.lastName && <FormError>{errors.lastName}</FormError>}
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
                onChange={e => handleInputChange("dateOfBirth", e.target.value)}
              />
              {errors.dateOfBirth && (
                <FormError>{errors.dateOfBirth}</FormError>
              )}
              <FormDescription>
                Date of birth helps with age-appropriate features and records
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
              onChange={e => handleInputChange("relationship", e.target.value)}
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
              disabled={navigation.state === "submitting"}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
            >
              {navigation.state === "submitting"
                ? "Updating..."
                : "Update Member"}
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

// Helper function to estimate date of birth from age
function getDateFromAge(age: number): string {
  const today = new Date();
  const year = today.getFullYear() - age;
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
