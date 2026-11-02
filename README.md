# BookingSite

Simpel booking side lavet til Cille

## Blokering af datoer

Kør [`supabase/blocked_dates.sql`](./supabase/blocked_dates.sql) i Supabase
SQL Editor. Når tabellen er oprettet, kan en logget ind admin klikke på datoer
i admin-kalenderen og vælge de klokkeslæt, der skal lukkes. De valgte
klokkeslæt vises som utilgængelige for besøgende.
