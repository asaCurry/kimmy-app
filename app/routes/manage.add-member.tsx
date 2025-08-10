import type { Route } from "./+types/manage.add-member";
import * as React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useActionData, useNavigation } from "react-router";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormLabel, FormInput, FormSelect, FormError, FormDescription } from "~/components/ui/form";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { RELATIONSHIP_TYPES } from "~/lib/types";
import { RequireAuth, useAuth } from "~/contexts/auth-context";
import { useHousehold } from "~/contexts/household-context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Add Member - Household Management" },
    { name: "description", content: "Add a new member to your household" },
  ];
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    const env = (context.cloudflare as any)?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const memberType = formData.get('memberType') as 'adult' | 'child';
    const relationship = formData.get('relationship') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;

    // Validation
    if (!firstName || !lastName || !relationship) {
      return { error: 'Required fields are missing' };
    }

    if (memberType === 'adult' && !email) {
      return { error: 'Email is required for adult members' };
    }

    // Get the current user's session to get the family ID
    // In a real implementation, you'd verify the session token from cookies
    // For now, we'll use a placeholder approach since the session management
    // is handled client-side in this architecture
    
    // TODO: Implement proper session verification from cookies/headers
    // For now, we'll use a demo family ID to test the functionality
    const currentFamilyId = 'demo-family-001';
    
    // Import the database utilities
    const { userDb } = await import('~/lib/db');
    
    // Create the member data
    const memberData = {
      name: `${firstName} ${lastName}`,
      email: memberType === 'adult' ? email : `child-${Date.now()}@placeholder.com`, // Children need an email for the database schema
      familyId: currentFamilyId,
      role: 'member',
      relationshipToAdmin: relationship,
      age: dateOfBirth ? calculateAge(new Date(dateOfBirth)) : undefined,
    };

    try {
      // Actually save to database
      const newMember = await userDb.create(env, memberData);
      console.log('Successfully created member:', newMember);
      
      return { 
        success: true, 
        member: { firstName, lastName, email, memberType, relationship, dateOfBirth },
        newMemberId: newMember.id
      };
    } catch (dbError) {
      console.error('Database error creating member:', dbError);
      return { error: 'Failed to save member to database' };
    }
  } catch (error) {
    console.error('Add member action error:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    return { 
      error: error instanceof Error ? error.message : 'Failed to add member' 
    };
  }
}

// Helper function to calculate age
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    return age - 1;
  }
  
  return age;
}

