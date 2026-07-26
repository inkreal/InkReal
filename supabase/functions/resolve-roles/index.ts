import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RoleResponse {
  role: "reader" | "writer" | "founder";
  is_founder: boolean;
  is_writer: boolean;
  display_name: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const founderEmail = (Deno.env.get("FOUNDER_EMAIL") ?? "").trim().toLowerCase();

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Admin client: service-role key bypasses RLS. Used ONLY server-side here.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify the caller's JWT and resolve the user. This is the authenticated
    // identity — roles are decided from this, never from request body or params.
    const {
      data: { user },
      error: userErr,
    } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userEmail = (user.email ?? "").trim().toLowerCase();

    // ---- Founder Identity Lock -------------------------------------------------
    // Exactly one founder may exist. The founder email is stored in a secure
    // env var (FOUNDER_EMAIL) read server-side only. We perform a STRICT
    // equality check against the authenticated user's verified email — never a
    // similarity check, never a client-side check, never inferred from a route
    // or parameter. If it matches, and ONLY then, grant founder (+ writer).
    const isFounder = founderEmail.length > 0 && userEmail === founderEmail;

    // Read the user's current profile row server-side (bypasses RLS).
    const { data: profile, error: profileErr } = await adminClient
      .from("profiles")
      .select("role, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileErr) {
      return new Response(
        JSON.stringify({ error: "Profile lookup failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let role: "reader" | "writer" | "founder" =
      (profile?.role as "reader" | "writer" | "founder") ?? "reader";

    // Founder always carries writer in addition. Founder is the highest tier.
    if (isFounder) {
      role = "founder";
    } else if (role === "founder") {
      // Defensive: if a stale founder row exists but the email no longer matches
      // the locked value, demote back to writer (founder is revocable server-side).
      role = "writer";
    }
    // Reader -> writer escalation happens automatically via the DB trigger on
    // first publish; nothing to do here for that path.

    // Persist the resolved role server-side (service role bypasses RLS).
    // Only write if it actually changed, to avoid needless updates.
    if (profile && profile.role !== role) {
      const { error: updateErr } = await adminClient
        .from("profiles")
        .update({ role })
        .eq("id", user.id);
      if (updateErr) {
        return new Response(
          JSON.stringify({ error: "Role sync failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const body: RoleResponse = {
      role,
      is_founder: isFounder,
      is_writer: role === "writer" || role === "founder",
      display_name: profile?.display_name ?? null,
    };

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
