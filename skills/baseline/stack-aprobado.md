# Stack Aprobado — ComunidadFeliz Innovation Hub

Regla obligatoria. Claude Code debe seguirla siempre.

---

## Principio

> **Nota:** El template oficial es Next.js. Flask solo para repositorios existentes que aun no han migrado.

Todas las apps del Innovation Hub DEBEN usar exclusivamente los servicios aprobados. Esto garantiza control centralizado, costos predecibles, y soporte uniforme.

---

## Servicios aprobados

| Categoria         | Servicio                            | Uso                                           |
| ----------------- | ----------------------------------- | --------------------------------------------- |
| **Hosting**       | Railway                             | Deploy de todas las apps (via Innovation Hub) |
| **Base de datos** | Supabase (PostgreSQL)               | Datos persistentes, auth, RLS                 |
| **Auth**          | Supabase Google OAuth               | Login con cuentas @comunidadfeliz.cl          |
| **Cache**         | Railway Redis                       | Cache de datos, sesiones, colas               |
| **Repositorio**   | GitHub (org ComunidadFeliz-Interno) | Codigo fuente, CI/CD                          |

---

## Servicios NO permitidos

### Hosting alternativo

- Vercel, Heroku, Netlify, Render, Fly.io, AWS (Lambda, ECS, etc.), Google Cloud Run, Azure

### Bases de datos externas

- MongoDB / MongoDB Atlas
- MySQL / PlanetScale
- Firebase Firestore / Realtime Database
- DynamoDB, Cosmos DB
- CockroachDB, Neon, Turso

### Cache/Queue externos

- Upstash (Redis o QStash)
- AWS ElastiCache / SQS
- Memcached
- BullMQ con Redis externo

### Auth externos

- Auth0, Clerk, Firebase Auth, NextAuth (con providers propios), Passport.js (con providers externos)

### Storage externo

- AWS S3, Google Cloud Storage, Cloudinary, Uploadthing

---

## Como usar cache (Railway Redis)

Si la app necesita cache:

1. Se provisiona Redis dentro del proyecto Railway (lo puede hacer el Hub o manualmente)
2. Railway expone `REDIS_URL` automaticamente
3. Conectar con `ioredis`
4. Si `REDIS_URL` no esta disponible, la app DEBE funcionar con fallback a memoria

```typescript
import Redis from "ioredis";
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
```

---

## Como usar base de datos (Supabase)

- Todas las apps comparten el mismo proyecto Supabase
- Cada app tiene su propio schema aislado (app\_{slug})
- Usar el SDK de Supabase o conexion directa via `DB_SCHEMA`
- RLS obligatorio en todas las tablas

---

## Versiones fijadas (obligatorio)

Siempre fijar versiones en `package.json` para evitar que Railway instale una versión nueva que rompa la app.

### package.json

Usar versiones exactas (sin `^` ni `~`) para dependencias críticas:

```json
"dependencies": {
  "express": "4.21.2",
  "@supabase/supabase-js": "2.49.8"
}
```

---

## Dependencias bloqueadas

Los tests de CI validan automaticamente que no se usen dependencias de servicios no aprobados. Si se detecta una dependencia sospechosa, el test falla con un warning que indica que se debe contactar al owner del Hub.

- `@upstash/*` — usar Railway Redis
- `mongoose`, `mongodb` — usar Supabase (PostgreSQL)
- `mysql2`, `mysql` — usar Supabase (PostgreSQL)
- `firebase`, `firebase-admin` — usar Supabase
- `@auth0/*`, `@clerk/*` — usar Supabase Auth
- `@aws-sdk/*` — no usar servicios AWS
- `@google-cloud/*` (excepto si se necesita BigQuery u otro servicio GCP aprobado caso a caso)
- `@azure/*` — no usar servicios Azure
- `planetscale-database` — usar Supabase
- `@neondatabase/*`, `@libsql/*` — usar Supabase

---

## Excepciones

Si una app necesita un servicio externo por una razon justificada (ej: BigQuery para analytics, Slack API para bots), debe:

1. Documentarlo en `hub.config.json` → `env_required`
2. Explicar la razon en `docs.md`
3. Obtener aprobacion del owner del Hub antes de deployar

---

## Lo que NUNCA hacer

- Usar servicios de hosting que no sean Railway
- Usar bases de datos que no sean Supabase PostgreSQL
- Usar servicios de auth que no sean Supabase Google OAuth
- Usar cache externo (Upstash, ElastiCache) en vez de Railway Redis
- Instalar dependencias de servicios no aprobados sin autorizacion
