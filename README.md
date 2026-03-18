# RDAM — Registro de Deudores Alimentarios Morosos
**Poder Judicial de la Provincia de Santa Fe**

Sistema web para la consulta y emisión de certificados de libre deuda alimentaria. Permite a ciudadanos solicitar certificados, a operadores judiciales emitirlos, y a administradores gestionar el sistema.

---

## Requisitos previos

- [Docker](https://www.docker.com/) y Docker Compose
- [Node.js](https://nodejs.org/) 18+ y npm (para el frontend)
- Git

---

## Estructura del repositorio

```
RDAM/
├── rdam-backend/                  # Backend Spring Boot + infraestructura Docker
│   ├── src/
│   │   └── main/
│   │       ├── java/ar/gob/pj/rdam/
│   │       │   ├── config/        # Configuración Spring Security
│   │       │   ├── controller/    # Endpoints REST
│   │       │   ├── dto/           # Data Transfer Objects
│   │       │   ├── exception/     # Manejo de errores
│   │       │   ├── model/         # Entidades del dominio
│   │       │   ├── repository/    # Acceso a datos (JdbcTemplate)
│   │       │   ├── security/      # JWT auth filter
│   │       │   └── service/       # Lógica de negocio
│   │       └── resources/
│   │           ├── application.properties      # Configuración prod
│   │           ├── application-dev.properties  # Overrides dev
│   │           └── schema.sql                  # DDL sin datos (para prod)
│   ├── pluspagos-mock-simple/     # Mock del servicio de pagos PlusPagos
│   ├── init.sql                   # DDL + datos de prueba (usado por Docker)
│   ├── docker-compose.yml         # Servicios: DB, backend, mock pagos, mailpit
│   ├── Dockerfile
│   ├── .env.example
│   └── pom.xml
│
└── rdam-frontend/                 # Frontend React + Vite
    ├── src/
    │   ├── api/                   # Servicios HTTP (axios)
    │   ├── components/            # Componentes reutilizables
    │   ├── context/               # AuthContext (JWT)
    │   ├── pages/
    │   │   ├── citizen/           # Portal ciudadano
    │   │   ├── internal/          # Portal operador/admin
    │   │   └── public/            # Landing, login, resultados de pago
    │   ├── router/                # Rutas y guards por rol
    │   └── utils/                 # Validación CUIL, form POST
    ├── index.html
    ├── .env.example
    └── package.json
```

---

## Instalación y ejecución

### Opción A — Desde GitHub

```bash
git clone https://github.com/Yuima98/RDAM
cd RDAM
```

### Opción B — Desde un ZIP (descarga o envío por mail)

1. Descomprimir el archivo ZIP en una carpeta de tu elección
2. Abrir una terminal y navegar a la carpeta descomprimida:

```bash
cd ruta/a/la/carpeta/RDAM
```

> En Windows podés hacer clic derecho en la carpeta y seleccionar "Abrir en Terminal" o "Git Bash aquí".

A partir de acá los pasos son iguales para ambas opciones.

---

### 1. Configurar variables de entorno del backend

```bash
cd rdam-backend
cp .env.example .env
```

Editar `.env` con los valores correspondientes. Los campos requeridos son:

```env
DB_PASSWORD=tu_password_mysql
JWT_SECRET=una_cadena_secreta_de_al_menos_32_caracteres
```

El resto tiene valores por defecto que funcionan en desarrollo.

### 2. Levantar el backend con Docker

```bash
docker compose up -d --build
```

Esto levanta cuatro servicios:

| Servicio | Puerto | Descripción |
|---|---|---|
| `rdam-db` | 3306 | MySQL 8.0 |
| `rdam-backend` | 8080 | API REST Spring Boot |
| `rdam-pluspagos` | 3000 | Mock de pasarela de pagos |
| `rdam-mailpit` | 8025 (UI) / 1025 (SMTP) | Bandeja de entrada local para emails |

### 3. Levantar el frontend

```bash
cd ../rdam-frontend
npm install
npm run dev
```

El frontend queda disponible en **http://localhost:5173**

---

## Accesos

### Portal ciudadano
Ingresar con cualquier dirección de email. El sistema envía un código OTP de 6 dígitos. En perfil `dev`, el OTP aparece en el response del endpoint `/api/v1/auth/register` además de enviarse por email.

### Portal interno (operadores y admin)

| Email | Password | Rol | Circunscripción |
|---|---|---|---|
| `admin@santafe.gov.ar` | `password123` | Admin | — (acceso global) |
| `operador1@santafe.gov.ar` | `password123` | Operador | Primera — Santa Fe |
| `operador2@santafe.gov.ar` | `password123` | Operador | Segunda — Rosario |

---

## Datos de prueba

Al iniciar con Docker, la base de datos se crea automáticamente con datos de prueba definidos en `init.sql`. Incluye solicitudes en todos los estados posibles para facilitar el testing:

| Estado | Descripción |
|---|---|
| `pendiente_pago` | Solicitud creada, esperando pago |
| `pagada` | Pago confirmado, esperando certificado del operador |
| `publicada` | Certificado emitido y disponible para descarga |
| `publicada_vencida` | Certificado vencido (65 días), PDF eliminado |
| `cancelada` | Pago rechazado o fallido |
| `vencida` | Timeout de pago superado sin confirmar |

---

## Tarjetas de prueba (mock PlusPagos)

| Número | Resultado |
|---|---|
| `4242 4242 4242 4242` | Pago aprobado |
| `4000 0000 0000 0002` | Pago rechazado |
| `5555 5555 5555 4444` | Pago aprobado (Mastercard) |
| `5105 1051 0510 5100` | Pago rechazado (Mastercard) |

Usar cualquier fecha futura y cualquier CVV.

---

## Emails — Mailpit

Todos los emails del sistema (OTPs, notificaciones de certificados) se capturan localmente en **Mailpit**. No se envía nada a cuentas reales.

Acceder a la bandeja en: **http://localhost:8025**

---

## Perfiles de Spring Boot

El sistema tiene dos perfiles configurados en `src/main/resources/`:

**`prod` (por defecto):**
- JWT: 24h ciudadano / 4h operadores
- Email OTP: enviado por Mailpit, NO expuesto en el response
- Timeout pago: 60 días
- Logging: INFO
- reCAPTCHA: según flag `rdam.recaptcha.enabled` en `application.properties`

**`dev`:**
- JWT extendidos (30 días) para facilitar testing
- OTP expuesto en el response de `/auth/register`
- Timeout pago: 15 días
- Logging: DEBUG
- reCAPTCHA: deshabilitado

Para cambiar de perfil, editar `application.properties`:

```properties
spring.profiles.active=dev   # o prod
```

Y reconstruir:

```bash
docker compose down && docker compose up -d --build
```

> **Nota:** En perfil `dev`, el reCAPTCHA está deshabilitado (`rdam.recaptcha.enabled=false` en `application-dev.properties`). Para probarlo, activar perfil `prod` y habilitar el flag.

---

## reCAPTCHA v2

El captcha en el formulario de nueva solicitud se controla desde el backend:

```properties
# application.properties
rdam.recaptcha.enabled=true   # activa el captcha
rdam.recaptcha.enabled=false  # lo desactiva
```

Las claves configuradas por defecto son las claves públicas de prueba de Google (funcionan en cualquier entorno, incluyendo `localhost`). Para producción real, reemplazar con claves propias registradas en [Google reCAPTCHA](https://www.google.com/recaptcha).

---

## Jobs de expiración automática

Dos jobs programados corren diariamente a medianoche:

- **Vencimiento de pago:** Solicitudes en `pendiente_pago` que superaron el límite de días pasan a `vencida`. 60 días en prod / 15 días en dev (configurable con `rdam.expiracion.dias-pago`).

- **Vencimiento de certificado:** Solicitudes `publicada` cuyo certificado superó los 65 días pasan a `publicada_vencida` y el PDF es eliminado del servidor.

Para disparar los jobs manualmente en perfil `dev`:

```bash
curl -X POST http://localhost:8080/api/v1/dev/jobs/vencer-pagos
curl -X POST http://localhost:8080/api/v1/dev/jobs/vencer-certificados
```

---

## Base de datos

### Modo desarrollo (con datos de prueba)

Docker usa `init.sql` automáticamente al crear el contenedor. Para recrear desde cero:

```bash
docker compose down -v
docker compose up -d --build
```

> **Importante:** El flag `-v` elimina el volumen de datos. Todos los datos existentes se pierden.

### Modo producción (base de datos vacía)

Para inicializar solo la estructura sin datos de prueba, usar `schema.sql`:

```bash
# Desde la máquina host (con el contenedor corriendo)
docker exec -i rdam-db mysql -uroot -p<password> < rdam-backend/src/main/resources/schema.sql

# O directamente con MySQL
mysql -h localhost -uroot -p rdam < rdam-backend/src/main/resources/schema.sql
```

Luego crear el primer usuario admin manualmente:

```sql
INSERT INTO users (email, password_hash, role) VALUES
('admin@santafe.gov.ar', '<bcrypt_hash>', 'admin');
```

Generar el hash BCrypt en [bcrypt-generator.com](https://bcrypt-generator.com/).

---

## Tecnologías

**Backend:** Java 21 · Spring Boot 3.2.3 · MySQL 8.0 · Spring Security · JWT · JavaMail

**Frontend:** React 18 · Vite · React Router · Axios

**Infraestructura:** Docker · Mailpit · PlusPagos Mock (Node.js)
