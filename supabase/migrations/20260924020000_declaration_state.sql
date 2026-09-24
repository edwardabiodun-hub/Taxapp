-- Adds the tax-filing jurisdiction (Nigerian state of residence) to each
-- declaration. Nullable and unbackfilled -- declarations created before
-- this feature existed simply have no state, and calculateStateTax()
-- treats that the same as an unrecognized code: fall through to the
-- federal PIT baseline, never error.
alter table public.declarations add column state text;
