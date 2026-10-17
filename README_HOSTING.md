# Run and share the Hospital Management System

This guide gets the complete app running with Docker. Start with the quick start to use it on your computer. Then, if you want, follow one of the sharing options to open it on your phone or make it available at a domain.

[Back to the project README](README.md)

## Before you start

- Install and open [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/) on Windows. On a Linux server, install Docker Engine and the Compose plugin using [Docker's install guide](https://docs.docker.com/compose/install/).
- Download or clone this repository, then open PowerShell in the project folder (the folder containing `docker-compose.yml`).
- Keep the computer or server on while you use or share the app.

Check that Docker is ready:

```powershell
docker --version
docker compose version
```

## Quick start

### 1. Create your local settings file

Run these commands from the project folder:

```powershell
Copy-Item deploy\hosting.env.example .env
notepad .env
```

In Notepad, replace each `replace-with-...` value with a different, long random secret, then save and close the file. For a temporary link, leave `CLOUDFLARE_TUNNEL_TOKEN` blank.

Keep `.env` private. It contains database passwords and the app's signing key; add a tunnel token only if you set up a stable hostname. Do not commit or share this file.

### 2. Build and start the app

```powershell
docker compose up --build -d
docker compose ps
```

The first build may take a few minutes. Wait until the `db` service is healthy and `app` is running, then open:

- App: <http://localhost:8081>
- Health check: <http://localhost:8081/api/health>

The database and demo records are initialized the first time the database volume is created. The volume keeps your data when you stop or rebuild the containers.

## Open the app on your phone

### Option A: Temporary link (no domain)

This is the easiest option for a demo. Start a Cloudflare Quick Tunnel:

```powershell
docker compose --profile tunnel up -d
docker compose logs -f cloudflared
```

Wait for the log to show a URL ending in `.trycloudflare.com`, then open that URL on your phone. Press **Ctrl+C** to stop watching the logs; the tunnel continues running. The link may change when restarted, and works only while the host computer and Docker are running. Cloudflare describes Quick Tunnels as a development/testing option in its [Quick Tunnel guide](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

### Option B: Stable domain

Use this if you have a domain managed by Cloudflare and want a stable hostname.

1. Create a remotely managed Tunnel in the [Cloudflare dashboard](https://developers.cloudflare.com/tunnel/get-started/) and copy its connector token. Keep the token private; anyone who has it can run the tunnel. See Cloudflare's [token guidance](https://developers.cloudflare.com/tunnel/reference/tunnel-tokens/).
2. In the Tunnel's **Published application** settings, add your hostname (for example, `carepoint.example.com`) and set its service URL to `http://app:8080`.
3. In the project folder, edit `.env` and set `CLOUDFLARE_TUNNEL_TOKEN` to the token you copied.
4. Start the named tunnel:

   ```powershell
   docker compose --profile named-tunnel up -d
   docker compose ps
   docker compose logs -f cloudflared_named
   ```

5. Open your hostname (for example, `https://carepoint.example.com`) on your phone.

Do not start the `tunnel` profile as well; that profile creates a separate temporary URL.

## Common tasks

View service status and logs:

```powershell
docker compose ps
docker compose logs --tail 100 app
docker compose logs --tail 100 db
```

Update the app after changing or downloading newer code:

```powershell
git pull
docker compose up --build -d app
```

Stop the services without deleting database records:

```powershell
docker compose down
```

Start the local app again with `docker compose up -d`. For a tunnel, also start the profile you chose above. **Do not run `docker compose down -v` unless you intend to delete all stored accounts and appointments.**

## Troubleshooting

- **Docker cannot connect:** Open Docker Desktop and wait until it reports that Docker is running.
- **The app does not open:** Run `docker compose ps` and `docker compose logs --tail 100 app`. If the database is still starting, check `docker compose logs --tail 100 db`.
- **Port 8081 is already in use:** Change `APP_PORT=8081` in `.env` to another free port, then restart with `docker compose up -d`.
- **Your phone cannot open `localhost`:** `localhost` on the phone means the phone itself. Use the temporary tunnel URL or your stable hostname instead.
- **No temporary URL appears:** Run `docker compose logs -f cloudflared` and wait for the `.trycloudflare.com` address.
- **Stable hostname shows an error:** Check the Tunnel status in Cloudflare and confirm the Published application service URL is exactly `http://app:8080`.
- **You changed frontend code but still see the old page:** Rebuild the app with `docker compose up --build -d app`.

## Demo accounts and safety

| Role | Username | Password |
|------|----------|----------|
| Doctor | `dr.aarav` (Dr. Aarav Sharma) | `password123` |
| Doctor | `dr.priya` (Dr. Priya Iyer) | `password123` |
| Patient | `pulkit` | `password123` |
| Patient | `swastika` | `password123` |
| Patient | `srishti` | `password123` |

Patients can also create an account using **Create patient account** on the sign-in page.

This is an educational demo with public demo logins, not a production service. Do not enter real patient or other sensitive information into an instance shared publicly.
