from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import (utilisateur, chant, chansonnier, fournisseur,
                     commande, commander, contenir, commentaire,
                     fournir, favoris, noter, piste_audio, evenement)

admin.site.register(utilisateur)
admin.site.register(chant)
admin.site.register(chansonnier)
admin.site.register(fournisseur)
admin.site.register(commande)
admin.site.register(commander)
admin.site.register(contenir)
admin.site.register(commentaire)
admin.site.register(fournir)
admin.site.register(favoris)
admin.site.register(noter)
admin.site.register(piste_audio)
admin.site.register(evenement)

