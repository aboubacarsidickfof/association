#!/bin/bash
# Script d'activation du thème Association Solidaire
# Usage: docker compose exec drupal bash /var/www/html/modules/custom/association_theme/install.sh

echo "🎨 Installation du thème Association Solidaire..."

# Activer le thème
drush theme:enable association_theme -y
drush config:set system.theme default association_theme -y

# Configurer le site
drush config:set system.site name "Association Solidaire" -y
drush config:set system.site slogan "Ensemble pour aider les plus démunis" -y

# Activer des modules utiles si disponibles
echo "📦 Vérification des modules recommandés..."

# Views pour listes de contenu
drush en views views_ui -y 2>/dev/null || echo "  ⏭️  Views déjà activé"

# Webform pour formulaires de contact/bénévolat
drush pm:list --type=module --status=available | grep -q webform && {
  drush en webform webform_ui -y
  echo "  ✅ Webform activé"
} || echo "  ⏭️  Webform non disponible (optionnel)"

# Pathauto pour URLs propres
drush pm:list --type=module --status=available | grep -q pathauto && {
  drush en pathauto -y
  echo "  ✅ Pathauto activé"
} || echo "  ⏭️  Pathauto non disponible (optionnel)"

# Menu personnalisé
drush en menu_ui -y 2>/dev/null || echo "  ⏭️  Menu UI déjà activé"

# Blocks
drush en block block_content -y 2>/dev/null || echo "  ⏭️  Block déjà activé"

# Vider les caches
echo "🧹 Nettoyage des caches..."
drush cr

echo ""
echo "✅ Thème Association Solidaire installé avec succès !"
echo ""
echo "📍 Prochaines étapes :"
echo "  1. Visitez votre site : http://drupal.localhost"
echo "  2. Allez dans Apparence pour configurer le logo"
echo "  3. Créez du contenu (actualités, projets)"
echo "  4. Configurez les blocs dans Structure > Mise en page des blocs"
echo ""
echo "📖 Documentation complète : /var/www/html/modules/custom/association_theme/README.md"