const AddMember: React.FC<Route.ComponentProps> = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { addMember } = useHousehold();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [memberType, setMemberType] = useState<'adult' | 'child'>('adult');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    relationship: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle action data changes
  useEffect(() => {
    if (actionData?.success) {
      // Show success message briefly before navigating
      setErrors({});
      setIsSubmitting(false);
      
      // Navigate back to management page on success
      setTimeout(() => {
        navigate("/manage");
      }, 1500);
    } else if (actionData?.error) {
      setErrors({ submit: actionData.error });
      setIsSubmitting(false);
    }
  }, [actionData, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleMemberTypeChange = (type: 'adult' | 'child') => {
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

    if (memberType === 'adult') {
      if (!formData.email.trim()) {
        newErrors.email = "Email is required for adult members";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (memberType === 'child' && !formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is helpful for children";
    }

    if (!formData.relationship) {
      newErrors.relationship = "Please specify the relationship";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // Don't prevent default - let the form submit naturally to the action
    if (!validateForm()) {
      e.preventDefault();
      return;
    }

    // Form will submit naturally to the action
  };

  const getRelationshipOptions = () => {
    if (memberType === 'child') {
      return [
        { value: RELATIONSHIP_TYPES.CHILD, label: 'Child' },
        { value: RELATIONSHIP_TYPES.GRANDCHILD, label: 'Grandchild' },
      ];
    } else {
      return [
        { value: RELATIONSHIP_TYPES.SPOUSE, label: 'Spouse/Partner' },
        { value: RELATIONSHIP_TYPES.SIBLING, label: 'Sibling' },
        { value: RELATIONSHIP_TYPES.PARENT, label: 'Parent' },
        { value: RELATIONSHIP_TYPES.GRANDPARENT, label: 'Grandparent' },
        { value: RELATIONSHIP_TYPES.OTHER, label: 'Other' },
      ];
    }
  };

  return (
    <RequireAuth requireHousehold={true}>
      <PageLayout maxWidth="2xl">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link 
            to="/manage" 
            className="inline-flex items-center text-slate-400 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Management
          </Link>
        </div>

        <PageHeader
          title="Add Household Member"
          subtitle="Add a new family member to your household"
        />

        {/* Member Type Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={memberType === 'adult' ? 'default' : 'outline'}
              onClick={() => handleMemberTypeChange('adult')}
              className={memberType === 'adult' 
                ? "bg-gradient-to-r from-blue-500 to-purple-600" 
                : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }
            >
              <Users className="mr-2 h-4 w-4" />
              Adult Member
            </Button>
            <Button
              type="button"
              variant={memberType === 'child' ? 'default' : 'outline'}
              onClick={() => handleMemberTypeChange('child')}
              className={memberType === 'child' 
                ? "bg-gradient-to-r from-purple-500 to-pink-600" 
                : "border-slate-600 text-slate-300 hover:bg-slate-800"
              }
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Child
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <CardHeader className="text-center">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              memberType === 'adult' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'bg-gradient-to-r from-purple-500 to-pink-600'
            }`}>
              {memberType === 'adult' ? (
                <Users className="h-8 w-8 text-white" />
              ) : (
                <UserPlus className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-xl text-slate-100">
              {memberType === 'adult' ? 'Add Adult Member' : 'Add Child'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form method="post" onSubmit={handleSubmit}>
              {/* Hidden field for memberType */}
              <input type="hidden" name="memberType" value={memberType} />
              
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{errors.submit}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <FormField>
                  <FormLabel htmlFor="firstName" required>First Name</FormLabel>
                  <FormInput
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <FormError>{errors.firstName}</FormError>}
                </FormField>

                <FormField>
                  <FormLabel htmlFor="lastName" required>Last Name</FormLabel>
                  <FormInput
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <FormError>{errors.lastName}</FormError>}
                </FormField>
              </div>

              {memberType === 'adult' && (
                <FormField>
                  <FormLabel htmlFor="email" required>Email Address</FormLabel>
                  <FormInput
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                  {errors.email && <FormError>{errors.email}</FormError>}
                  <FormDescription>
                    Adult members need an email address to receive invitations
                  </FormDescription>
                </FormField>
              )}

              {memberType === 'child' && (
                <FormField>
                  <FormLabel htmlFor="dateOfBirth">Date of Birth</FormLabel>
                  <FormInput
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  />
                  {errors.dateOfBirth && <FormError>{errors.dateOfBirth}</FormError>}
                  <FormDescription>
                    Optional, but helpful for age-related records and reminders
                  </FormDescription>
                </FormField>
              )}

              <FormField>
                <FormLabel htmlFor="relationship" required>Relationship</FormLabel>
                <FormSelect
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={(e) => handleInputChange("relationship", e.target.value)}
                >
                  <option value="">Select relationship</option>
                  {getRelationshipOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
                {errors.relationship && <FormError>{errors.relationship}</FormError>}
                <FormDescription>
                  How is this person related to you (the administrator)?
                </FormDescription>
              </FormField>

              <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                <h4 className="text-sm font-medium text-slate-200 mb-2">
                  {memberType === 'adult' ? 'Adult Member Info:' : 'Child Info:'}
                </h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  {memberType === 'adult' ? (
                    <>
                      <li>• Will receive an invitation email to join</li>
                      <li>• Can create and manage their own records</li>
                      <li>• Can view all household records</li>
                    </>
                  ) : (
                    <>
                      <li>• No account needed - managed by adults</li>
                      <li>• Adults can create records for them</li>
                      <li>• Records visible to all household members</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Success Message */}
              {actionData?.success && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-green-400 font-medium mb-2">
                    ✅ Member Added Successfully!
                  </div>
                  <p className="text-green-300 text-sm">
                    Redirecting to management page...
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errors.submit && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="text-red-400 font-medium mb-2">
                    ❌ Error Adding Member
                  </div>
                  <p className="text-red-300 text-sm">
                    {errors.submit}
                  </p>
                </div>
              )}

              <div className="flex flex-col space-y-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || navigation.state === "submitting" || actionData?.success}
                  className={`w-full ${
                    memberType === 'adult' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                  }`}
                >
                  {navigation.state === "submitting" 
                    ? `Adding ${memberType === 'adult' ? 'Member' : 'Child'}...` 
                    : actionData?.success 
                      ? 'Member Added Successfully!'
                      : `Add ${memberType === 'adult' ? 'Member' : 'Child'}`
                  }
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate("/manage")}
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
    </RequireAuth>
  );
};

export default AddMember;