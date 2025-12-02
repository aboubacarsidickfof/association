/** @odoo-module **/

import publicWidget from '@web/legacy/js/public/public_widget';

publicWidget.registry.AssociationTheme = publicWidget.Widget.extend({
    selector: '.o_association_theme',
    
    start: function () {
        this._super.apply(this, arguments);
        this._initMobileMenu();
        this._initScrollEffects();
    },

    _initMobileMenu: function () {
        const menuToggle = document.querySelector('.menu-toggle');
        const primaryMenu = document.querySelector('.primary-menu');
        
        if (menuToggle && primaryMenu) {
            menuToggle.addEventListener('click', function() {
                primaryMenu.classList.toggle('active');
            });
        }
    },

    _initScrollEffects: function () {
        const header = document.querySelector('.site-header');
        if (header) {
            window.addEventListener('scroll', function() {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }
    },
});

export default publicWidget.registry.AssociationTheme;
