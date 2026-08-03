-- Hapus tabel diagnostik sementara yang dipakai untuk melacak
-- kegagalan login 0008 (lihat 0009/0010).
drop table if exists public._diag;
