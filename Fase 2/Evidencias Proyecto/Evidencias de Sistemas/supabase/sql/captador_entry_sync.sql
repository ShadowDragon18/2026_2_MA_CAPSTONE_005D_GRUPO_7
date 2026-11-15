drop policy if exists "captador_entries_delete" on public.captador_entries;

create policy "captador_entries_delete"
  on public.captador_entries
  for delete
  to authenticated
  using (public.current_user_role() in ('admin', 'reception'));
