# Guide de migration Drupal → Odoo

## Différences principales

| Aspect | Drupal | Odoo |
|--------|--------|------|
| **Type** | CMS | ERP/CRM + Website Builder |
| **Thème** | PHP Twig templates | XML QWeb templates + Python |
| **Extensions** | Modules Drupal | Addons Odoo |
| **Base de données** | Drupal gère une DB | Odoo peut gérer plusieurs DB |
| **Utilisateurs** | Drupal users | res.partner (contacts) |
| **Paiements** | Modules contrib | Providers natifs ou API externe |

## Migration des contenus

### 1. Exporter depuis Drupal

```bash
# Exporter les nodes/pages
drush sqlq "SELECT nid, title, body_value FROM node__body JOIN node_field_data USING(nid)" --extra=--csv > drupal_pages.csv

# Exporter les users
drush sqlq "SELECT uid, name, mail FROM users_field_data WHERE uid > 0" --extra=--csv > drupal_users.csv
```

### 2. Importer dans Odoo

**Pages/Articles** :
1. Website → Pages → Import
2. Mapper: `title` → Nom de page, `body_value` → Contenu HTML

**Membres/Contacts** :
1. Contacts → Import
2. Mapper: `name` → Nom, `mail` → Email
3. Cocher "Est un membre" si applicable

### 3. Rediriger les anciennes URLs

Créer un module Odoo `association_redirects`:

```python
from odoo import http
from odoo.http import request

class DrupalRedirects(http.Controller):
    @http.route('/node/<int:nid>', auth='public', website=True)
    def redirect_node(self, nid, **kwargs):
        # Mapper ancien nid Drupal vers nouvelle page Odoo
        mapping = {
            1: '/page/about',
            2: '/page/projects',
            # ...
        }
        new_url = mapping.get(nid, '/')
        return request.redirect(new_url, code=301)
```

## Équivalences fonctionnelles

### Modules Drupal → Addons Odoo

| Drupal | Odoo |
|--------|------|
| User (core) | Contacts (`res.partner`) |
| Node (core) | Website Pages |
| Views | List/Kanban/Form views (natif) |
| Webform | Website Form Builder |
| Commerce | eCommerce (`website_sale`) |
| Rules | Automated Actions (`base_automation`) |
| Pathauto | SEO (`website_seo`) |

### Thème Drupal → Thème Odoo

**Fichiers Drupal** → **Fichiers Odoo**:
- `*.info.yml` → `__manifest__.py`
- `*.theme` (PHP) → `__init__.py` ou hooks Python
- `templates/*.html.twig` → `views/*.xml` (QWeb)
- `css/*.css` → `static/src/css/*.css`
- `js/*.js` → `static/src/js/*.js`

**Exemple de conversion template**:

Drupal Twig:
```twig
{% if logo %}
  <img src="{{ logo }}" alt="{{ site_name }}">
{% endif %}
```

Odoo QWeb:
```xml
<img t-att-src="request.website.logo_url" t-att-alt="request.website.name"/>
```

## Checklist de migration

- [ ] Exporter contenus Drupal (nodes, users, taxonomies)
- [ ] Installer Odoo et modules de base
- [ ] Créer le thème Odoo (reprendre CSS/assets)
- [ ] Importer contenus via CSV ou script Python
- [ ] Configurer les redirections 301
- [ ] Tester les formulaires de contact/don
- [ ] Configurer les paiements (providers ou API)
- [ ] Migrer les emails/templates
- [ ] Former les admins sur Odoo
- [ ] Basculer le DNS

## Ressources

- Migration Odoo officielle: https://www.odoo.com/documentation/17.0/developer/howtos/migrate.html
- Odoo website builder: https://www.odoo.com/page/website-builder
- QWeb templates: https://www.odoo.com/documentation/17.0/developer/reference/frontend/qweb.html
