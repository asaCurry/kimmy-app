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
- **Household-first data structure** with user and non-user members
- **Optimistic state updates** with eventual consistency
- **Server-side rendering** for performance and SEO
- **Serverless scalability** for variable household loads
- **Modestly complex data relationships** (users, households, records, record types, and privacy)

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
✅ Native Cloudflare edge network (low latency worldwide)
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
- **Performance**: Smooth and responsive UI < 200ms response times
- **Economics**: Pay only for actual family usage`,
    image: null,
  },
  {
    id: 3,
    title: "React Router 7 SSR vs SPA Trade-offs",
    content: `# Decision: Server-Side Rendering vs Pure SPA

## Real SSR Data Loading Implementation:
\`\`\`typescript
// app/routes/member.$memberId.tsx - Server-side data loading
export async function loader({ params, request, context }: Route.LoaderArgs) {
  const env = (context as any).cloudflare?.env;
  
  // 1. Extract session from cookies (SSR authentication)
  const session = extractSessionFromCookies(request.headers.get("cookie"));
  if (!session?.currentHouseholdId) {
    throw redirect("/welcome");
  }

  // 2. Server-side database queries before page render
  const db = getDatabase(env);
  const [householdMembers, recordTypes, records] = await Promise.all([
    db.select().from(users).where(eq(users.householdId, session.currentHouseholdId)),
    db.select().from(recordTypes).where(eq(recordTypes.householdId, session.currentHouseholdId)),
    db.select().from(records).where(
      and(
        eq(records.householdId, session.currentHouseholdId),
        eq(records.memberId, parseInt(params.memberId))
      )
    )
  ]);

  // 3. Process data on server, send pre-rendered HTML
  const categories = Array.from(new Set(recordTypes.map(rt => rt.category))).sort();
  const recordTypesByCategory = categorizeRecords(recordTypes, records);

  // 4. HTML is generated server-side with all data populated
  return {
    member: householdMembers.find(m => m.id === parseInt(params.memberId)),
    recordTypesByCategory,
    categories
  };
}
\`\`\`

## Trade-offs Analysis:
\`\`\`typescript
// SSR Benefits for Modern Applications
✅ First paint: 1.2s → 0.3s (user have a high expectation of speed and performance)
✅ SEO-friendly for marketing and organic discovery of the application
✅ Retains functionality and UX without client-side JavaScript
✅ Better Core Web Vitals (affects user trust)

// SSR Challenges
❌ More complex state hydration
❌ Server processing overhead per request
❌ Harder to cache personalized household data
❌ Requires careful session management
\`\`\`

### Session Handling:
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

## Household based Schema:
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
    content: `# Challenge: Authentication and Session Management

## Problem: Multiple families sharing infrastructure safely

### Authentication Implementation:
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
// Implementation from app/routes/trackers.tsx
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

### Dynamic Schema Solution:
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
    title: "AI Integration & Insight Generation",
    content: `# Intelligent Analytics with Cloudflare AI

## Challenge: 
Transform raw household data into actionable insights that help families make better decisions

## Solution Architecture:
- **Multi-Model Flexibility**: Cloudflare AI allows seamless switching between models (Claude, GPT, Llama)
- **Smart Prompt Engineering**: Adaptive prompts based on data maturity and user context
- **Edge Processing**: AI inference runs globally at 300+ locations

## Code Example - Intelligent Prompt Routing:
\`\`\`typescript
// Auto-select prompt style based on data characteristics
selectBestStyle(dataCompilation: DataCompilation): PromptStyleId {
  const totalRecords = dataCompilation.totalRecords;
  const categoriesCount = Object.keys(dataCompilation.patterns).length;
  
  if (totalRecords < 10) {
    return "conversational"; // Encouraging for new users
  } else if (totalRecords < 50 || categoriesCount <= 2) {
    return "focused"; // Highlight key areas
  } else {
    return "comprehensive"; // Deep analysis for rich data
  }
}

// Generate contextual prompts
const generator = promptRouter.getPromptGenerator(styleId);
const prompt = generator.generatePrompt(dataCompilation);

// Execute AI analysis
const insights = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
  prompt: prompt,
  max_tokens: 2048
});
\`\`\`

## Business Impact:
- **Personalized**: Insights adapt to each family's data maturity
- **Actionable**: Focus on patterns that matter most to users  
- **Scalable**: No infrastructure management, global edge performance
- **Cost Efficient**: Pay per inference, not per server

### Example Output:
"Emma's sleep improved when outdoor activities increased by 30% - consider more morning playground time"`,
    image: null,
  },
  {
    id: 9,
    title: "Challenge: AI Insight Caching & Regeneration",
    content: `# Smart Caching for AI-Powered Analytics

## The Challenge:
- AI inference is expensive and slow for real-time requests (2-5 seconds)
- Insights become stale as new data is added daily
- Users expect fresh insights without waiting for processing
- Data (hopefully!) accessed globally, need edge performance for low latency

## Our Solution - Hybrid Processing:

### 1. Scheduled Background Processing
\`\`\`typescript
// Cloudflare Scheduled Events (Cron Jobs)
export const scheduled = async (event, env, ctx) => {
  console.log("⏰ Processing insights for all households");
  await processInsightsRequests(env, false); // Background refresh
};

// Intelligent cache invalidation  
if (newRecordsAdded > threshold || daysSinceLastUpdate > 7) {
  await requestInsightRegeneration(householdId);
}
\`\`\`

### 2. Progressive Cache Strategy
\`\`\`typescript
// Fresh Data: Generate insights for new households immediately
if (isNewHousehold) {
  const insights = await generateFreshInsights(householdId);
  await cacheInsights(householdId, insights, ttl: '24h');
}

// Existing Data: Background regeneration 
const cachedInsights = await getCachedInsights(householdId);
if (cachedInsights) {
  return cachedInsights; // < 50ms response
}

// Fallback: Generate on-demand with user feedback
return {
  insights: await generateInsightsWithProgress(householdId),
  cached: false,
  generatedAt: new Date()
};
\`\`\`

## Performance Results:
- **Initial Load**: <100ms (cached insights from edge)
- **Background Generation**: 2-3 seconds per household  
- **Cache Hit Rate**: >95% for active households
- **Global Availability**: Insights available at 300+ edge locations

## Trade-offs:
- ✅ **Fast user experience** with cached results
- ✅ **Cost efficient** with background processing
- ✅ **Global performance** with edge caching
- ⚠️ **Eventual consistency** - insights may be 24-48 hours behind latest data
- ⚠️ **Storage overhead** for caching strategy
- ⚠️ **Complex invalidation** logic for data freshness

### Why This Architecture Works:
Families prefer **reliable fast insights** over **real-time slow generation**. The cache-first approach provides instant access while background processing ensures freshness.`,
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
      <PageHeader title="Kimmy App Demo" />

      <div className="space-y-6">
        <Gallery slides={demoSlides} />
      </div>
    </PageLayout>
  );
}
