# Mnara ERP Authentication System Implementation Plan

Implement a 2-step JWT authentication flow in the shell app using Angular Signals, Angular Material + TailwindCSS, with localStorage token persistence and automatic portal routing based on user role.

---

## 1. Project Structure Changes

### New Files to Create
```
apps/shell/src/app/
├── auth/
│   ├── components/
│   │   ├── discover-page/          # Step 1: Identifier input
│   │   │   ├── discover-page.ts
│   │   │   └── discover-page.html
│   │   └── credentials-page/       # Step 2: Password + login
│   │       ├── credentials-page.ts
│   │       └── credentials-page.html
│   ├── services/
│   │   ├── auth.service.ts         # API calls (login, me, refresh)
│   │   └── token-storage.service.ts # localStorage wrapper
│   ├── guards/
│   │   ├── auth.guard.ts           # Protect routes requiring auth
│   │   └── portal.guard.ts         # Redirect to correct portal
│   ├── interceptors/
│   │   └── auth.interceptor.ts     # Attach tokens + silent refresh
│   ├── store/
│   │   └── auth.store.ts           # Angular Signals state
│   └── models/
│       ├── auth.models.ts          # LoginRequest, Tokens, UserContext
│       └── portal-types.ts         # PortalType enum, route mappings

apps/shell/src/
├── styles/
│   └── _material-theme.scss        # Material custom theme
```

---

## 2. Implementation Steps

### Phase 1: Dependencies & Setup (30 min)
1. Install Angular Material: `ng add @angular/material`
2. Install TailwindCSS in workspace
3. Configure Material theme with Mnara brand colors
4. Add `provideAnimationsAsync()` to shell app config

### Phase 2: Core Auth Infrastructure (1 hour)
1. **Create Models** (`auth.models.ts`)
   - `LoginRequest`: `{ school_id: string, password: string }`
   - `Tokens`: `{ access: string, refresh: string }`
   - `UserContext`: Full `/auth/me/` response shape
   - `PortalType`: ADMIN | STAFF | TRANSPORT | STUDENT | PARENT

2. **Token Storage Service** (`token-storage.service.ts`)
   - Methods: `saveTokens()`, `getAccessToken()`, `getRefreshToken()`, `clearTokens()`
   - Keys: `mnara_access_token`, `mnara_refresh_token`

3. **Auth Service** (`auth.service.ts`)
   - `login(credentials)`: POST `/api/v1/accounts/auth/login/`
   - `fetchUserContext()`: GET `/api/v1/accounts/auth/me/`
   - `refreshToken()`: POST `/api/v1/accounts/auth/refresh/`
   - `isTokenExpired()`: JWT expiry check

### Phase 3: State Management (45 min)
1. **Auth Store** (`auth.store.ts`) - Angular Signals
   - `identifier`: signal<string>('') - Step 1 capture
   - `user`: signal<UserContext | null>(null) - From /auth/me/
   - `tokens`: signal<Tokens | null>(null) - JWT pair
   - `isAuthenticated`: computed(() => !!this.tokens())
   - `permissions`: computed(() => this.user()?.permissions || [])
   - Methods: setIdentifier(), setTokens(), setUserContext(), hasPermission(), isGodMode(), logout()

### Phase 4: UI Components (1.5 hours)
1. **Discover Page** (`discover-page`)
   - Angular Material card layout
   - Single input: "School ID or Email"
   - "Next" button → store identifier → navigate to credentials
   - Tailwind for responsive centering

2. **Credentials Page** (`credentials-page`)
   - Display: "Welcome back, [identifier]"
   - Back button → return to discover
   - Password input (Material form field)
   - Login button → call authService.login()
   - Loading spinner during API call
   - Error handling with Material snackbar

### Phase 5: Routing & Guards (1 hour)
1. **Auth Guard** (`auth.guard.ts`)
   - Check `isAuthenticated()`
   - If no → redirect to `/login`
   - If yes → allow

2. **Portal Guard** (`portal.guard.ts`)
   - For `/` route (default)
   - If authenticated → redirect based on `portalKey`
   - If not → redirect to `/login`

3. **Route Configuration** (`app.routes.ts`)
   - `/login` route with children for discover and credentials
   - Public guard to redirect already-authenticated users
   - Portal routes protected by auth

### Phase 6: HTTP Interceptor (45 min)
1. **Auth Interceptor** (`auth.interceptor.ts`)
   - Attach `Authorization: Bearer <token>` to all requests
   - Catch 401 errors
   - Silent refresh: call refreshToken() on 401, retry original request
   - Prevent infinite refresh loops
   - On refresh failure: logout + redirect to /login

### Phase 7: Portal Routing Logic (30 min)
1. **Portal Mapping** (`portal-types.ts`)
   - Map portalKey to Angular routes:
     - `admin-portal` → `/portalAdmin`
     - `teacher-portal` → `/portalTeacher`
     - `student-portal` → `/portalStudent`
     - `parent-portal` → `/portalParent`
     - `transport-portal` → `/portalTransport`

2. **Post-Login Flow** (in credentials-page)
   - Store tokens
   - Fetch user context
   - Navigate to portal route based on portalKey

---

## 3. Key Implementation Details

### GodMode Handling
```typescript
if (authStore.isGodMode()) {
  // User has universal access (permissions: ["*"])
  return true
}
return authStore.hasPermission('view_grades')
```

### API Integration Points
- **Endpoints**:
  - `POST /api/v1/accounts/auth/login/`
  - `GET /api/v1/accounts/auth/me/`
  - `POST /api/v1/accounts/auth/refresh/`

### Error Handling Strategy
- Network errors: Material snackbar with retry option
- 401 on login: Show "Invalid credentials" on credentials page
- Token refresh fail: Silent logout, redirect to login

### Security Considerations
- XSS: Angular's built-in sanitization
- Tokens in localStorage: Acceptable for this architecture
- HTTPS required in production
- Token expiry: 60 min access, refresh on 401

---

## 4. Testing Checklist

- [ ] Discover page captures identifier
- [ ] Credentials page displays identifier
- [ ] Back button returns to discover
- [ ] Login API called with correct payload
- [ ] Tokens stored in localStorage
- [ ] User context fetched after login
- [ ] Redirect to correct portal based on portalKey
- [ ] Interceptor attaches Bearer token
- [ ] 401 triggers silent refresh
- [ ] Refresh failure triggers logout
- [ ] Auth guard blocks unauthenticated users
- [ ] GodMode (`["*"]`) grants all permissions

---

## 5. Estimated Timeline
- Phase 1 (Setup): 30 min
- Phase 2 (Core): 1 hour
- Phase 3 (State): 45 min
- Phase 4 (UI): 1.5 hours
- Phase 5 (Routing): 1 hour
- Phase 6 (Interceptor): 45 min
- Phase 7 (Integration): 30 min
- **Total: ~6 hours**

---

## 6. Dependencies to Install

```bash
# Angular Material
npx nx g @angular/material:ng-add --project=shell

# Tailwind (if not already installed)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```
