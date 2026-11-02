# BookingSite

Simpel booking side lavet til Cille

## Blokering af datoer

Kør [`supabase/blocked_dates.sql`](./supabase/blocked_dates.sql) i Supabase
SQL Editor. Når tabellen er oprettet, kan en logget ind admin klikke på datoer
i admin-kalenderen for at lukke eller åbne dem igen. Lukkede datoer vises som
utilgængelige for besøgende.
