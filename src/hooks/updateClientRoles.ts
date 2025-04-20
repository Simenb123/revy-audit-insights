
import { supabase } from "@/integrations/supabase/client";

export async function updateClientRoles(clientId: string, roles: any, clientName: string) {
  try {
    await supabase.from("client_roles").delete().eq("client_id", clientId);
    const rolesToInsert = [];
    if (roles.ceo) {
      rolesToInsert.push({
        client_id: clientId,
        role_type: "CEO",
        name: roles.ceo.name,
        from_date: roles.ceo.fromDate || null,
        to_date: roles.ceo.toDate || null,
      });
    }
    if (roles.chair) {
      rolesToInsert.push({
        client_id: clientId,
        role_type: "CHAIR",
        name: roles.chair.name,
        from_date: roles.chair.fromDate || null,
        to_date: roles.chair.toDate || null,
      });
    }
    if (roles.boardMembers) {
      for (const member of roles.boardMembers) {
        rolesToInsert.push({
          client_id: clientId,
          role_type: member.roleType || "MEMBER",
          name: member.name,
          from_date: member.fromDate || null,
          to_date: member.toDate || null,
        });
      }
    }
    if (rolesToInsert.length > 0) {
      await supabase.from("client_roles").insert(rolesToInsert);
    }
  } catch (rolesError) {
    console.error(`Error processing roles for ${clientName}:`, rolesError);
  }
}
