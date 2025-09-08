import { AutoCompletionService } from "~/lib/auto-completion-service";
import { createAuthenticatedAction } from "~/lib/validation-layer.server";
import { z } from "zod";

const actionSchema = z.object({
  _action: z.enum(["get-field-suggestions", "get-suggestions"]),
  fieldId: z.string().min(1).optional(),
  recordTypeId: z.coerce.number().int().positive(),
  householdId: z.string().uuid(),
  memberId: z.coerce.number().int().positive().optional(),
  currentValue: z.string().optional(),
});

export const action = createAuthenticatedAction(
  actionSchema,
  async (data, { env, db, session }) => {
    const autoCompletionService = new AutoCompletionService(db, {
      ANALYTICS: env.ANALYTICS,
    });

    // Verify user has access to this household
    if (session.currentHouseholdId !== data.householdId) {
      return Response.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    switch (data._action) {
      case "get-field-suggestions": {
        if (!data.fieldId) {
          return Response.json(
            {
              success: false,
              error: "fieldId is required for field suggestions",
            },
            { status: 400 }
          );
        }

        try {
          const fieldSuggestions =
            await autoCompletionService.getFieldSuggestions(
              data.fieldId,
              data.recordTypeId,
              data.householdId,
              data.memberId,
              data.currentValue
            );

          return Response.json({
            success: true,
            fieldSuggestions,
          });
        } catch (error) {
          console.error("Error getting field suggestions:", error);
          return Response.json(
            { success: false, error: "Failed to get field suggestions" },
            { status: 500 }
          );
        }
      }

      case "get-suggestions": {
        try {
          // Get all types of suggestions with caching
          const generalSuggestions =
            await autoCompletionService.getGeneralSuggestions(
              data.recordTypeId,
              data.householdId,
              data.memberId
            );

          return Response.json({
            success: true,
            titleSuggestions: generalSuggestions.titleSuggestions,
            tagSuggestions: generalSuggestions.tagSuggestions,
            smartDefaults: generalSuggestions.smartDefaults,
          });
        } catch (error) {
          console.error("Error getting general suggestions:", error);
          return Response.json(
            { success: false, error: "Failed to get suggestions" },
            { status: 500 }
          );
        }
      }

      default: {
        return Response.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
      }
    }
  }
);
