# Thème Association Solidaire

Thème Drupal moderne et responsive pour associations à but non lucratif dédiées à l'aide aux plus démunis.

## Caractéristiques

### Design
- **Palette de couleurs solidarité** : Bleu (#2c5f8d), Orange (#e67e22), Vert (#27ae60)
- **Responsive** : Mobile-first avec breakpoints tablette et desktop
- **Moderne** : Cards avec hover effects, animations au scroll, transitions fluides
- **Accessible** : Navigation au clavier, skip links, contraste WCAG AA

### Composants
- **Hero section** : Bannière d'accueil avec call-to-action
- **Cards** : Pour actualités, projets, témoignages
- **Statistiques d'impact** : Compteurs animés pour montrer l'impact de l'association
- **Formulaires** : Formulaire de don pré-stylisé
- **Badges et alertes** : Pour statuts et messages
- **Navigation** : Menu responsive avec burger mobile

### Régions disponibles
- `header` : En-tête du site (logo, menu principal)
- `hero` : Section hero pour pages d'accueil
- `primary_menu` : Menu principal de navigation
- `breadcrumb` : Fil d'Ariane
- `content` : Contenu principal
- `sidebar_first` : Barre latérale gauche
- `sidebar_second` : Barre latérale droite
- `footer_first`, `footer_second`, `footer_third` : 3 colonnes de footer
- `footer_bottom` : Pied de page copyright

## Installation

### 1. Activer le thème

Via Drush (dans le conteneur) :
```bash
docker compose exec drupal drush theme:enable association_theme -y
docker compose exec drupal drush config:set system.theme default association_theme -y
docker compose exec drupal drush cr
```

Via l'interface :
1. Aller dans **Apparence** (`/admin/appearance`)
2. Trouver "Association Solidaire"
3. Cliquer sur **Installer et définir par défaut**

### 2. Configuration du site

Configurer le nom et slogan :
```bash
docker compose exec drupal drush config:set system.site name "Nom de votre association" -y
docker compose exec drupal drush config:set system.site slogan "Votre mission en une phrase" -y
```

Ou via l'interface : **Configuration** → **Système** → **Informations du site** (`/admin/config/system/site-information`)

### 3. Personnalisation du logo

Le thème utilise un logo SVG par défaut. Pour le remplacer :

1. Via l'interface :
   - **Apparence** → **Paramètres** → **Association Solidaire** (`/admin/appearance/settings/association_theme`)
   - Décocher "Utiliser le logo fourni par le thème"
   - Téléverser votre logo personnalisé

2. Ou remplacer directement :
   ```bash
   # Remplacer images/logo.svg par votre logo
   ```

## Utilisation

### Page d'accueil type

Structure recommandée pour la page d'accueil :

1. **Hero Section** (région `hero`) :
   - Block de texte personnalisé avec titre + description
   - Bouton call-to-action vers dons ou bénévolat

2. **Statistiques d'impact** (région `content`) :
   - Créer un block custom avec HTML :
   ```html
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
   ```

3. **Actualités** (région `content`) :
   - Vue des derniers articles
   - Les cards sont automatiquement stylisées

4. **Call-to-action** (région `content`) :
   ```html
   <div class="cta-section">
     <h2>Rejoignez-nous</h2>
     <p>Ensemble, nous pouvons faire la différence</p>
     <a href="/association/checkout" class="btn btn-primary btn-large">Faire un don</a>
   </div>
   ```

### Types de contenu recommandés

Créer ces types de contenu pour une association :

1. **Actualités** (`article`) :
   - Titre
   - Image
   - Corps
   - Tags/Catégories

2. **Projets** (`project`) :
   - Titre
   - Image
   - Description
   - Statut (badge-success pour "Terminé", badge-info pour "En cours")
   - Montant nécessaire

3. **Témoignages** (`testimonial`) :
   - Citation
   - Photo de la personne
   - Nom
   - Rôle (bénéficiaire, bénévole, etc.)

### Classes CSS utiles

#### Boutons
```html
<a href="#" class="btn btn-primary">Bouton primaire</a>
<a href="#" class="btn btn-secondary">Bouton secondaire</a>
<a href="#" class="btn btn-accent">Bouton accent (don)</a>
<a href="#" class="btn btn-outline">Bouton outline</a>
<a href="#" class="btn btn-primary btn-large">Grand bouton</a>
```

#### Grilles
```html
<div class="grid-2">
  <div>Colonne 1</div>
  <div>Colonne 2</div>
</div>

<div class="grid-3">
  <div>Colonne 1</div>
  <div>Colonne 2</div>
  <div>Colonne 3</div>
</div>
```

#### Badges
```html
<span class="badge badge-success">Actif</span>
<span class="badge badge-info">En cours</span>
<span class="badge badge-warning">En attente</span>
```

#### Alertes
```html
<div class="alert alert-success">Opération réussie !</div>
<div class="alert alert-info">Information importante</div>
<div class="alert alert-warning">Attention</div>
<div class="alert alert-error">Erreur survenue</div>
```

### Intégration avec le module Payments

Le bouton "Payer ma cotisation" (du module `association_payments`) est automatiquement stylisé avec la classe `btn btn-primary`.

Pour personnaliser le formulaire de don :
```html
<div class="donation-form">
  <h2>Faire un don</h2>
  <!-- Formulaire Drupal ici -->
</div>
```

## Personnalisation avancée

### Modifier les couleurs

Éditer `css/variables.css` :
```css
:root {
  --color-primary: #VOTRE_COULEUR;
  --color-secondary: #VOTRE_COULEUR;
  --color-accent: #VOTRE_COULEUR;
}
```

### Ajouter des templates personnalisés

Créer un fichier dans `templates/` :
- `page--front.html.twig` : Page d'accueil uniquement
- `node--project.html.twig` : Nodes de type "project"
- `block--custom-block-id.html.twig` : Block spécifique

### Ajouter du CSS/JS personnalisé

1. Créer vos fichiers dans `css/` ou `js/`
2. Les déclarer dans `association_theme.libraries.yml`
3. Vider le cache : `drush cr`

## Compatibilité

- Drupal 10+
- Navigateurs modernes (Chrome, Firefox, Safari, Edge)
- Mobile, tablette, desktop
- Thème de base : `stable9`

## Support

Pour toute question ou personnalisation, consultez :
- Documentation Drupal Theming : https://www.drupal.org/docs/theming-drupal
- Documentation Twig : https://twig.symfony.com/doc/

## License

GPL-2.0+
