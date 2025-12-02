{
    'name': 'Association Solidaire Theme',
    'version': '17.0.1.0.0',
    'category': 'Theme/NGO',
    'summary': 'Thème moderne pour association à but non lucratif',
    'description': """
Association Solidaire Theme
===========================
Thème personnalisé pour association avec:
* Palette de couleurs solidarité (Bleu, Orange, Vert)
* Design moderne et responsive
* Sections héro optimisées pour les appels à l'action
* Blocs de statistiques d'impact
* Formulaires de don stylisés
* Compatible avec les modules de paiement en ligne
    """,
    'author': 'Association Team',
    'website': 'https://github.com/aboubacarsidickfof/association',
    'license': 'LGPL-3',
    'depends': [
        'web',
        'website',
        'website_sale',
        'portal',
    ],
    'data': [
        'views/website_templates.xml',
        'views/portal_templates.xml',
        'views/snippets.xml',
    ],
    'assets': {
        'web.assets_frontend': [
            'association_theme/static/src/css/variables.css',
            'association_theme/static/src/css/reset.css',
            'association_theme/static/src/css/layout.css',
            'association_theme/static/src/css/components.css',
            'association_theme/static/src/css/responsive.css',
            'association_theme/static/src/js/main.js',
        ],
    },
    'images': [
        'static/description/banner.png',
        'static/description/screenshot.png',
    ],
    'installable': True,
    'application': False,
    'auto_install': False,
}
