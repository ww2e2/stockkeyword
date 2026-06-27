create table if not exists public.search_logs (
  id bigint generated always as identity primary key,
  source_platform text not null default 'miricanvas',
  search_type text not null check (search_type in ('keyword', 'template')),
  keyword text not null default '',
  template_type_value text not null default '',
  template_type_label text not null default '',
  search_month text not null,
  created_at timestamptz not null default now()
);

create index if not exists search_logs_source_platform_idx
  on public.search_logs (source_platform);

create index if not exists search_logs_search_month_idx
  on public.search_logs (search_month);

create index if not exists search_logs_search_type_idx
  on public.search_logs (search_type);

create index if not exists search_logs_keyword_idx
  on public.search_logs (keyword);
