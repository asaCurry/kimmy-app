import type { Route } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { userDb } from '~/lib/db';

export async function loader({ request, context }: Route.LoaderArgs) {
  try {
    const env = (context.cloudflare as any)?.env;
    
    if (!env?.DB) {
      throw new Response('Database not available', { status: 500 });
    }

    const url = new URL(request.url);
    const familyId = url.searchParams.get('familyId');

    if (!familyId) {
      return json({ error: 'Family ID is required' }, { status: 400 });
    }

    // Fetch all family members from the database
    const members = await userDb.findByFamilyId(env, familyId);
    
    console.log(`Found ${members.length} members for family ${familyId}:`, members);

    return json({ 
      success: true,
      members: members.map(member => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        age: member.age,
        relationshipToAdmin: member.relationshipToAdmin,
        createdAt: member.createdAt
      }))
    });

  } catch (error) {
    console.error('Error fetching family members:', error);
    
    if (error instanceof Response) {
      throw error;
    }
    
    return json({ error: 'Failed to fetch family members' }, { status: 500 });
  }
}
