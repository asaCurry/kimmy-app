import type { Route } from "./+types/logout";
import { redirect } from "react-router";

export async function action({ request, context }: Route.ActionArgs) {
  // Clear the session cookie by setting it to expire immediately
  const response = new Response(null, {
    status: 302,
    headers: {
      'Location': '/welcome',
      'Set-Cookie': 'kimmy_auth_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  });

  return response;
}

export async function loader() {
  // If someone visits /logout directly, redirect them
  throw redirect('/welcome');
}
