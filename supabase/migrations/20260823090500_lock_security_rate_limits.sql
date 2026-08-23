create policy "security rate limits deny client access"
on public.security_rate_limit_buckets
for all
to anon, authenticated
using (false)
with check (false);
