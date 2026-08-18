select table_name from information_schema.tables where table_schema='public' and table_name in ('equipment_maintenance','audit_log') order by table_name;
