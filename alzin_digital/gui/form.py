from django import forms
from .models import (
    utilisateur, chant, piste_audio, favoris, commentaire
)

class UtilisateurForm(forms.ModelForm):
    class Meta:
        model = utilisateur
        fields = ["email", "nom", "prenom", "pseudo", "password", "ville", "statut"]


class ChantForm(forms.ModelForm):
    class Meta:
        model = chant
        fields = [
            "nom_chant",
            "auteur",
            "ville_origine",
            "illustration_chant",
            "paroles",
            "paroles_pdf",
            "description",
            "partition",
            "utilisateur",
        ]


class PisteAudioForm(forms.ModelForm):
    class Meta:
        model = piste_audio
        fields = ["fichier_mp3", "utilisateur", "chant"]


class FavorisForm(forms.ModelForm):
    class Meta:
        model = favoris
        fields = ["utilisateur", "chant", "date_favori"]


class CommentaireForm(forms.ModelForm):
    class Meta:
        model = commentaire
        fields = ["utilisateur", "chant", "date_comment", "texte"]
