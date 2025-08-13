
-- Sett aktiv versjon for klient 2196412e-6c73-4bf5-9d42-29bbb35d0802 til Versjon 3 (med transaksjoner)
-- Bruk eksisterende funksjon som samtidig deaktiverer andre versjoner for samme klient.
select set_active_version('8e00dadd-c1bb-47bd-89ac-1d2af9e8a67b'::uuid);
