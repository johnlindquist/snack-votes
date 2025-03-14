# PostgreSQL Migration Guide

This guide outlines the steps to migrate the "snack-votes" project from SQLite to PostgreSQL using Vercel's Postgres database.

## Prerequisites

- A Vercel account with access to Vercel Postgres
- Your project deployed on Vercel
- PostgreSQL installed locally for testing (optional)

## Migration Steps

### 1. Provision a Vercel Postgres Database

1. In your Vercel project, go to the **Storage** tab
2. Click **Connect Database**
3. Choose to create a new PostgreSQL database
4. Follow the setup wizard to complete the provisioning

This will automatically set environment variables in your Vercel project:

- `POSTGRES_PRISMA_URL` - For Prisma connections
- `POSTGRES_URL_NON_POOLING` - For migrations and direct connections

### 2. Update Local Environment Variables

1. Update your `.env.local` file with the connection strings from Vercel:
   ```
   POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
   POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/dbname"
   ```

### 3. Create a New Migration for PostgreSQL

Run the migration script to create a new migration for PostgreSQL:

```bash
pnpm migrate:postgres
```

This will:

- Create a new migration in the `prisma/migrations` folder
- Apply the migration to your local database
- Generate the Prisma client

### 4. Deploy to Vercel

1. Commit your changes to Git
2. Push to your repository
3. Deploy to Vercel

Vercel will automatically apply the migrations to your PostgreSQL database.

### 5. Verify the Migration

1. Check your application on Vercel to ensure it's working correctly
2. Verify that data is being stored in the PostgreSQL database

## Troubleshooting

- If you encounter issues with the migration, check the Vercel deployment logs
- Make sure your connection strings are correctly set in your environment variables
- If needed, you can manually run migrations on Vercel using the Vercel CLI:
  ```bash
  vercel env pull
  npx prisma migrate deploy
  ```

## Data Migration (Optional)

If you need to migrate existing data from SQLite to PostgreSQL:

1. Export data from SQLite:

   ```bash
   sqlite3 prisma/dev.db .dump > sqlite_dump.sql
   ```

2. Use a tool like pgloader to import the data to PostgreSQL:
   ```bash
   pgloader sqlite:///prisma/dev.db postgresql://user:password@host:5432/dbname
   ```

Alternatively, you can write a custom script to read from SQLite and write to PostgreSQL.
