
create policy "photos read" on storage.objects for select using (bucket_id = 'problem-photos');
create policy "photos upload own" on storage.objects for insert to authenticated with check (bucket_id = 'problem-photos' and (storage.foldername(name))[1] = auth.uid()::text);
