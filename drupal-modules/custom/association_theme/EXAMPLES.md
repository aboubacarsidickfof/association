# Exemples de contenu pour Association Solidaire

## Contenu HTML pour blocks personnalisés

### 1. Block Hero Section (région: hero)

```html
<h1>Ensemble, changeons des vies</h1>
<p>Notre association aide les personnes en situation de précarité à retrouver dignité et espoir. Chaque geste compte.</p>
<div style="margin-top: 2rem;">
  <a href="/association/checkout" class="btn btn-accent btn-large">Faire un don</a>
  <a href="/devenir-benevole" class="btn btn-outline btn-large" style="margin-left: 1rem;">Devenir bénévole</a>
</div>
```

### 2. Block Statistiques d'impact (région: content)

```html
<div class="section section--gray text-center">
  <div class="container">
    <h2>Notre impact en 2024</h2>
    <p style="font-size: 1.125rem; color: #7f8c8d; margin-bottom: 3rem;">
      Des chiffres qui témoignent de notre engagement quotidien
    </p>
    
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
      <div class="stat-item">
        <span class="stat-number">95</span>
        <span class="stat-label">% Satisfaction</span>
      </div>
    </div>
  </div>
</div>
```

### 3. Block Call-to-Action Don (région: content)

```html
<div class="cta-section">
  <h2>Votre soutien fait la différence</h2>
  <p>Avec 20€, vous offrez un repas chaud à 5 familles. Avec 50€, vous financez un atelier d'insertion professionnelle.</p>
  <a href="/association/checkout" class="btn btn-primary btn-large">Je fais un don maintenant</a>
</div>
```

### 4. Block Nos actions (région: content)

```html
<div class="section">
  <div class="container">
    <h2 class="text-center">Nos actions au quotidien</h2>
    <div class="grid-3" style="margin-top: 2rem;">
      
      <div class="card">
        <div style="font-size: 3rem; text-align: center; color: #2c5f8d;">🍲</div>
        <h3 class="card-title">Distribution alimentaire</h3>
        <p class="card-text">
          Chaque semaine, nous distribuons des repas chauds et des colis alimentaires aux familles dans le besoin.
        </p>
        <a href="/actions/alimentation" class="btn btn-outline">En savoir plus</a>
      </div>
      
      <div class="card">
        <div style="font-size: 3rem; text-align: center; color: #e67e22;">👔</div>
        <h3 class="card-title">Insertion professionnelle</h3>
        <p class="card-text">
          Ateliers CV, formations, coaching : nous accompagnons vers l'emploi durable et la réinsertion sociale.
        </p>
        <a href="/actions/emploi" class="btn btn-outline">En savoir plus</a>
      </div>
      
      <div class="card">
        <div style="font-size: 3rem; text-align: center; color: #27ae60;">🏠</div>
        <h3 class="card-title">Accès au logement</h3>
        <p class="card-text">
          Hébergement d'urgence et accompagnement pour retrouver un toit : personne ne doit dormir dehors.
        </p>
        <a href="/actions/logement" class="btn btn-outline">En savoir plus</a>
      </div>
      
    </div>
  </div>
</div>
```

### 5. Block Footer - Colonne 1 (région: footer_first)

```html
<h3>À propos</h3>
<p>Association à but non lucratif dédiée à l'aide aux personnes en difficulté depuis 2010.</p>
<p><strong>Agrément n°:</strong> W123456789</p>
<div style="margin-top: 1rem;">
  <span class="badge badge-success">Reconnue d'utilité publique</span>
</div>
```

### 6. Block Footer - Colonne 2 (région: footer_second)

```html
<h3>Liens utiles</h3>
<ul style="list-style: none; margin: 0; padding: 0;">
  <li><a href="/qui-sommes-nous">Qui sommes-nous</a></li>
  <li><a href="/nos-actions">Nos actions</a></li>
  <li><a href="/actualites">Actualités</a></li>
  <li><a href="/devenir-benevole">Devenir bénévole</a></li>
  <li><a href="/association/checkout">Faire un don</a></li>
  <li><a href="/contact">Contact</a></li>
</ul>
```

### 7. Block Footer - Colonne 3 (région: footer_third)

```html
<h3>Contact</h3>
<p>
  <strong>Adresse :</strong><br>
  123 Rue de la Solidarité<br>
  75001 Paris, France
</p>
<p>
  <strong>Email :</strong><br>
  <a href="mailto:contact@association.local">contact@association.local</a>
</p>
<p>
  <strong>Téléphone :</strong><br>
  +33 1 23 45 67 89
</p>
```

### 8. Block Footer Bottom (région: footer_bottom)

```html
<p>© 2024 Association Solidaire - Tous droits réservés | <a href="/mentions-legales">Mentions légales</a> | <a href="/politique-confidentialite">Politique de confidentialité</a></p>
```

## Création via Drush

```bash
# Se connecter au conteneur
docker compose exec drupal bash

# Créer les blocks
drush block-content:create --type=basic \
  --field-body-value='<h1>Ensemble, changeons des vies</h1>...' \
  --info='Hero Section'

# Placer le block dans une région
drush block:place association_theme_content \
  --region=hero \
  --theme=association_theme
```

## Création via l'interface Drupal

1. **Structure** → **Bibliothèque de blocs** (`/block/add`)
2. Créer un nouveau block de contenu
3. Coller le HTML ci-dessus
4. **Structure** → **Mise en page des blocs** (`/admin/structure/block`)
5. Choisir "Association Solidaire"
6. Placer le block dans la région appropriée

## Types de contenu recommandés à créer

### Article (pour actualités)
- Titre
- Image (field_image)
- Corps
- Catégorie (taxonomy)
- Date de publication

### Projet
- Titre
- Image principale
- Description
- Objectif financier (number field)
- Montant collecté (number field)
- Statut (list: En cours, Terminé, À venir)
- Date début/fin

### Témoignage
- Citation (text long)
- Nom de la personne
- Photo
- Rôle (Bénéficiaire, Bénévole, Donateur)

## Pages à créer

1. **Accueil** (`/` - node/1) : Hero + Stats + Actions + Actualités + CTA
2. **Qui sommes-nous** : Histoire, mission, valeurs, équipe
3. **Nos actions** : Liste des 3 domaines (alimentation, emploi, logement)
4. **Actualités** : Vue des articles récents
5. **Devenir bénévole** : Formulaire + témoignages bénévoles
6. **Contact** : Formulaire de contact + carte
7. **Faire un don** : Déjà géré par `/association/checkout`
