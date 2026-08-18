-- Hapus event duplikat dari seed lama (dibuat 2026-07-28) agar tidak membingungkan.
-- Anak-anaknya (competition_events, heats, dll) ikut terhapus via ON DELETE CASCADE.
delete from public.events where id = '019faad4-76d1-7298-9e83-06366c579cea';

select count(*) as events_remaining from public.events;
