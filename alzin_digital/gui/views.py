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
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    utilisateur,
    chant,
    favoris,
    commentaire,
)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def utilisateurs_api(request):
    if request.method == "GET":
        users = utilisateur.objects.all()
        data = [
            model_to_dict(
                u,
                fields=["id", "email", "nom", "prenom", "pseudo", "ville", "statut"],
            )
            for u in users
        ]
        return JsonResponse(data, safe=False)

    # POST : création d'un utilisateur
    body = json.loads(request.body.decode("utf-8"))
    u = utilisateur.objects.create(
        email=body["email"],
        nom=body.get("nom", ""),
        prenom=body.get("prenom", ""),
        pseudo=body.get("pseudo", ""),
        password=body.get("password", ""),
        ville=body.get("ville", ""),
        statut=body.get("statut", ""),
    )
    return JsonResponse(model_to_dict(u), status=201)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def chants_api(request):
    if request.method == "GET":
        chants = chant.objects.select_related("utilisateur").all()
        data = []
        for c in chants:
            data.append({
                "id": c.id,
                "nom_chant": c.nom_chant,
                "auteur": c.auteur,
                "ville_origine": c.ville_origine,
                "description": c.description,
                "utilisateur_id": c.utilisateur_id,
            })
        return JsonResponse(data, safe=False)

    # POST : création d'un chant (version simple, sans upload de fichiers)
    body = json.loads(request.body.decode("utf-8"))

    user_id = body.get("utilisateur_id")
    u = utilisateur.objects.get(id=user_id) if user_id is not None else None

    c = chant.objects.create(
        nom_chant=body["nom_chant"],
        auteur=body.get("auteur", ""),
        ville_origine=body.get("ville_origine", ""),
        description=body.get("description", ""),
        paroles=body.get("paroles", ""),
        utilisateur=u,
        # pour les fichiers (illustration_chant, pdf, partition), tu peux les gérer via l'admin
    )
    return JsonResponse({"id": c.id, "nom_chant": c.nom_chant}, status=201)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def favoris_api(request):
    if request.method == "GET":
        user_id = request.GET.get("utilisateur_id")
        qs = favoris.objects.select_related("utilisateur", "chant")
        if user_id:
            qs = qs.filter(utilisateur_id=user_id)

        data = [
            {
                "id": f.id,
                "utilisateur_id": f.utilisateur_id,
                "chant_id": f.chant_id,
                "date_favori": f.date_favori.isoformat(),
                "utilisateur": str(f.utilisateur),
                "chant": str(f.chant),
            }
            for f in qs
        ]
        return JsonResponse(data, safe=False)

    # POST : ajouter un favori
    body = json.loads(request.body.decode("utf-8"))

    fav = favoris.objects.create(
        utilisateur_id=body["utilisateur_id"],
        chant_id=body["chant_id"],
        date_favori=body["date_favori"],  # "2025-11-25"
    )
    return JsonResponse(
        {
            "id": fav.id,
            "utilisateur_id": fav.utilisateur_id,
            "chant_id": fav.chant_id,
            "date_favori": fav.date_favori.isoformat(),
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(["GET", "POST"])
def commentaires_api(request):
    if request.method == "GET":
        chant_id = request.GET.get("chant_id")
        qs = commentaire.objects.select_related("utilisateur", "chant")
        if chant_id:
            qs = qs.filter(chant_id=chant_id)

        data = [
            {
                "id": c.id,
                "utilisateur_id": c.utilisateur_id,
                "chant_id": c.chant_id,
                "date_comment": c.date_comment.isoformat(),
                "texte": c.texte,
                "utilisateur": str(c.utilisateur),
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    # POST : ajouter un commentaire
    body = json.loads(request.body.decode("utf-8"))

    com = commentaire.objects.create(
        utilisateur_id=body["utilisateur_id"],
        chant_id=body["chant_id"],
        date_comment=body["date_comment"],
        texte=body["texte"],
    )

    return JsonResponse(
        {
            "id": com.id,
            "utilisateur_id": com.utilisateur_id,
            "chant_id": com.chant_id,
            "date_comment": com.date_comment.isoformat(),
            "texte": com.texte,
        },
        status=201,
    )
