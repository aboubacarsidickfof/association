# -*- coding: utf-8 -*-
from odoo import models

class AssociationTheme(models.AbstractModel):
    _inherit = 'theme.utils'

    def _theme_association_post_copy(self, mod):
        # Configuration après activation du thème
        self.enable_view('website.template_header_default')
        self.enable_view('website.footer_custom')
