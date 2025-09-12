

import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client.js";
import { generateIndustryInsights } from "@/lib/inngest/function";
export const { GET, PUT, POST } = serve({
  client: inngest,
  functions: [ generateIndustryInsights ],
});