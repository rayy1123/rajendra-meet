select count(*) as has_registrant_col
from information_schema.columns
where table_name='registrations' and column_name='registrant_id';
