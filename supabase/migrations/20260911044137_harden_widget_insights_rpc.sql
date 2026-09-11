revoke all on function public.record_widget_load(uuid, text) from anon;
revoke all on function public.record_widget_load(uuid, text) from authenticated;
grant execute on function public.record_widget_load(uuid, text) to service_role;
