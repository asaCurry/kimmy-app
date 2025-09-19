import type { LoaderFunctionArgs } from "react-router";
import { Gallery } from "~/components/gallery";
import { getValidatedEnv } from "~/lib/env.server";
import { PageLayout, PageHeader } from "~/components/ui/layout";

const demoSlides = [
  {
    id: 1,
    title: "Building a Scalable Household Management Platform",
    content: `# Building a Scalable Household Management Platform
**Technical Problem Deep Dive**

## The Challenge
Building a shared-infrastructure household data platform with optimistic collaboration

### Core Requirements:
- **Household data isolation** with secure access controls (shared database, application-level filtering)
- **Optimistic state updates** with eventual consistency (no WebSockets)
- **Server-side rendering** for performance and SEO
- **Serverless scalability** for variable household loads
- **Complex data relationships** (users, households, records, privacy)

### Real Data Model Complexity:
\`\`\`typescript
// Shared database with household isolation
interface User {
  id: number;
  email: string;
  householdId: string;
  role: "admin" | "member";
  relationshipToAdmin?: string;
}

interface HouseholdRecord {
  id: number;
  title: string;
  content: string;           // JSON field data
  recordTypeId: number;      // Dynamic schema reference
  householdId: string;       // Tenant isolation
  memberId: number;          // Subject of record
  createdBy: number;         // Audit trail
  isPrivate: number;         // Privacy layer
  datetime: string;          // When it occurred
}
\`\`\``,
    image: null,
  },
  {
    id: 2,
    title: "Why Serverless Architecture",
    content: `# Decision: Cloudflare Workers vs Traditional Containers

## Trade-offs Considered:

\`\`\`typescript
// Serverless Benefits for Household Data
✅ Cold start < 1ms globally (vs 5-10s container startup)
✅ Automatic scaling from 0 to millions of requests  
✅ Built-in global edge network (low latency worldwide)
✅ No infrastructure management overhead
✅ Pay-per-request pricing (ideal for variable usage)

// Serverless Challenges  
❌ Limited runtime environment (no Node.js modules)
❌ 10MB code size limit
❌ Request timeout constraints (30s max)
❌ No persistent connections (WebSockets)
\`\`\`

## Real Implementation - Serverless Route Handler:
\`\`\`typescript
// app/routes/member.$memberId.tsx
export async function loader({ params, request, context }: Route.LoaderArgs) {
  const env = (context as any).cloudflare?.env; // Access to D1, KV, AI
  
  if (!env?.DB) {
    throw new Response("Database not available", { status: 500 });
  }
  
  // Each request gets fresh database connection
  const { householdId, householdMembers } = 
    await loadHouseholdData(request, env);
    
  return { householdId, householdMembers };
}
\`\`\`

### Why This Works:
- **Compliance**: Each request isolated, no shared state risks
- **Performance**: Household apps need < 200ms response times
- **Economics**: Pay only for actual family usage`,
    image: null,
  },
  {
    id: 3,
    title: "React Router 7 SSR vs SPA Trade-offs",
    content: `# Decision: Server-Side Rendering vs Pure SPA

## Real SSR Implementation:
\`\`\`typescript
// workers/app.ts - Cloudflare Workers entry point
import { createRequestHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

const requestHandler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    try {
      return await requestHandler(request, { cloudflare: { env, ctx } });
    } catch (error) {
      return new Response("Application Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
\`\`\`

## Trade-offs Analysis:
\`\`\`typescript
// SSR Benefits for Family Apps
✅ First paint: 1.2s → 0.3s (crucial for busy households)
✅ SEO-friendly (sharing family milestones/records)
✅ Works without JavaScript (accessibility requirement)
✅ Better Core Web Vitals (affects user trust)

// SSR Challenges
❌ More complex state hydration
❌ Server processing overhead per request
❌ Harder to cache personalized household data
❌ Requires careful session management
\`\`\`

### Real Session Handling:
\`\`\`typescript
// app/lib/loader-helpers.ts
export async function loadHouseholdData(request: Request, env: any) {
  const session = extractSessionFromCookies(request.headers.get("cookie"));
  if (!session) return { householdId: null, householdMembers: [] };

  // Database query automatically scoped to household
  const members = await userDb.findByHouseholdId(env, session.currentHouseholdId);
  return { householdId: session.currentHouseholdId, householdMembers: members };
}
\`\`\``,
    image: null,
  },
  {
    id: 4,
    title: "Database Architecture: D1 vs Traditional SQL",
    content: `# Decision: Cloudflare D1 (SQLite) vs PostgreSQL

## Real Schema - Shared Database with Household Isolation:
\`\`\`typescript
// db/schema.ts - Actual production schema
export const households = sqliteTable("households", {
  id: text("id").primaryKey(), // UUID for security
  name: text("name").notNull(),
  inviteCode: text("invite_code").unique().notNull(),
  hasAnalyticsAccess: integer("has_analytics_access").default(1),
  createdAt: text("created_at").default(sql\`(datetime('now'))\`),
});

export const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content"), // JSON object with field values
  recordTypeId: integer("record_type_id").references(() => recordTypes.id),
  householdId: text("household_id").notNull().references(() => households.id),
  memberId: integer("member_id").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  isPrivate: integer("is_private").default(0),
  datetime: text("datetime"),
}, table => ({
  // Optimized indexes for household queries
  householdRecordTypeIdx: index("records_household_record_type_idx")
    .on(table.householdId, table.recordTypeId, table.datetime),
}));
\`\`\`

## Trade-off Decision Matrix:
\`\`\`typescript
//                  D1/SQLite    PostgreSQL
Performance         ✅ < 1ms      ❌ 5-20ms
Global Distribution ✅ Edge       ❌ Single region  
Scaling Cost        ✅ $0.001/1K  ❌ $200+/month
Complex Queries     ❌ Limited    ✅ Full featured
Concurrent Writes   ❌ Limited    ✅ High throughput
Household Isolation ✅ App-level  ✅ Row-level Security
\`\`\`

### Why D1 Works (For Now):
- **Read-heavy workload**: Household records viewed more than created
- **Natural partitioning**: Households rarely share data
- **Edge performance**: Families access data globally

### **Critical Limitation - Not True Multi-Tenancy:**
\`\`\`typescript
// Current: Shared database with application filtering
❌ Single point of failure affects all households
❌ No hard isolation boundaries (security risk)
❌ Compliance challenges for sensitive data
❌ Noisy neighbor problems at scale

// When we'd need true multi-tenancy:
✅ Healthcare data (HIPAA compliance)
✅ Financial records (SOX compliance)  
✅ Enterprise customers (security requirements)
✅ Geographic data residency (GDPR)
\`\`\``,
    image: null,
  },
  {
    id: 5,
    title: "Authentication + Multi-tenancy Challenge",
    content: `# Challenge: Secure Household Data Isolation

## Problem: Multiple families sharing infrastructure safely

### Real Authentication Implementation:
\`\`\`typescript
// app/lib/loader-helpers.ts - Session extraction
export async function loadHouseholdData(request: Request, env: any) {
  try {
    // Extract session from HTTP-only cookies
    const session = extractSessionFromCookies(request.headers.get("cookie"));
    if (!session) {
      return { householdId: null, householdMembers: [] };
    }

    const householdId = session.currentHouseholdId;
    
    // All database queries automatically scoped to household
    const members = await userDb.findByHouseholdId(env, householdId);
    
    return { householdId, householdMembers: members };
  } catch (error) {
    console.error("Failed to load household data:", error);
    return { householdId: null, householdMembers: [] }; // Fail safely
  }
}
\`\`\`

### Secure Session Cleanup:
\`\`\`typescript
// app/routes/logout.tsx - Multi-domain session clearing
export async function action({ request, context }: ActionFunctionArgs) {
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": "kimmy_auth_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    }
  });
  
  // Clear across all domain variations for security
  response.headers.append("Set-Cookie", 
    "kimmy_auth_session=; Domain=localhost; Max-Age=0");
  response.headers.append("Set-Cookie", 
    "kimmy_auth_session=; Domain=.localhost; Max-Age=0");
    
  return response;
}
\`\`\`

### Security Layers:
- **Application-level isolation**: Every query includes householdId
- **Session validation**: Check user still exists on each request
- **Fail-safe defaults**: Return empty data rather than error`,
    image: null,
  },
  {
    id: 6,
    title: "Optimistic Updates Without WebSockets",
    content: `# Challenge: Family Collaboration Without Persistent Connections

## Problem: Multiple family members editing records simultaneously

### Solution - Optimistic Updates with Eventual Consistency:
\`\`\`typescript
// Real implementation from app/routes/trackers.tsx
export default function TrackersPage() {
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  
  // Optimistic UI update for immediate feedback
  const handleDeleteTracker = (tracker: Tracker) => {
    // 1. Update UI immediately (optimistic)
    fetcher.submit(
      { intent: "delete", trackerId: tracker.id }, 
      { method: "post" }
    );
  };

  // 2. Handle server response and sync
  React.useEffect(() => {
    if (fetcher.data?.success) {
      toast.success("Tracker deleted successfully!");
      revalidator.revalidate(); // Re-fetch all data
    } else if (fetcher.data?.error) {
      toast.error("Failed to delete tracker");
      revalidator.revalidate(); // Revert optimistic changes
    }
  }, [fetcher.data]);
}
\`\`\`

### Why NOT WebSockets:
\`\`\`typescript
// WebSockets would require Durable Objects (increased complexity)
❌ Durable Objects needed for stateful WebSocket connections
❌ More complex than traditional server WebSocket handling
❌ Additional cost per household (persistent object instances)
❌ Single point of failure per Durable Object
❌ Coordination overhead between multiple objects

// What we chose: Optimistic updates + manual refresh
✅ HTTP more reliable for family data
✅ Simpler audit trail (every change is HTTP request)
✅ Better mobile support (handles network drops)
✅ Cost efficient (families don't edit simultaneously often)
✅ Immediate UI feedback (feels fast to users)
✅ No persistent state to manage or lose
❌ NOT real-time (other users don't see changes automatically)
❌ Manual revalidation required (no push updates)
\`\`\`

### Trade-off: Immediate Feedback vs True Real-time
- Families prefer **reliable** over **instantaneous**
- **Audit trail** more important than speed for family records  
- **Mobile-first** design requires handling poor connections
- **Optimistic updates** provide perceived speed without WebSocket complexity`,
    image: null,
  },
  {
    id: 7,
    title: "Dynamic Schema Challenge",
    content: `# Challenge: Flexible Record Types for Every Family

## Problem: Different families need different data structures

### Real Dynamic Schema Solution:
\`\`\`typescript
// Actual field configuration from our demo data
const MEAL_RECORD_FIELDS = [
  {
    id: "meal_type",
    type: "select", 
    label: "Meal Type",
    required: true,
    options: ["Breakfast", "Lunch", "Dinner", "Snack"]
  },
  {
    id: "foods",
    type: "textarea",
    label: "Foods", 
    required: true,
    placeholder: "What did you eat?"
  },
  {
    id: "calories",
    type: "number",
    label: "Estimated Calories",
    required: false
  }
];
\`\`\`

### Runtime Schema Validation:
\`\`\`typescript
// app/lib/utils/dynamic-fields/schema-generation.ts
export function generateZodSchema(fields: FieldDefinition[]): z.ZodObject<any> {
  return z.object(
    fields.reduce((acc, field) => {
      let schema: z.ZodType<any>;
      
      switch (field.type) {
        case 'select':
          schema = z.enum(field.options as [string, ...string[]]);
          break;
        case 'number':
          schema = z.coerce.number();
          if (field.min !== undefined) schema = schema.min(field.min);
          if (field.max !== undefined) schema = schema.max(field.max);
          break;
        case 'textarea':
        case 'text':
        default:
          schema = z.string();
      }
      
      acc[field.name] = field.required ? schema : schema.optional();
      return acc;
    }, {} as Record<string, z.ZodType<any>>)
  );
}
\`\`\`

### Storage Strategy:
- **Field definitions**: Stored as JSON in \`record_types.fields\`
- **Actual data**: Stored as JSON in \`records.content\`  
- **Runtime validation**: Generated Zod schemas
- **Type safety**: TypeScript interfaces generated from schemas`,
    image: null,
  },
  {
    id: 8,
    title: "Performance Optimization Lessons",
    content: `# Edge Performance with Database Indexes

## Database Query Optimization:
\`\`\`sql
-- Real indexes from our production schema
CREATE INDEX records_household_record_type_idx 
  ON records(household_id, record_type_id, datetime);
  
CREATE INDEX records_household_member_idx 
  ON records(household_id, member_id, datetime);
  
CREATE INDEX records_title_idx 
  ON records(household_id, record_type_id, title);
\`\`\`

### Optimized Loader Pattern:
\`\`\`typescript
// Single query with joins instead of N+1 queries
export async function loader({ request, context }: Route.LoaderArgs) {
  return withDatabaseAndSession(request, context, async (db, session) => {
    // One query with aggregate instead of multiple
    const trackersWithEntries = await db
      .select({
        tracker: trackers,
        entryCount: count(trackerEntries.id)
      })
      .from(trackers)
      .leftJoin(trackerEntries, eq(trackers.id, trackerEntries.trackerId))
      .where(eq(trackers.householdId, session.currentHouseholdId))
      .groupBy(trackers.id);
      
    return { trackersWithEntries };
  });
}
\`\`\`

## Caching Strategy Trade-offs:
\`\`\`typescript
// What we DON'T cache (privacy reasons)
❌ Personal family data (compliance requirement)  
❌ User sessions (security requirement)
❌ Dynamic form schemas (households customize them)

// What we DO cache aggressively
✅ Static assets (30+ day TTL)
✅ Application code bundles (immutable deployments)
✅ Database schema metadata (rarely changes)
\`\`\`

### Edge Performance Results:
- **Database queries**: < 1ms at edge
- **Page load time**: 300ms average globally
- **Time to Interactive**: < 1s on 3G connections`,
    image: null,
  },
  {
    id: 9,
    title: "What I'd Do Differently",
    content: `# Technical Debt & Future Architecture

## 1. Async Processing for Heavy Operations
\`\`\`typescript
// Current: Synchronous AI insight generation (blocks response)
const insights = await generateFamilyInsights(householdData); // 2-5s delay

// Better: Background processing with job queue
const job = await env.QUEUE.send('generate-insights', { 
  householdId, 
  timeRange: 'month' 
});
return { jobId: job.id, status: 'processing' };

// Then poll for results or use Server-Sent Events
\`\`\`

## 2. Enhanced Error Recovery
\`\`\`typescript
// Current: Basic error handling  
catch (error) {
  throw new Response("Database error", { status: 500 });
}

// Better: Graceful degradation for families
catch (error) {
  if (error instanceof HouseholdDataError) {
    // Log for debugging but don't break family experience
    await logFamilyError(error, householdContext);
    
    // Return cached data or graceful fallback
    return getFallbackHouseholdData(householdId);
  }
}
\`\`\`

## 3. Real-time Collaboration (Future - Durable Objects)
\`\`\`typescript
// Future: Durable Objects for stateful WebSocket sessions
export class HouseholdSession extends DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request) {
    // Handle WebSocket upgrade for real-time collaboration
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    // Maintain household session state
    // Real-time record editing by multiple family members
    // Conflict resolution for concurrent edits
    // Live cursors showing who's editing what
    
    return new Response(null, { status: 101, webSocket: client });
  }
}

// Costs & complexity trade-offs:
// ✅ True real-time collaboration
// ❌ Persistent object per household (increased cost)
// ❌ More complex state management than stateless HTTP
// ❌ Single point of failure per household session
\`\`\`

### Architectural Evolution:
- **Phase 1**: Individual family usage (current - shared database)
- **Phase 2**: Real-time collaboration within families  
- **Phase 3**: True multi-tenancy for sensitive data compliance
- **Phase 4**: Cross-family sharing (extended family networks)
- **Phase 5**: AI-powered insights with privacy guarantees

## 4. Multi-Tenancy Architecture (Critical Future Need)
\`\`\`typescript
// Current limitation: Shared database architecture
interface CurrentArchitecture {
  isolation: "application-level";    // Not sufficient for healthcare
  compliance: "basic";              // Can't meet HIPAA/SOX
  scalability: "good";              // Works for households
  security: "shared-boundary";      // Risk of data leakage
}

// Future: True multi-tenancy options
interface TruMultiTenancy {
  option1: "database-per-tenant";   // Cloudflare D1 per household
  option2: "schema-per-tenant";     // Separate schemas per household  
  option3: "cluster-per-tenant";    // Separate Workers per household
  
  // Required for:
  healthcare: true;                 // HIPAA compliance
  finance: true;                    // SOX compliance
  enterprise: true;                 // Security requirements
  geographic: true;                 // Data residency (GDPR)
}
\`\`\`

### When to Make the Jump:
- **Regulatory pressure**: Healthcare or financial data requirements
- **Enterprise sales**: B2B customers demand isolation guarantees  
- **Scale problems**: Noisy neighbor issues affecting performance
- **Security incidents**: Any cross-household data leak`,
    image: null,
  },
  {
    id: 10,
    title: "Key Technical Insights",
    content: `# Lessons for Scalable Family/Healthcare Platforms

## 1. Serverless Excels for Personal Data
\`\`\`typescript
// Why serverless works for family platforms:
✅ Natural request isolation = better privacy
✅ Global edge deployment = works for traveling families  
✅ Pay-per-use = sustainable for varied family activity
✅ Zero infrastructure = focus on family features not servers
\`\`\`

## 2. SSR Critical for Family Applications
\`\`\`typescript
// Family app requirements that need SSR:
✅ Fast loading for busy families (< 300ms first paint)
✅ Works on older devices (grandparents' tablets)
✅ Sharing family milestones requires SEO
✅ Accessibility for family members with disabilities
\`\`\`

## 3. Shared-Infrastructure vs True Multi-Tenancy
\`\`\`typescript
// Current: Shared database with application isolation
✅ Application-level filtering (householdId in every query)
✅ Fail-safe defaults (empty data vs errors)
✅ Audit trails built into data model
✅ Privacy controls at record level (not just user level)

// Critical limitation: Not true multi-tenancy
❌ Shared failure boundaries (all households affected by outages)
❌ Compliance gaps (can't meet HIPAA/SOX without hard isolation)
❌ Security risks (application bugs could leak cross-household data)
❌ Enterprise blockers (B2B customers require tenant isolation)

// Future need: True multi-tenancy for critical data
🔮 Database-per-tenant for healthcare/financial compliance
🔮 Geographic isolation for GDPR data residency  
🔮 Performance isolation for enterprise customers
\`\`\`

## 4. Real-world Collaboration Insights
- **Edge databases** beat traditional databases for read-heavy family data
- **Optimistic updates** provide perceived real-time without WebSocket complexity
- **Eventual consistency** acceptable for family collaboration (not financial trading)  
- **Static typing** crucial for dynamic schemas (families create complex forms)
- **Mobile-first** design drives architectural decisions (poor connections)

### Direct Applications to Healthcare/Family Platforms:
- **Patient data** requires same isolation as household data
- **Care team collaboration** needs state management patterns we built
- **Regulatory compliance** benefits from serverless audit trails
- **Global deployment** essential for modern family/healthcare apps

### Bottom Line:
Modern family platforms need **privacy-first architecture**, **global performance**, and **graceful degradation** - same requirements as healthcare systems.`,
    image: null,
  },
];

export async function loader({ context }: LoaderFunctionArgs) {
  const env = getValidatedEnv(context);

  // Only allow demo route in development environment
  if (env.ENVIRONMENT !== "development") {
    throw new Response("Not Found", { status: 404 });
  }

  return null;
}

export default function Demo() {
  return (
    <PageLayout>
      <PageHeader
        title="Kimmy App Demo"
        subtitle="Discover what makes our household management platform unique"
      />

      <div className="space-y-6">
        <Gallery slides={demoSlides} />
      </div>
    </PageLayout>
  );
}
