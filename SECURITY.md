# Guide de sécurisation des containers

## Modifications appliquées

### 1. ✅ Docker Compose
- **Supprimé** : `version: "3.9"` (obsolète)
- **Ajouté pour tous les services** :
  - `restart: unless-stopped` : Redémarrage automatique
  - `security_opt: no-new-privileges:true` : Empêche l'escalade de privilèges

### 2. ✅ Nginx (odoo-web)
- **Read-only filesystem** : `read_only: true`
- **Tmpfs** pour répertoires temporaires : `/var/cache/nginx`, `/var/run`

### 3. ✅ Traefik Dashboard
- **Sécurisé** : `--api.insecure=false`
- **Auth basique** : Middleware `dashboard-auth` (user: admin)
- **Port localhost seulement** : `127.0.0.1:8888` au lieu de `0.0.0.0:8888`
- **Logs d'accès** : `--accesslog=true`

### 4. ✅ Middlewares Traefik (dynamic.yml)
- **Rate limiting** : 100 req/s, burst 50
- **Security headers** renforcés :
  - X-Robots-Tag, Server header masqué
  - Permissions-Policy restrictive
- **Compression** : Gzip activé
- **Auth dashboard** : Mot de passe hashé bcrypt

---

## Actions recommandées pour production

### Secrets Docker (au lieu de .env)

```powershell
# Créer des secrets
echo "votre_password_odoo" | docker secret create odoo_db_password -
echo "votre_password_payments" | docker secret create payments_db_password -

# Modifier docker-compose.yml
services:
  odoo-db:
    secrets:
      - odoo_db_password
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/odoo_db_password

secrets:
  odoo_db_password:
    external: true
```

### SSL/TLS avec Let's Encrypt

1. **Définir domaines réels** dans `.env`:
```env
ODOO_DOMAIN=www.votreassociation.org
ACME_EMAIL=admin@votreassociation.org
```

2. **Activer SSL redirect** dans `traefik/dynamic.yml`:
```yaml
sslRedirect: true
forceSTSHeader: true
```

3. **Ajouter labels SSL aux services**:
```yaml
labels:
  - "traefik.http.routers.odoo.tls=true"
  - "traefik.http.routers.odoo.tls.certresolver=myresolver"
```

### Firewall réseau

**Docker networks isolation déjà en place** :
- `association_web` : Services exposés (Traefik, odoo-web)
- `association_internal` : Services internes (DB, Odoo backend)

**Renforcer avec UFW (Linux)** :
```bash
# Autoriser seulement ports nécessaires
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 5432/tcp  # PostgreSQL pas exposé publiquement
ufw deny 8069/tcp  # Odoo direct pas exposé
ufw enable
```

**Windows Firewall** :
```powershell
# Bloquer accès direct aux DB
New-NetFirewallRule -DisplayName "Block PostgreSQL" -Direction Inbound -LocalPort 5432,5433 -Protocol TCP -Action Block
```

### Scanner de vulnérabilités

```powershell
# Trivy - scanner d'images Docker
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image odoo:17.0
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image postgres:16
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image nginx:stable
```

### Limites de ressources

Ajouter dans `docker-compose.yml`:

```yaml
services:
  odoo:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
  
  odoo-db:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
```

### Monitoring et alertes

**Prometheus + Grafana** :
```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

**Loki pour logs** :
```yaml
services:
  loki:
    image: grafana/loki
    command: -config.file=/etc/loki/local-config.yaml
```

---

## Checklist sécurité production

- [x] Restart policies configurées
- [x] No-new-privileges activé
- [x] Traefik dashboard protégé par auth
- [x] Rate limiting en place
- [x] Security headers renforcés
- [ ] Secrets Docker au lieu de .env
- [ ] SSL/TLS Let's Encrypt activé
- [ ] Firewall configuré (ports restreints)
- [ ] Scan régulier des vulnérabilités (Trivy)
- [ ] Limites de ressources définies
- [ ] Monitoring actif (Prometheus/Grafana)
- [ ] Backups automatisés et testés
- [ ] Logs centralisés (ELK/Loki)
- [ ] Fail2ban pour bannir IPs malveillantes
- [ ] Rotation des mots de passe planifiée

---

## Changer le mot de passe dashboard Traefik

```powershell
# Installer htpasswd (Apache Utils for Windows ou via WSL)
# Générer nouveau hash
htpasswd -nbB admin VotreNouveauMotDePasse

# Copier le résultat dans traefik/dynamic.yml
# Doubler les $ : $ devient $$
# Exemple: $2y$05$abc devient $$2y$$05$$abc
```

---

## Tester la sécurité

```powershell
# Test headers HTTP
curl.exe -I http://localhost:8080

# Test SSL (en prod)
curl.exe -I https://www.votreassociation.org

# Scanner SSL
docker run --rm -it nmap/nmap -p 443 --script ssl-enum-ciphers votreassociation.org
```

---

## Support

Documentation Traefik : https://doc.traefik.io/traefik/
Best practices Docker : https://docs.docker.com/develop/security-best-practices/
