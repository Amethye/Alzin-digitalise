from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import (utilisateur, categorie, chant, chansonnier_perso, template_chansonnier, fournisseur,
                     commande, commander, contenir_chant_perso, contenir_chant_template, commentaire,
                     fournir, favoris, noter, piste_audio, evenement, maitre_chant, role)

admin.site.register(utilisateur)
admin.site.register(categorie)
admin.site.register(chant)
admin.site.register(chansonnier_perso)
admin.site.register(template_chansonnier)
admin.site.register(fournisseur)
admin.site.register(commande)
admin.site.register(commander)
admin.site.register(contenir_chant_perso)
admin.site.register(contenir_chant_template)
admin.site.register(commentaire)
admin.site.register(fournir)
admin.site.register(favoris)
admin.site.register(noter)
admin.site.register(piste_audio)
admin.site.register(evenement)
admin.site.register(maitre_chant)
admin.site.register(role)

