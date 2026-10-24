# Setup Guide

This guide explains how to set up and run Forever Analyzer locally using Python 3 and SQLite.

## Prerequisites

1. Python 3.10 or newer ([python.org](https://www.python.org/downloads/))
2. Git ([git-scm.com](https://git-scm.com/))
3. A Warcraft Logs account to generate API v2 client credentials ([warcraftlogs.com/api/clients](https://www.warcraftlogs.com/api/clients))

## Step 1: Clone the Repository

```bash
git clone https://github.com/patitokun03-spec/Forever-Analyzer.git
cd Forever-Analyzer
```

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env` in the project root:

```env
WCL_CLIENT_ID=your_client_id_here
WCL_CLIENT_SECRET=your_client_secret_here
PORT=3000
```

If you want to test the application offline without API credentials, you can leave those fields empty and load the built-in `demo` report from the search bar.

## Step 3: Initialize the SQLite Database

Generate `forever.sqlite` from the schema and catalog dump (`database/seed_data.sql`):

```bash
python database/seed.py
```

## Step 4: Start the Server

```bash
python server.py
```

On Windows, you can also double-click `start_server.bat`. Once running, open `http://localhost:3000` in your browser.
