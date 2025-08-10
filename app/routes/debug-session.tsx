import { useAuth } from "~/contexts/auth-context";
import { PageLayout, PageHeader } from "~/components/ui/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export function meta() {
  return [
    { title: "Debug Session - Kimmy" },
    { name: "description", content: "Debug current session information" },
  ];
}

const DebugSession: React.FC = () => {
  const { session, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <PageLayout>
      <PageHeader
        title="Debug Session"
        subtitle="Current session information"
      />

      <Card>
        <CardHeader>
          <CardTitle>Session Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-800 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(session, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Session Storage Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <strong>Session Storage Key:</strong> kimmy_auth_session
            </div>
            <div>
              <strong>Raw Storage Value:</strong>
              <pre className="bg-slate-800 p-2 rounded mt-2 text-xs overflow-auto">
                {typeof window !== 'undefined' ? window.sessionStorage.getItem('kimmy_auth_session') || 'null' : 'Server side'}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default DebugSession;
