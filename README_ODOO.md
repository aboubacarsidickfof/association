# Association Solidaire - Migration Odoo

## Vue d'ensemble

Cette plateforme Odoo 17 pour association à but non lucratif intègre:
- **Odoo 17** : ERP/CRM complet pour gestion des membres, dons, projets
- **Thème personnalisé** : Design moderne "Association Solidaire" (bleu/orange/vert)
- **Payment API** : Service Node.js pour Stripe, Flutterwave, GoCardless
- **PostgreSQL 16** : Bases de données Odoo + Paiements
- **Traefik** : Reverse proxy avec SSL automatique
- **pgAdmin** : Interface de gestion PostgreSQL
- **Axigen Mail** : Serveur email complet (SMTP/IMAP/POP3)
- **Keycloak** : Authentification centralisée (optionnel)

---

## Démarrage rapide

### 1. Configuration initiale

```powershell
# Cloner le dépôt
git clone https://github.com/aboubacarsidickfof/association.git
cd association

# Copier et adapter l'environnement
Copy-Item .env.example .env
# Éditer .env avec vos valeurs (domaines, mots de passe)
```

### 2. Lancer la stack

```powershell
# Créer le fichier acme.json pour Traefik
New-Item -ItemType File -Path traefik/acme.json -Force
icacls traefik/acme.json /reset
icacls traefik/acme.json /inheritance:r
icacls traefik/acme.json /grant:r "${env:USERNAME}:(R,W)"

# Démarrer les services
docker compose up -d

# Vérifier les logs
docker compose logs -f odoo
```

### 3. Configuration Odoo

1. **Première connexion** : http://localhost:8080 ou http://odoo.localhost
   - Créer une base de données (nom: `association_db`)
   - Langue: Français
   - Démo: Non (sauf si besoin de test)
   - Email admin + mot de passe

2. **Installer les modules**
   - Apps → Mise à jour de la liste des apps
   - Chercher "Website", "eCommerce", "CRM", "Comptabilité"
   - Installer selon vos besoins

3. **Activer le thème**
   - Apps → Chercher "Association Solidaire Theme"
   - Installer
   - Website → Configuration → Settings → Thème → Choisir "Association Solidaire"

---

## Structure du thème Odoo

### Fichiers principaux

```
odoo-custom-addons/association_theme/
├── __manifest__.py              # Déclaration du module
├── __init__.py                  # Init Python
├── static/src/
│   ├── css/
│   │   ├── variables.css        # Couleurs, espacements
│   │   ├── reset.css            # Normalisation
│   │   ├── layout.css           # En-tête, footer, grille
│   │   ├── components.css       # Boutons, cards, formulaires
│   │   └── responsive.css       # Mobile/tablette
│   └── js/
│       └── main.js              # Menu mobile, scroll effects
└── views/
    ├── website_templates.xml    # Header, footer, hero
    ├── snippets.xml             # Blocs réutilisables (CTA, projets)
    └── portal_templates.xml     # Espace membre
```

### Palette de couleurs

- **Primaire** : `#2c5f8d` (bleu solidarité)
- **Secondaire** : `#e67e22` (orange chaleureux)
- **Accent** : `#27ae60` (vert espoir)

---

## Configuration des paiements

### Option A: Utiliser les providers Odoo natifs

1. **Apps** → Installer "Payment Providers"
2. **Website** → Configuration → Payment Providers
3. Activer Stripe, PayPal, etc.
4. Ajouter vos clés API

### Option B: Utiliser le Payment API (multi-provider)

Le service Node.js payment-api supporte:
- **Stripe** : Checkout + webhooks
- **Flutterwave** : Mobile Money (Afrique)
- **GoCardless** : Prélèvements SEPA

**Configuration** :
1. Éditer `.env` avec vos clés API
2. Créer un endpoint Odoo pour recevoir les webhooks:
   - Créer un contrôleur HTTP dans un module custom
   - URL: `https://votre-domaine.org/webhook/subscription`
   - Définir `ODOO_WEBHOOK_URL` et `ODOO_WEBHOOK_TOKEN` dans `.env`

**Exemple de contrôleur Odoo** (`controllers/webhook.py`):

```python
from odoo import http
from odoo.http import request

class SubscriptionWebhook(http.Controller):
    @http.route('/webhook/subscription', type='json', auth='none', methods=['POST'], csrf=False)
    def subscription_webhook(self):
        token = request.httprequest.headers.get('X-Association-Token')
        if token != request.env['ir.config_parameter'].sudo().get_param('association.webhook_token'):
            return {'error': 'Unauthorized'}, 401
        
        data = request.jsonrequest
        email = data.get('email')
        status = data.get('status')
        
        # Activer le membre
        partner = request.env['res.partner'].sudo().search([('email', '=', email)], limit=1)
        if partner and status == 'active':
            partner.write({'membership_state': 'paid'})
        
        return {'status': 'ok'}
```

