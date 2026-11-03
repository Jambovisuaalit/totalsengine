// Temporary preview-only diagnostic. Must not be enabled in production.
import { probe } from "../../scripts/check-bdl-six-games.mjs";

const headers = {"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"};
export async function GET() {
  // Strictly limit to the intended QA branch; no query, no user-provided URL.
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.VERCEL_GIT_COMMIT_REF !== "audit/two-deliverables-2026-11-03") {
    return Response.json({error:"NOT_AVAILABLE"}, {status:404,headers});
  }
  if (!process.env.BALLDONTLIE_API_KEY) {
    return Response.json({error:"BDL_KEY_UNAVAILABLE"}, {status:503,headers});
  }
  try {
    const receipt=await probe({apiKey:process.env.BALLDONTLIE_API_KEY});
    return Response.json(receipt, {status:200,headers});
  } catch (err) {
    const m=String(err?.message||"");
    const error=/^BALLDONTLIE HTTP status \d{3}$/.test(m) ? m :
      /paginated/.test(m) ? "INCOMPLETE_DAY" :
      "UPSTREAM_PROBE_FAILED";
    return Response.json({error,gate_status:"NO_GO"}, {status:502,headers});
  }
}
