-- Opprett firma-chat for eksisterende firmaer som mangler chat-rom
INSERT INTO public.chat_rooms (room_type, reference_id, name, description)
SELECT 
  'firm'::communication_type,
  af.id,
  af.name || ' - Firmachat',
  'Generell chat for ' || af.name
FROM public.audit_firms af
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.chat_rooms cr 
  WHERE cr.room_type = 'firm'::communication_type 
  AND cr.reference_id = af.id
);

-- Opprett avdelings-chat for eksisterende avdelinger som mangler chat-rom
INSERT INTO public.chat_rooms (room_type, reference_id, name, description)
SELECT 
  'department'::communication_type,
  d.id,
  d.name || ' - Avdelingschat',
  'Chat for ' || d.name
FROM public.departments d
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.chat_rooms cr 
  WHERE cr.room_type = 'department'::communication_type 
  AND cr.reference_id = d.id
);