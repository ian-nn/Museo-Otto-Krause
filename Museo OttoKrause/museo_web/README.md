# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Login implementation (UI + backend validation)

This project includes a complete login flow (frontend + backend) implemented for development/testing. Below are the files involved, how they work and how to rebuild or test the login from scratch.

- Files changed/added:
	- `src/components/common/FormularioLogin.jsx` — React component that renders the login UI and calls the API.
	- `src/components/common/FormularioLogin.css` — Styles for the login page (white background, logo top-left, large rounded inputs and red button).
	- `src/pages/Login.jsx` — Page wrapper that simply renders `FormularioLogin`.
	- `src/services/auth.service.js` — Client-side service used to POST credentials to the backend API.
	- `museo_api/auth/login.php` — Backend endpoint that validates credentials against the DB and a set of example accounts for testing.

### How the frontend works

- The UI is in `FormularioLogin.jsx`. It validates presence of both fields, then calls `AuthService.login(username, password)`.
- On successful login the example implementation stores `token` and `user` in `localStorage` and redirects to `/`.
- The logo displayed on the top-left is expected to be in the project's public root at `public/orig-marca-otto-krause.png`. Place the image file at that path.

### How the backend validates credentials

- `museo_api/auth/login.php` performs these checks:
	1. Confirm request method is POST and JSON body is valid.
	2. Confirm `username` and `password` are present.
	3. Check that `username` is a valid email (returns 422 if not).
	4. Attempt to find the user in the `users` table in the database (if configured).
	5. If user not found in DB, fall back to a developer-friendly `example_accounts` list (useful for local testing).

Example test accounts (preconfigured in the backend for testing):

- Admin: `admin@otto.test` / `AdminPass123` (role `admin`)
- User: `user@example.com` / `UserPass123` (role `user`)

> Security note: These example accounts exist only for development convenience. For production you must remove these fallbacks and create accounts in your database with properly hashed passwords.

### How to provision admin accounts (recommended approach)

1. Create a `users` table in the database (MySQL / MariaDB) with at least columns: `id`, `username` (email), `password_hash`, `role`.
2. Use PHP's `password_hash` to generate a salted hash for new passwords and store that in `password_hash`.
3. Give admin users the `role = 'admin'` value.
4. Avoid shipping admin plaintext passwords in code. Provide a secure onboarding flow for administrators (invite + password reset via email).

Example SQL to insert an admin (run in a safe environment):

```sql
INSERT INTO users (username, password_hash, role) VALUES (
	'realadmin@yourdomain.com',
	'REPLACE_WITH_HASH_FROM_PHP_password_hash',
	'admin'
);
```

To produce the hash locally you can run a simple PHP snippet:

```php
<?php
echo password_hash('YourSecurePassword123', PASSWORD_DEFAULT) . PHP_EOL;
```

### How to run and test the login locally

1. Backend (XAMPP / Apache + PHP):

	 - Place the `museo_api` folder inside your web server document root (already in this repo).
	 - Ensure PHP is enabled and `museo_api/auth/login.php` is reachable via URL. The default dev endpoint used in the frontend is:

		 `http://localhost/Museo/Museo-Otto-Krause/Museo%20OttoKrause/museo_api/auth/login.php`

2. Frontend (Vite):

	 - From `museo_web` run:

	 ```bash
	 npm install
	 npm run dev
	 ```

	 - Open the dev URL shown by Vite and visit the Login page.

3. Test with example accounts described above, or create a DB user as described in the provisioning section.

### Files to review for more details

- `src/services/auth.service.js` — config for `API_BASE_URL` and the `LOGIN_ENDPOINT` constant (change `VITE_API_BASE_URL` in your env to point to your API server if needed).
- `museo_api/config/database.php` — DB connection helper used by the backend.

### Notes and best practices

- Remove example accounts before production.
- Use HTTPS in production and set secure cookies or use short-lived JWTs.
- Implement rate-limiting and account lockouts to avoid brute-force attacks.
- Use environment variables for API endpoints and DB credentials (dotenv or server config), not hardcoded values.

If you want, puedo crear un script SQL para crear la tabla `users` y un pequeño script PHP para crear hashes listos para insertar. También puedo quitar las cuentas de ejemplo y sustituir por un comando de creación de usuarios seguro.
