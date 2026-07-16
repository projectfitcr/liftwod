-- UPDATE policies need both predicates: USING controls which existing rows a
-- caller may target, while WITH CHECK prevents a member from moving their
-- result to another member_id during the update.
alter policy results_update on public.results
  using (member_id = (select auth.uid()) or public.is_staff())
  with check (member_id = (select auth.uid()) or public.is_staff());
