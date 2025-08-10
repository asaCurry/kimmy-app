import type { Route } from "./+types/api.family.$familyId.members";
import { userDb } from "~/lib/db";
import { json } from "react-router";

export async function loader({ params, context }: Route.LoaderArgs) {
  try {
    const env = (context.cloudflare as any)?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    const { familyId } = params;
    
    if (!familyId) {
      throw new Response('Family ID is required', { status: 400 });
    }

    // Fetch family members from the database
    const members = await userDb.findByFamilyId(env, familyId);
    
    return json({ 
      success: true, 
      members,
      familyId 
    });
  } catch (error) {
    console.error('API error fetching family members:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    return json({ 
      success: false, 
      error: 'Failed to fetch family members',
      members: [],
      familyId: params.familyId 
    }, { status: 500 });
  }
}
