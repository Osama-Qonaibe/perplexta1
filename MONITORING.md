# Monitoring Guide — Perplexta

## Key Metrics to Monitor

### 1. Server Health

- **Endpoint**: `GET /api/health`
- **Expected**: `{"status":"ok"}`
- **Alert if**: 5xx errors or response time > 2s

### 2. Database Connections

- **Check**: `server/db/index.ts` pool status
- **Alert if**: Connection errors or pool exhaustion

### 3. Error Rate

- **Log pattern**: `[ERROR]` in stdout
- **Alert if**: > 10 errors/minute

### 4. Response Time

- **Target**: < 500ms for API calls
- **Alert if**: P95 > 1s

### 5. Cache Hit Rate

- **Check**: `server/utils/cache.ts` hit/miss ratio
- **Target**: > 60% hit rate

## PM2 Commands

```bash
pm2 monit              # Real-time monitoring
pm2 logs --lines 100   # Last 100 log lines
pm2 describe perplexta # Detailed stats
```

## Log Patterns

- `[Cache]` — cache hits/misses
- `[DB]` — database queries
- `[ERROR]` — errors (check stack traces)
- `[CORS]` — blocked origins
