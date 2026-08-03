-- Sementara: izinkan anon membaca tabel diagnostik.
drop policy if exists diag_read on public._diag;
create policy diag_read on public._diag for select using (true);
