
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { getSupabase } from "../_shared/supabaseClient.ts";
import { log, error as logError } from "../_shared/log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

type ReceiverType = "team" | "department" | "firm";

type GroupMessage = {
  id: string;
  sender_id: string;
  receiver_type: ReceiverType;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

const ok = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), { headers: corsHeaders, ...init });

const err = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    headers: corsHeaders,
    status,
  });

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const upgradeHeader = req.headers.get("upgrade") || "";
  const isWebSocket = upgradeHeader.toLowerCase() === "websocket";

  // Handle WebSocket for realtime delivery
  if (isWebSocket) {
    const { socket, response } = Deno.upgradeWebSocket(req, { protocol: undefined });

    socket.onopen = () => {
      (async () => {
        try {
          const supabase = getSupabase(req);
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData?.user) {
            logError("Unauthorized websocket connection attempt", userError);
            socket.send(JSON.stringify({ type: "error", message: "unauthorized" }));
            socket.close(1008, "unauthorized");
            return;
          }

          const userId = userData.user.id;
          log("WS connected for user", userId);

          // Fetch group memberships
          const { data: teamRows } = await supabase.rpc("get_user_team_ids", { user_uuid: userId });
          const teamIds: string[] = (teamRows || []).map((r: { team_id: string }) => r.team_id);

          const { data: departmentId } = await supabase.rpc("get_user_department", { user_uuid: userId });
          const { data: firmId } = await supabase.rpc("get_user_firm", { user_uuid: userId });

          const allowed = {
            team: new Set<string>(teamIds || []),
            department: departmentId ? new Set<string>([String(departmentId)]) : new Set<string>(),
            firm: firmId ? new Set<string>([String(firmId)]) : new Set<string>(),
          };

          // Subscribe to INSERTs on group_messages
          const channel = supabase
            .channel(`group-messages:${userId}`)
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "group_messages" },
              (payload) => {
                try {
                  const m = payload.new as GroupMessage;
                  const { receiver_type, receiver_id } = m;
                  const allowedSet =
                    receiver_type === "team"
                      ? allowed.team
                      : receiver_type === "department"
                      ? allowed.department
                      : allowed.firm;

                  if (allowedSet.has(receiver_id)) {
                    socket.send(JSON.stringify({ type: "message", data: m }));
                  }
                } catch (e) {
                  logError("Error handling realtime payload", e);
                }
              }
            )
            .subscribe((status) => {
              log("Realtime channel status:", status);
              if (status === "SUBSCRIBED") {
                socket.send(JSON.stringify({ type: "ready" }));
              }
            });

          // Accept client messages to send new chat messages
          socket.onmessage = async (evt) => {
            try {
              const msg = JSON.parse(evt.data || "{}");
              if (msg?.type === "send") {
                const { receiver_type, receiver_id, content } = msg || {};
                if (!content || !receiver_type || !receiver_id) {
                  socket.send(JSON.stringify({ type: "error", message: "Missing fields" }));
                  return;
                }

                const { error: insertError } = await supabase.from("group_messages").insert({
                  sender_id: userId,
                  receiver_type,
                  receiver_id,
                  content,
                });

                if (insertError) {
                  logError("Insert error via WS", insertError);
                  socket.send(JSON.stringify({ type: "error", message: insertError.message }));
                  return;
                }
                socket.send(JSON.stringify({ type: "ack" }));
              } else if (msg?.type === "ping") {
                socket.send(JSON.stringify({ type: "pong" }));
              }
            } catch (e) {
              logError("WS message parse error", e);
              socket.send(JSON.stringify({ type: "error", message: "invalid_message" }));
            }
          };

          socket.onclose = () => {
            try {
              supabase.removeAllChannels();
            } catch (_) {}
            log("WS closed for user", userId);
          };
        } catch (e) {
          logError("WS fatal error", e);
          try {
            socket.send(JSON.stringify({ type: "error", message: "internal_error" }));
          } catch (_) {}
          socket.close(1011, "internal_error");
        }
      })();
    };

    socket.onerror = (e) => {
      logError("WS error", e);
    };

    return response;
  }

  // Handle HTTP GET/POST
  const supabase = getSupabase(req);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return err("Unauthorized", 401);
  }
  const userId = userData.user.id;

  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const receiverType = url.searchParams.get("receiver_type") as ReceiverType | null;
      const receiverId = url.searchParams.get("receiver_id");
      const limit = Math.min(Number(url.searchParams.get("limit") || "50"), 200);

      let query = supabase
        .from("group_messages")
        .select("id,sender_id,receiver_type,receiver_id,content,is_read,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (receiverType && receiverId) {
        query = query.eq("receiver_type", receiverType).eq("receiver_id", receiverId);
      }

      const { data, error } = await query;
      if (error) {
        logError("GET messages error", error);
        return err(error.message, 400);
      }

      return ok({ messages: data || [] });
    } catch (e: any) {
      logError("GET messages exception", e);
      return err("failed_to_fetch", 500);
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.json().catch(() => ({}));
      const { receiver_type, receiver_id, content } = body as {
        receiver_type?: ReceiverType;
        receiver_id?: string;
        content?: string;
      };

      if (!receiver_type || !receiver_id || !content) {
        return err("receiver_type, receiver_id and content are required", 400);
      }

      const { data, error } = await supabase
        .from("group_messages")
        .insert({
          sender_id: userId,
          receiver_type,
          receiver_id,
          content,
        })
        .select("id,sender_id,receiver_type,receiver_id,content,is_read,created_at")
        .single();

      if (error) {
        logError("POST message insert error", error);
        return err(error.message, 400);
      }

      return ok({ message: data }, { status: 201 });
    } catch (e: any) {
      logError("POST messages exception", e);
      return err("failed_to_send", 500);
    }
  }

  return err("Method not allowed", 405);
});
