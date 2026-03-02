# Lessons Learned

## Session: Azure SWA Production Deployment (2026-03-02)

### MSAL Version Compatibility
- `@azure/msal-react@3` is **incompatible** with `@azure/msal-browser@4` — MsalProvider crashes silently (blank white page)
- **Fix**: Don't use MsalProvider at all. Pass `msalInstance` directly as a prop to AuthContext and call `loginPopup()` directly. This avoids the version mismatch entirely and removes the `@azure/msal-react` dependency.
- `@azure/msal-react@5` requires React 19, project uses React 18 — another reason to skip it

### Empty User Registry Crash (Production)
- In production, `BADGE_USERS` starts empty (no demo data). `BadgeContext` had `users.find() || users[0]` which returns `undefined` when array is empty
- Any downstream `.role` access crashes the entire app
- **Fix**: Add null guards everywhere: `|| null` fallback, ternary checks before accessing `.role`, and null guards in permission check functions
- **Better fix**: Seed a default admin user in production instead of starting empty

### Azure SWA Auto-Generated Workflow
- When you create an Azure Static Web App connected to GitHub, Azure **automatically pushes its own workflow file** (e.g., `azure-static-web-apps-jolly-sea-02e659910.yml`) to your repo
- It also uses a **suffixed secret name** like `AZURE_STATIC_WEB_APPS_API_TOKEN_JOLLY_SEA_02E659910` (not the generic `AZURE_STATIC_WEB_APPS_API_TOKEN`)
- **Fix**: Delete Azure's auto-generated workflow, keep your custom one, and update the secret name to match what Azure created

### Bootstrap() Error Handling
- `async function bootstrap()` in main.jsx must have try/catch around MSAL init AND a `.catch()` on the bootstrap call itself
- Without this, any MSAL error = blank white page with no feedback
- Always render React even if MSAL fails — show error in DOM as fallback

### CSP Headers Not Applied
- `staticwebapp.config.json` `globalHeaders` were not appearing in actual HTTP responses during testing
- Azure SWA may have its own header policies that override or ignore custom CSP
- This didn't cause the blank page — the issue was JS-level, not network-level

### Dual-Mode Auth Architecture
- `VITE_AUTH_MODE` (mock/real) and `VITE_APP_ENV` (development/production) control behavior from same codebase
- Mock mode: demo users, account picker, email+MFA flow
- Real mode: Microsoft MSAL popup, production user registry
- Environment variables are baked into the bundle at build time by Vite — verified by grepping the production JS bundle

### CI/CD Workflow Tips
- Use `skip_app_build: true` in Azure SWA deploy action when building yourself (to inject env vars)
- PR previews use `mock` auth (can't pre-register dynamic preview URLs in OAuth)
- Production pushes to main use `real` auth

### Google OAuth Removal
- User decided Microsoft-only for production (they're a Microsoft company)
- Removed `@react-oauth/google`, all GoogleLogin components, handleGoogleCredential, GoogleOAuthProvider
- Kept Google SSO button in mock/dev mode for demo account picking (it's just a styled button, no real Google)
