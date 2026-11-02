/**
 * Shared input validation schemas for Edge Functions
 * 
 * Uses Zod for runtime type validation to prevent injection
 * and ensure type safety.
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Valid leagues supported by the system
export const VALID_LEAGUES = ["nhl", "nba", "nfl", "mlb"] as const;
export type League = typeof VALID_LEAGUES[number];

// Common validation schemas - defaults ensure non-undefined values
export const LeagueSchema = z.enum(VALID_LEAGUES);

export const PipelineInputSchema = z.object({
  league: LeagueSchema.default("nhl"),
  force: z.boolean().default(false),
}).transform(data => ({
  league: data.league as League,
  force: data.force as boolean,
}));

export const EspnInputSchema = z.object({
  league: LeagueSchema.default("nhl"),
  pipelineRunId: z.string().uuid().optional(),
}).transform(data => ({
  league: data.league as League,
  pipelineRunId: data.pipelineRunId,
}));

export const OddsApiInputSchema = z.object({
  league: LeagueSchema.default("nhl"),
  pipelineRunId: z.string().uuid().optional(),
}).transform(data => ({
  league: data.league as League,
  pipelineRunId: data.pipelineRunId,
}));

export const ExecutionOddsInputSchema = z.object({
  league: LeagueSchema.default("nhl"),
  pipelineRunId: z.string().uuid().optional(),
}).transform(data => ({
  league: data.league as League,
  pipelineRunId: data.pipelineRunId,
}));

export const FairOddsInputSchema = z.object({
  pipelineRunId: z.string().uuid().optional(),
});

export const DecisionEngineInputSchema = z.object({
  min_edge: z.number().min(0).max(100).default(3.5),
  pipelineRunId: z.string().uuid().optional(),
}).transform(data => ({
  min_edge: data.min_edge as number,
  pipelineRunId: data.pipelineRunId,
}));

export const EmailSubscribeInputSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
});

/**
 * Safely parse and validate input from request body
 * Returns validated data or null if validation fails
 */
export async function parseAndValidate<T>(
  req: Request,
  schema: z.ZodType<T>,
  defaults?: Partial<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await req.json().catch(() => ({}));
    const merged = { ...defaults, ...body };
    const result = schema.safeParse(merged);
    
    if (!result.success) {
      const errorMessages = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return { data: null, error: `Validation failed: ${errorMessages}` };
    }
    
    return { data: result.data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : "Unknown validation error" 
    };
  }
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(error: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ success: false, error }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}