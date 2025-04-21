
import { supabase } from "@/integrations/supabase/client";

export async function updateClientRoles(clientId: string, roles: any, clientName: string) {
  try {
    console.log(`Updating roles for client ${clientName} (${clientId})`, roles);
    
    // First delete existing roles
    const { error: deleteError } = await supabase
      .from("client_roles")
      .delete()
      .eq("client_id", clientId);
    
    if (deleteError) {
      console.error(`Error deleting existing roles for ${clientName}:`, deleteError);
    }
    
    const rolesToInsert = [];
    
    // Add CEO role if present
    if (roles?.ceo?.name) {
      console.log(`Adding CEO: ${roles.ceo.name}`);
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
      console.log(`Adding Chair: ${roles.chair.name}`);
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
      console.log(`Adding ${roles.boardMembers.length} board members`);
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
      console.log(`Inserting ${rolesToInsert.length} roles for client ${clientName}`);
      const { error } = await supabase.from("client_roles").insert(rolesToInsert);
      if (error) {
        console.error(`Error inserting roles for ${clientName}:`, error);
      } else {
        console.log(`Successfully inserted ${rolesToInsert.length} roles for ${clientName}`);
      }
    } else {
      console.log(`No roles to insert for client ${clientName}`);
    }
  } catch (rolesError) {
    console.error(`Error processing roles for ${clientName}:`, rolesError);
  }
}
