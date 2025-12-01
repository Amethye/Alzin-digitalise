from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.


# copier coller du site CAP ?????
from django . urls import reverse_lazy
from django . views . generic import CreateView , DeleteView , UpdateView , ListView

from django.shortcuts import render

def home(request):
    return render(request, "index.html")

def login_page(request):
    return render(request, "login.html")

def cart_page(request):
    return render(request, "cart.html")

def pins_page(request):
    return render(request, "pins.html")

def demande_penne_page(request):
    return render(request, "DemandePenne.html")

def register_page(request):
    return render(request, "register.html")

def reset_password_page(request):
    return render(request, "RequestPasswordReset.html")


#views pour le site Alzin

from django.shortcuts import render, redirect, get_object_or_404
from .models import utilisateur, chant, piste_audio, favoris, commentaire
from .forms import (
    UtilisateurForm, ChantForm, PisteAudioForm, FavorisForm, CommentaireForm
)

def ajouter_utilisateur(request):
    if request.method == "POST":
        form = UtilisateurForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("liste_utilisateurs")
    else:
        form = UtilisateurForm()
    return render(request, "gui/utilisateur_form.html", {"form": form})

def liste_utilisateurs(request):
    users = utilisateur.objects.all()
    return render(request, "gui/utilisateur_list.html", {"utilisateurs": users})


def ajouter_chant(request):
    if request.method == "POST":
        form = ChantForm(request.POST, request.FILES)   # ⚠️ request.FILES pour les FileField
        if form.is_valid():
            form.save()
            return redirect("liste_chants")
    else:
        form = ChantForm()
    return render(request, "gui/chant_form.html", {"form": form})

def liste_chants(request):
    chants = chant.objects.all()
    return render(request, "gui/chant_list.html", {"chants": chants})


def ajouter_piste_audio(request):
    if request.method == "POST":
        form = PisteAudioForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect("liste_pistes_audio")
    else:
        form = PisteAudioForm()
    return render(request, "gui/piste_audio_form.html", {"form": form})

def liste_pistes_audio(request):
    pistes = piste_audio.objects.all()
    return render(request, "gui/piste_audio_list.html", {"pistes": pistes})


def ajouter_favoris(request):
    if request.method == "POST":
        form = FavorisForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("liste_favoris")
    else:
        form = FavorisForm()
    return render(request, "gui/favoris_form.html", {"form": form})

def liste_favoris(request):
    favs = favoris.objects.select_related("utilisateur", "chant")
    return render(request, "gui/favoris_list.html", {"favoris": favs})


def ajouter_commentaire(request):
    if request.method == "POST":
        form = CommentaireForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("liste_commentaires")
    else:
        form = CommentaireForm()
    return render(request, "gui/commentaire_form.html", {"form": form})

def liste_commentaires(request):
    comms = commentaire.objects.select_related("utilisateur", "chant")
    return render(request, "gui/commentaire_list.html", {"commentaires": comms})
