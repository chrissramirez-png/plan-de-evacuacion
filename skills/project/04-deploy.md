# Deploy y Variables — Apps del Innovation Hub

Prerequisito: haber leído 03-seguridad-app.md

---

## Variables de entorno

### Configuradas automáticamente por el Hub

NO ponerlas en env_required de hub.config.json — el Hub las setea al deployar:

```
NEXT_PUBLIC_SUPABASE_URL      — URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY — Anon key de Supabase
NEXT_PUBLIC_HUB_URL           — URL del Hub
METRICS_API_KEY               — Para proteger endpoints de métricas
DB_SCHEMA                     — Schema aislado en Supabase (app_{slug})
```

### Variables propias de la app

Solo poner en `env_required` del hub.config.json las variables que:

- **NO** tienen valor por defecto en el código
- **NO** están en la lista de arriba

Si el código tiene un default hardcodeado, NO ponerla.

**Ejemplo correcto:**

```json
"env_required": [
  { "key": "GOOGLE_APPLICATION_CREDENTIALS_JSON", "description": "JSON de service account GCP", "public": false },
  { "key": "SLACK_BOT_TOKEN", "description": "Token del bot de Slack", "public": false }
]
```

El Hub pide estos valores al admin en el momento del deploy (campos tipo password, no se guardan en la BD del Hub — van directo a Railway).

---

## Credenciales JSON (GCP service account, etc.)

Si una variable contiene un JSON largo (service account de GCP, Firebase, etc.), Railway la pasa como string pero las librerías esperan un archivo. Necesitás convertirla.

### Paso 1: Declarar en hub.config.json

```json
{
  "key": "GOOGLE_APPLICATION_CREDENTIALS_JSON",
  "description": "JSON de service account GCP",
  "public": false
}
```

### Paso 2: Crear entrypoint.sh en la raíz

```bash
#!/bin/bash
if [ -n "$GOOGLE_APPLICATION_CREDENTIALS_JSON" ]; then
  echo "$GOOGLE_APPLICATION_CREDENTIALS_JSON" > /tmp/gcp-credentials.json
  export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcp-credentials.json
fi
exec "$@"
```

### Paso 3: Configurar en Dockerfile

```dockerfile
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
```

---

## Docker

- Si hay `Dockerfile` en la raíz, Railway lo usa para el build
- Si no hay `Dockerfile`, Railway detecta el stack automáticamente (Node.js)
- Para credenciales JSON, necesitás Dockerfile con entrypoint

---

## hub.config.json

Cada proyecto DEBE tener este archivo en la raíz. Ver deploy-config.md (baseline) para la especificación completa.

Ejemplo mínimo:

```json
{
  "name": "Mi App",
  "slug": "mi-app",
  "description": "Qué hace esta app",
  "type": "frontend",
  "visibility": "public",
  "owner": "tu-email@comunidadfeliz.cl",
  "endpoints": {
    "health": "/api/health",
    "metrics_menu": "/api/metrics/menu",
    "metrics": "/api/metrics"
  }
}
```

---

## Registro en el Hub

1. Crea tu app con hub.config.json en la raiz
2. Pushea a un repo de GitHub en la org `ComunidadFeliz-Interno`
3. En el Hub -> "Registrar proyecto" -> pega la URL de GitHub
4. El Hub lee hub.config.json (usa GitHub API con Classic PAT para repos privados)
5. Muestra la config para revisar
6. Si hay variables extra, te las pide (campos password, no se guardan)
7. Click "Deployar en Railway"
8. El Hub:
   - Verifica que no exista un servicio con el mismo nombre
   - Crea el servicio en el proyecto Railway **"desirable-magic"**
   - Conecta el repo para continuous deployment (branch main)
   - Configura variables de entorno
   - Genera dominio Railway
   - Agrega redirect URL a Supabase auth config ({SERVICE_URL}/auth/callback)
   - Registra el proyecto en la BD del Hub
9. Continuous deployment activo: cada push a main se despliega automaticamente

**IMPORTANTE**: Las variables `NEXT_PUBLIC_*` en Next.js se embeben en build time, NO en runtime. Si Railway configura las variables despues del primer build, hay que forzar un nuevo build (empty commit + push).

**NO crear servicios en Railway manualmente. Solo desde el Hub.**
