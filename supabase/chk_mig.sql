select column_name, data_type, is_nullable
from information_schema.columns
where table_name='registrations' and column_name='registrant_id';
select table_name from information_schema.tables where table_name='payment_verifications';
