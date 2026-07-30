<p align="center">
  <img src="assets/logo_combase.png" alt="COMBASE Logo" width="220" />
</p>

<h1 align="center">COMBASE — Terra Ecosystem Database Engine</h1>

<p align="center">
  <strong>Motor de Base de Datos Relacional y Documental Transaccional, Serverless y con Time-Travel a Coste $0</strong>
</p>

<p align="center">
  <a href="#-visión-y-filosofía">Visión</a> •
  <a href="#-almacenamiento-en-combase-storage">Almacenamiento</a> •
  <a href="#-zero-copy-branching--time-travel">Branching & Time-Travel</a> •
  <a href="#-instalación-y-cli">CLI & Uso</a> •
  <a href="#-sql-studio--consola-web">SQL Studio</a> •
  <a href="#-puente-multicloud-provider-bridge">Multicloud Bridge</a> •
  <a href="LICENSE">Licencia MIT</a>
</p>

---

## 🌐 Visión y Filosofía

**COMBASE** es el titán de persistencia de datos del **Ecosistema Terra**. Proporciona un motor de base de datos relacional (ANSI SQL) y documental transaccional de coste $0, eliminando por completo la necesidad de mantener instancias persistentes en RDS, Aurora, DynamoDB o Supabase.

Su premisa inquebrantable es: **Persistencia transaccional libre de mantenimiento y $0 facturas recurrentes**.

---

## 💾 Almacenamiento en `.combase-storage` & Compatibilidad

> [!IMPORTANT]
> **Almacenamiento por Defecto**: Todas las bases de datos, esquemas y tablas se persisten en el repositorio protegido **`.combase-storage`** de tu cuenta de GitHub. Cada modificación o transacción atómica genera un **checkpoint inmutable (commit)** en Git.

### 🔌 Compatibilidad Extendida:
- **Rolla-Balls**: Sincronización nativa con el motor de almacenamiento de objetos **Rolla** (`rollaBucket`).
- **S3 / Parquet Checkpoints**: Exportación e ingesta automática a cualquier bucket compatible con AWS S3.

---

## 🌿 Zero-Copy Branching & ⏳ Time-Travel Querying

1. **Zero-Copy Database Branching**: Crea ramas independientes de tu base de datos en 1 milisegundo (`combase branch create staging`) para probar consultas o cambios de esquema de forma segura sin afectar a producción.
2. **Time-Travel Querying**: Consulta el estado exacto de tu base de datos en cualquier momento del pasado (`SELECT * FROM users AT COMMIT 'v1.0.4'`) o realiza **Rollback en 1 Clic** a cualquier checkpoint anterior.

---

## 🛠️ Instalación y Uso de CLI

### Instalación del SDK
```bash
npm install terra-combase
```

### Ejecución de CLI con `npx`
```bash
npx combase <comando>
```

### 🚀 Comandos Principales

| Comando | Descripción |
| :--- | :--- |
| `npx combase init` | Inicializa el archivo de configuración `combase.config.json`. |
| `npx combase studio` | Lanza el entorno web local **COMBASE SQL Studio** en `http://localhost:3722`. |
| `npx combase query "SQL"` | Ejecuta consultas SQL directamente desde la terminal. |
| `npx combase branch ls` | Lista las ramas de base de datos activas. |
| `npx combase branch create <nombre>` | Crea una nueva rama de base de datos. |
| `npx combase history` | Muestra el historial de checkpoints (commits) de Time-Travel. |
| `npx combase export [archivo.sql]` | Exporta la base de datos completa como volcado SQL. |
| `npx combase import <archivo.sql>` | Importa un volcado SQL a la base de datos. |

---

## 🎛️ SQL Studio & Consola Web
Accede al entorno de desarrollo visual **COMBASE SQL Studio** desplegado 24/7 en:  
👉 **[https://amglogicalis.github.io/combase-repo-public/](https://amglogicalis.github.io/combase-repo-public/)**

### Características de SQL Studio:
- Editor SQL con resaltado de sintaxis, snippets rápidos y ejecución en tiempo real.
- Inspector de Tablas, Estructura de Columnas e Indicadores de Rendimiento.
- Timeline de Time-Travel con visualización de Checkpoints y Rollback en 1 clic.
- Gestor de Ramas de Base de Datos (**Zero-Copy Branching**).
- Exportador/Importador visual de volcados SQL.

---

## 🌉 Puente Multicloud (Provider Bridge)

COMBASE funciona de manera 100% autónoma a $0 coste sobre el motor de GitHub, pero permite replicar datos con 1 clic hacia otros proveedores tradicionales:
- **PostgreSQL / Supabase**
- **AWS DynamoDB**
- **MySQL / MariaDB**
- **SQLite**
