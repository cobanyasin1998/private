-- The application is Turkish-only. Normalize any pre-existing owner before
-- enforcing the invariant at the database boundary.
UPDATE "Owner" SET "locale" = 'tr' WHERE "locale" <> 'tr';

ALTER TABLE "Owner"
  ADD CONSTRAINT "Owner_locale_tr_check" CHECK ("locale" = 'tr');
