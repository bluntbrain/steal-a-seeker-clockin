-- anonymous retention counts: one row per install per day. the install id is a random uuid made on the device; no
-- wallet, account or ip address is stored. rows older than a year are deleted by the api
CREATE TABLE app_opens (
 install_id uuid NOT NULL,
 day date NOT NULL,
 version text NOT NULL,
 PRIMARY KEY(install_id,day)
);
CREATE INDEX app_opens_day ON app_opens(day);
