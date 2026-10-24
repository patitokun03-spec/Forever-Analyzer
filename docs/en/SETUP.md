# 🛠️ Setup Guide

This guide walks you through setting up **WoW Forever Log Analyzer** locally using its zero-dependency Python 3 + SQLite backend architecture.

## 📋 Prerequisites

1. **Python 3.10 or higher** - [Download here](https://www.python.org/downloads/)
2. **Git** - [Download here](https://git-scm.com/)

## 🔑 Step 1: Get your WarcraftLogs API Keys

The application uses the official WarcraftLogs v2 GraphQL API.

1. Go to the [WarcraftLogs API Console](https://www.warcraftlogs.com/api/clients) and log in.
2. Under "Create a new Client", give your client a name (e.g., `WoW Forever Analyzer`).
3. Copy your **Client ID** and **Client Secret**.

## 💻 Step 2: Clone and Initialize the Database

1. Clone the repository:
   ```bash
   git clone <YOUR_PRIVATE_REPO_URL>
   cd FOREVER
   ```
2. Build the local SQLite database (`forever.sqlite`) from the clean SQL seed:
   ```bash
   python database/seed.py
   ```

## ⚙️ Step 3: Configure your API Keys

1. Copy `.env.example` to `.env` in the root directory.
2. Add your WarcraftLogs credentials:
   ```env
   WCL_CLIENT_ID=paste_your_client_id_here
   WCL_CLIENT_SECRET=paste_your_client_secret_here
   PORT=3000
   ```

## 🚀 Step 4: Run the Server

1. Start the backend server:
   ```bash
   python server.py
   ```
   *(On Windows, you can also double-click `INICIAR_APP.bat`)*
2. Open `http://localhost:3000` in your browser.
