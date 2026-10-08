# Rollback Plan — Perplexta

## Scenario: Bad deployment detected

### Step 1: Stop current deployment

```bash
pm2 stop perplexta
pm2 delete perplexta
```

### Step 2: Restore previous code

```bash
git checkout <previous-commit-hash>
npm install --production
npm run build
```

### Step 3: Restore database (if migrations broke)

```bash
# If you have backup from migrate_and_verify.ts:
psql $DATABASE_URL < backups/backup_<timestamp>.sql

# Or run rollback script:
npx ts-node server/scripts/rollback_migration.ts
```

### Step 4: Restart

```bash
pm2 start ecosystem.config.cjs --env production
pm2 logs --lines 100
```

## Emergency Contacts

- DevOps: @Osama-Qonaibe
- Database: Check `server/db/migrations/` for last known good state
