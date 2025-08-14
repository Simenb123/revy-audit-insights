-- Enable realtime for report_builder_settings
alter table public.report_builder_settings replica identity full;
alter publication supabase_realtime add table public.report_builder_settings;