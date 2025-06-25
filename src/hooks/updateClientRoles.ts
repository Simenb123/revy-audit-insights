
import { supabase } from "@/integrations/supabase/client";
import { log, error as logError } from "@/utils/logger";

export async function updateClientRoles(clientId: string, roles: any, clientName: string) {
  try {
    log(`Updating roles for client ${clientName} (${clientId})`, roles);
    
    // First delete existing roles
    const { error: deleteError } = await supabase
      .from("client_roles")
      .delete()
      .eq("client_id", clientId);
    
    if (deleteError) {
      logError(`Error deleting existing roles for ${clientName}:`, deleteError);
    }
    
    const rolesToInsert = [];
    
    // Add CEO role if present
    if (roles?.ceo?.name) {
      log(`Adding CEO: ${roles.ceo.name}`);
      rolesToInsert.push({
        client_id: clientId,
        role_type: "CEO",
        name: roles.ceo.name,
        from_date: roles.ceo.fromDate || null,
        to_date: roles.ceo.toDate || null,
      });
    }
    
    // Add Chair role if present
    if (roles?.chair?.name) {
      log(`Adding Chair: ${roles.chair.name}`);
      rolesToInsert.push({
        client_id: clientId,
        role_type: "CHAIR",
        name: roles.chair.name,
        from_date: roles.chair.fromDate || null,
        to_date: roles.chair.toDate || null,
      });
    }
    
    // Add board members if present
    if (roles?.boardMembers && Array.isArray(roles.boardMembers)) {
      log(`Adding ${roles.boardMembers.length} board members`);
      for (const member of roles.boardMembers) {
        if (member.name) {
          rolesToInsert.push({
            client_id: clientId,
            role_type: member.roleType || "MEMBER",
            name: member.name,
            from_date: member.fromDate || null,
            to_date: member.toDate || null,
          });
        }
      }
    }
    
    // Insert all roles
    if (rolesToInsert.length > 0) {
      log(`Inserting ${rolesToInsert.length} roles for client ${clientName}`);
      const { error } = await supabase.from("client_roles").insert(rolesToInsert);
      if (error) {
        logError(`Error inserting roles for ${clientName}:`, error);
      } else {
        log(`Successfully inserted ${rolesToInsert.length} roles for ${clientName}`);
      }
    } else {
      log(`No roles to insert for client ${clientName}`);
    }
  } catch (rolesError) {
    logError(`Error processing roles for ${clientName}:`, rolesError);
  }
}
