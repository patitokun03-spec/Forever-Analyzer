# 🛠️ Guía de Instalación

Esta guía te explica paso a paso cómo configurar **WoW Forever Log Analyzer** en tu equipo local utilizando su arquitectura nativa en Python 3 y SQLite (sin dependencias externas).

## 📋 Requisitos Previos

1. **Python 3.10 o superior** - [Descargar aquí](https://www.python.org/downloads/)
2. **Git** - [Descargar aquí](https://git-scm.com/)

## 🔑 Paso 1: Consigue tus API Keys de WarcraftLogs

La aplicación utiliza la API oficial v2 (GraphQL) de WarcraftLogs para descargar los reportes.

1. Ve a [WarcraftLogs API Console](https://www.warcraftlogs.com/api/clients) e inicia sesión.
2. En el apartado "Create a new Client", asígnale un nombre (ej. `WoW Forever Analyzer`).
3. Copia el **Client ID** y el **Client Secret**.

## 💻 Paso 2: Clona e Inicializa el Proyecto

1. Abre tu terminal y clona el repositorio privado:
   ```bash
   git clone <URL_DE_TU_REPOSITORIO_PRIVADO>
   cd FOREVER
   ```
2. Genera la base de datos SQLite local (`forever.sqlite`) a partir del volcado limpio:
   ```bash
   python database/seed.py
   ```

## ⚙️ Paso 3: Configura tus API Keys

1. En la carpeta raíz del proyecto, copia `.env.example` a `.env`.
2. Abre `.env` y pega tus credenciales:
   ```env
   WCL_CLIENT_ID=pega_tu_client_id_aqui
   WCL_CLIENT_SECRET=pega_tu_client_secret_aqui
   PORT=3000
   ```

## 🚀 Paso 4: Arranca el Servidor

1. Ejecuta el servidor local:
   ```bash
   python server.py
   ```
   *(En Windows también puedes hacer doble clic en `INICIAR_APP.bat`, que inicializará la BD automáticamente si no existe).*
2. Abre `http://localhost:3000` en tu navegador.
