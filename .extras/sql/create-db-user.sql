CREATE ROLE "event" LOGIN PASSWORD 'Omnixys15.11.2025';
CREATE DATABASE "event";
CREATE DATABASE shadow;
GRANT ALL ON DATABASE "event" TO "event";
GRANT ALL ON DATABASE shadow TO "event";


drop role "event";