---

## Personnalisation du thème

### Modifier les couleurs

Éditer `odoo-custom-addons/association_theme/static/src/css/variables.css`:

```css
:root {
  --color-primary: #2c5f8d;      /* Votre bleu */
  --color-secondary: #e67e22;    /* Votre orange */
  --color-accent: #27ae60;       /* Votre vert */
}
```

### Ajouter un snippet (bloc)

1. Créer le template dans `views/snippets.xml`
2. Enregistrer dans le menu snippet avec `<xpath expr="//div[@id='snippet_structure']">`
3. Rafraîchir Odoo (mode dev) ou redémarrer

### Changer le header/footer

Modifier `views/website_templates.xml`:
- Template `header_custom` pour l'en-tête
- Template `footer_custom` pour le pied de page

---

## Services exposés

| Service | Port local | Domaine Traefik | Description |
|---------|------------|-----------------|-------------|
| Odoo | 8080 | ${ODOO_DOMAIN} | Interface Odoo principale |
| Payment API | 3000 | ${API_DOMAIN} | API de paiements |
| Keycloak | 8081 | ${AUTH_DOMAIN} | SSO (optionnel) |
| pgAdmin | 5050 | ${PGADMIN_DOMAIN} | Admin PostgreSQL |
| Mail WebAdmin | 9000 | ${MAILADMIN_DOMAIN} | Admin Axigen |
| Webmail | 8000 | ${WEBMAIL_DOMAIN} | Webmail Axigen |
| Traefik Dashboard | 8888 | - | Monitoring Traefik |

---

## Gestion des membres avec Odoo

### Créer un champ "Membre actif"

1. **Paramètres** → Technique → Modèles de base de données
2. Chercher `res.partner`
3. Ajouter un champ booléen `x_is_member`
4. Utiliser ce champ pour filtrer les membres dans les vues

### Automatiser les cotisations

1. Installer le module **Membership** (`membership`)
2. Créer des produits "Cotisation mensuelle", "Cotisation annuelle"
3. Lier aux abonnements via eCommerce

---

## Production

### Sécurité

- [ ] Changer tous les mots de passe dans `.env`
- [ ] Activer HTTPS (Traefik ACME) : renseigner `ACME_EMAIL`
- [ ] Mettre Traefik dashboard en mode sécurisé (`--api.insecure=false`)
- [ ] Utiliser des secrets Docker au lieu de `.env` (optionnel)

### Performance

- [ ] Activer le mode worker Odoo (plusieurs processus)
- [ ] Configurer Redis pour les sessions
- [ ] Configurer un CDN pour les assets statiques

### Backups

```powershell
# Backup BDD Odoo
docker compose exec odoo-db pg_dump -U odoo postgres > backup_odoo_$(Get-Date -Format 'yyyyMMdd').sql

# Backup filestore Odoo
docker compose exec odoo tar czf /tmp/filestore.tar.gz /var/lib/odoo
docker compose cp odoo:/tmp/filestore.tar.gz ./backup_filestore_$(Get-Date -Format 'yyyyMMdd').tar.gz
```

---

## Dépannage

### Odoo ne démarre pas

```powershell
# Vérifier les logs
docker compose logs odoo

# Erreur de connexion DB: vérifier ODOO_DB_USER/PASSWORD dans .env
# Erreur de permissions: vérifier le volume odoo-data
docker volume inspect association_odoo-data
```

### Le thème n'apparaît pas

```powershell
# Mode dev pour forcer le rechargement
docker compose exec odoo odoo --dev=all

# Mettre à jour la liste des apps dans Odoo UI
# Apps → Mise à jour de la liste des apps
```

### CSS/JS ne se charge pas

1. Vider le cache du navigateur
2. Odoo → Paramètres → Activer le mode développeur
3. Website → Configuration → Settings → Rebuild Assets

---

## Contribuer

1. Fork le dépôt
2. Créer une branche (`git checkout -b feature/amelioration`)
3. Commit (`git commit -m 'Ajout fonctionnalité X'`)
4. Push (`git push origin feature/amelioration`)
5. Pull Request

---

## Licence

LGPL-3 (pour le thème Odoo, compatible avec Odoo Community)
MIT (pour Payment API et config Docker)

---

## Support

- Documentation Odoo: https://www.odoo.com/documentation/17.0/
- Repo GitHub: https://github.com/aboubacarsidickfof/association
- Issues: https://github.com/aboubacarsidickfof/association/issues
