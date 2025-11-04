# Port Configuration

Quick reference for all services in the EarningLens monorepo.

## Development Ports

| Service | Port | URL | Directory |
|---------|------|-----|-----------|
| **Web App** | 3000 | http://localhost:3000 | `web/` |
| **Remotion Studio** | 8082 | http://localhost:8082 | `studio/` |
| **Database (Neon)** | 5432 | Remote (neon.tech) | - |

## Starting Services

### Web App (Next.js)
```bash
cd web
npm run dev
```
**Access at:** http://localhost:3000

### Remotion Studio (Video Editor)
```bash
cd studio
npm start
```
**Access at:** http://localhost:8082

### Both Services (Development)
```bash
# Terminal 1
cd web && npm run dev

# Terminal 2
cd studio && npm start
```

## Port Conflicts

If you see port conflicts:

**Check what's running:**
```bash
lsof -i :3000
lsof -i :8082
```

**Kill processes:**
```bash
# Kill specific port
lsof -ti:3000 | xargs kill -9
lsof -ti:8082 | xargs kill -9

# Or kill all Node processes
pkill -f "next dev"
pkill -f "remotion studio"
```

## Production

**Web (Vercel):**
- Port configured by Vercel
- Custom domain: earninglens.com

**Remotion (GPU Rendering):**
- Runs on sushi machine (192.168.1.101)
- CLI rendering (no studio needed)
- Output: `studio/out/`

## Configuration Files

**Web Port:**
- Next.js default: port 3000
- Configure via: `next dev --port 3000`

**Remotion Port:**
- Configured in: `studio/remotion.config.ts`
- Line: `Config.setStudioPort(8082);`

## Notes

- **Web App** runs on standard Next.js port (3000)
- **Remotion Studio** runs on port 8082 (Remotion convention)
- Both can run simultaneously without conflicts
- Sushi GPU machine may need different ports if accessed remotely

---

**Last Updated:** November 3, 2025
