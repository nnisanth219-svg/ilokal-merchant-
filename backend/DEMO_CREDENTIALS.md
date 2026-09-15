# Local demo credentials (development only — do not commit real secrets)

## Super Admin
- Name: David R.
- Email: `superadmin@ilokal.my`
- Password: `SuperAdmin123!`
- Role: SUPER_ADMIN (full access)

## Operations
- Name: Mei Ling Chong
- Email: `meiling@ilokal.my`
- Password: `Operations123!`
- Role: OPERATIONS (Dashboard, Members view, Merchants/Offers edit, etc. — no Admin Users / Settings)

## Admin (optional)
- Name: Faiz Mohammed
- Email: `faiz@ilokal.my`
- Password: `Admin123!`
- Role: ADMIN

Override via backend `.env`:
- `SEED_SUPER_ADMIN_PASSWORD`
- `SEED_OPERATIONS_PASSWORD`
- `SEED_ADMIN_PASSWORD`

Re-run `npm run seed` in `backend/` after changing env values.
