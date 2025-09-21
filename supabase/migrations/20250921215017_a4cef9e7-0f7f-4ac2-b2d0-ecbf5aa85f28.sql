-- Re-enqueue job 40 for testing streaming implementation
INSERT INTO shareholder_import_queue (
  job_id, 
  bucket, 
  path, 
  mapping, 
  user_id,
  status,
  created_at
) VALUES (
  40,
  'imports',
  'shareholders/1758486381768_aksjeeiebok__2024_07052025.csv',
  '{"orgnr": "orgnr", "selskap": "selskap", "navn_aksjonaer": "navn_aksjonaer", "fodselsaar_orgnr": "fodselsaar_orgnr", "landkode": "landkode", "aksjeklasse": "aksjeklasse", "antall_aksjer": "antall_aksjer"}'::jsonb,
  (SELECT user_id FROM import_jobs WHERE id = 40),
  'queued',
  now()
);