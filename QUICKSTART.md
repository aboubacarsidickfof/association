# Guide de démarrage rapide - Association Solidaire

## Étape 1 : Installation de Drupal

Si Drupal n'est pas encore installé, visitez http://drupal.localhost et suivez l'assistant :

1. **Langue** : Français
2. **Profil d'installation** : Standard
3. **Base de données** :
   - Type : PostgreSQL
   - Nom : `association_db`
   - Utilisateur : `association`
   - Mot de passe : `association_pass` (voir `.env`)
   - Host : `drupal-db`
   - Port : `5432`

4. **Informations du site** :
   - Nom : `Association Solidaire`
   - Email : Votre email
   - Slogan : `Ensemble pour aider les plus démunis`
   - Compte admin : Créez vos identifiants

## Étape 2 : Activation du thème

### Option A : Script automatique (recommandé)
```powershell
docker compose exec drupal bash /var/www/html/themes/custom/association_theme/install.sh
```

### Option B : Manuel via Drush
```powershell
docker compose exec drupal drush theme:enable association_theme -y
docker compose exec drupal drush config:set system.theme default association_theme -y
docker compose exec drupal drush cr
```

### Option C : Via l'interface web
1. Aller sur http://drupal.localhost/admin/appearance
2. Chercher "Association Solidaire"
3. Cliquer sur **Installer et définir par défaut**

## Étape 3 : Activation du module de paiement

```powershell
docker compose exec drupal drush en association_payments -y
docker compose exec drupal drush cr
```

Configuration : http://drupal.localhost/admin/config/association/payments
- Payment API URL : `http://payment-api:3000`
- Provider : Stripe (ou autre selon vos clés API)
- Montant : 2000 (20€ en centimes)
- Webhook token : `dev_secret_token`

## Étape 4 : Créer le contenu de la page d'accueil

### 4.1 Définir la page d'accueil
1. **Configuration** → **Système** → **Informations du site**
2. URL : `/node/1` (ou créer une page dédiée)

### 4.2 Créer des blocs de contenu

#### Hero Section
1. **Structure** → **Bibliothèque de blocs** → **Ajouter un bloc de contenu**
2. Type : Basic
3. Description : `Hero Section Accueil`
4. Corps (HTML) :
```html
<h1>Ensemble, changeons des vies</h1>
<p>Notre association aide les personnes en situation de précarité à retrouver dignité et espoir.</p>
<div style="margin-top: 2rem;">
  <a href="/association/checkout" class="btn btn-accent btn-large">Faire un don</a>
  <a href="/user/register" class="btn btn-outline btn-large" style="margin-left: 1rem;">Devenir membre</a>
</div>
```

5. **Structure** → **Mise en page des blocs**
6. Sélectionner "Association Solidaire"
7. Dans la région **Hero Section**, cliquer "Placer un bloc"
8. Chercher "Hero Section Accueil" et le placer

#### Statistiques d'impact
Créer un nouveau bloc avec ce contenu :
```html
<div class="section section--gray text-center">
  <div class="container">
    <h2>Notre impact en 2024</h2>
    <div class="impact-stats">
      <div class="stat-item">
        <span class="stat-number">1500</span>
        <span class="stat-label">Personnes aidées</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">250</span>
        <span class="stat-label">Bénévoles actifs</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">50</span>
        <span class="stat-label">Projets réalisés</span>
      </div>
    </div>
  </div>
</div>
```
Placer dans région **Content** (en premier)

#### Footer
Créer 3 blocs pour les 3 colonnes du footer (voir `EXAMPLES.md`)

## Étape 5 : Créer les types de contenu

### Actualités (utiliser le type Article existant)
1. **Structure** → **Types de contenu** → **Article** → **Gérer les champs**
2. Ajouter un champ Image si absent : `field_image`

### Créer quelques articles de test
1. **Contenu** → **Ajouter du contenu** → **Article**
2. Titre : `Distribution de repas chauds : 200 familles aidées`
3. Corps : Texte de l'actualité
4. Image : Uploader une photo

## Étape 6 : Configuration du menu principal

1. **Structure** → **Menus** → **Menu principal**
2. Ajouter ces liens :
   - Accueil → `/`
   - Nos actions → `/nos-actions`
   - Actualités → `/actualites`
   - Faire un don → `/association/checkout`
   - Contact → `/contact`

## Étape 7 : Configurer le logo

### Option 1 : Utiliser le logo par défaut
Le thème inclut un logo SVG solidaire par défaut.

### Option 2 : Uploader votre logo
1. **Apparence** → **Paramètres** → **Association Solidaire**
2. Décocher "Utiliser le logo fourni par le thème"
3. Téléverser votre logo (PNG/SVG recommandé, max 200px hauteur)

## Étape 8 : Tester les paiements

### Prérequis
Configurer les clés API dans `.env` :
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Redémarrer le service :
```powershell
docker compose restart payment-api
```

### Test
1. Se connecter avec un compte non-membre
2. Le bouton "Payer la cotisation" apparaît automatiquement
3. Cliquer dessus → redirection vers Stripe Checkout
4. Utiliser carte de test : `4242 4242 4242 4242`, exp future, CVC 123
5. Après paiement → rôle "member" automatiquement accordé

## Commandes utiles

```powershell
# Vider le cache Drupal
docker compose exec drupal drush cr

# Lister les thèmes disponibles
docker compose exec drupal drush theme:list

# Exporter la configuration
docker compose exec drupal drush config:export

# Importer la configuration
docker compose exec drupal drush config:import

# Créer un compte admin
docker compose exec drupal drush user:create admin --mail="admin@example.com" --password="password"
docker compose exec drupal drush user:role:add administrator admin

# Voir les logs
docker compose logs -f drupal
docker compose logs -f drupal-nginx
```

## Personnalisation

### Modifier les couleurs
Éditer `drupal-modules/custom/association_theme/css/variables.css` :
```css
--color-primary: #VotreCouleur;
```
Puis vider le cache.

### Ajouter des pages personnalisées
Consulter `drupal-modules/custom/association_theme/EXAMPLES.md` pour des exemples HTML complets.

## Problèmes courants

### Le thème ne s'affiche pas
```powershell
docker compose exec drupal drush cr
docker compose restart drupal drupal-nginx
```

### Les styles ne s'appliquent pas
1. Vider le cache Drupal
2. Vider le cache du navigateur (Ctrl+Shift+R)

### Module de paiement introuvable
```powershell
docker compose exec drupal drush en association_payments -y
```

## Support

- Documentation thème : `drupal-modules/custom/association_theme/README.md`
- Exemples de contenu : `drupal-modules/custom/association_theme/EXAMPLES.md`
- Documentation mail : `MAIL_SETUP.md`
- README général : `README.md`
