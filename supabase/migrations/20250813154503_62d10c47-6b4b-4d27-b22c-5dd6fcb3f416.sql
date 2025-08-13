
-- 1) Default: nye versjoner skal ikke være aktive automatisk
ALTER TABLE public.accounting_data_versions
ALTER COLUMN is_active SET DEFAULT false;

-- 2) Deaktiver alle tomme versjoner
UPDATE public.accounting_data_versions
SET is_active = false
WHERE total_transactions = 0;

-- 3) Sikre at det kun er én aktiv versjon per klient.
-- Velg nyeste versjon med data; hvis ingen har data, velges høyeste versjon.
WITH ranked AS (
  SELECT
    id,
    client_id,
    ROW_NUMBER() OVER (
      PARTITION BY client_id
      ORDER BY
        CASE WHEN total_transactions > 0 THEN 1 ELSE 0 END DESC,
        version_number DESC,
        created_at DESC
    ) AS rn
  FROM public.accounting_data_versions
)
UPDATE public.accounting_data_versions v
SET is_active = (r.rn = 1)
FROM ranked r
WHERE v.id = r.id;

-- 4) Håndhev maks én aktiv versjon per klient
DROP INDEX IF EXISTS public.one_active_version_per_client;
CREATE UNIQUE INDEX one_active_version_per_client
  ON public.accounting_data_versions (client_id)
  WHERE is_active;
