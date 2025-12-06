from django.shortcuts import render
from django.http import HttpResponse
# Create your views here.

'''
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
'''

#views pour le site Alzin
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

def api_root(request):
    return JsonResponse({
        "message": "Backend Alzin OK",
        "endpoints": [
            "/api/utilisateurs/",
            "/api/chants/",
            "/api/favoris/",
            "/api/commentaires/",
            "Ce message est créé pour l'étape de vérification des premièeres API, à retirerrrrrrrr"
        ],
    })

from .models import (
    utilisateur,
    chant,
    piste_audio,
    favoris,
    commentaire,
    chansonnier,
    fournisseur,
    commande,
    evenement,
    commander,
    chanter,
    categories,
    appartenir,
    contenir,
    fournir,
    noter,
)

#UTILISATEURS
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

#CHANTS
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

#PISTE AUDIO
@csrf_exempt
@require_http_methods(["GET", "POST"])
def pistes_audio_api(request):
    if request.method == "GET":
        qs = piste_audio.objects.select_related("utilisateur", "chant")
        data = [
            {
                "id": p.id,
                "fichier_mp3": p.fichier_mp3.url if p.fichier_mp3 else None,
                "utilisateur_id": p.utilisateur_id,
                "chant_id": p.chant_id,
            }
            for p in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    p = piste_audio.objects.create(
        fichier_mp3=body["fichier_mp3"],      # chemin/nom du fichier
        utilisateur_id=body.get("utilisateur_id"),
        chant_id=body.get("chant_id"),
    )

    return JsonResponse(
        {
            "id": p.id,
            "fichier_mp3": str(p.fichier_mp3),
            "utilisateur_id": p.utilisateur_id,
            "chant_id": p.chant_id,
        },
        status=201,
    )


#FAVORIS
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

#COMMENTAIRE
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


#Chansonnier
@csrf_exempt
@require_http_methods(["GET", "POST"])
def chansonniers_api(request):
    if request.method == "GET":
        qs = chansonnier.objects.all()
        data = [
            {
                "id": c.id,
                "couleur": c.couleur,
                "type_papier": c.type_papier,
                "prix_vente_unite": float(c.prix_vente_unite),
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    c = chansonnier.objects.create(
        couleur=body["couleur"],
        type_papier=body["type_papier"],
        prix_vente_unite=body["prix_vente_unite"],
    )

    return JsonResponse(
        {
            "id": c.id,
            "couleur": c.couleur,
            "type_papier": c.type_papier,
            "prix_vente_unite": float(c.prix_vente_unite),
        },
        status=201,
    )


#Fournisseur
@csrf_exempt
@require_http_methods(["GET", "POST"])
def fournisseurs_api(request):
    if request.method == "GET":
        qs = fournisseur.objects.all()
        data = [
            {
                "id": f.id,
                "nom_fournisseur": f.nom_fournisseur,
                "ville_fournisseur": f.ville_fournisseur,
                "type_reliure": f.type_reliure,
            }
            for f in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    f = fournisseur.objects.create(
        nom_fournisseur=body["nom_fournisseur"],
        ville_fournisseur=body.get("ville_fournisseur", ""),
        type_reliure=body.get("type_reliure", ""),
    )

    return JsonResponse(
        {
            "id": f.id,
            "nom_fournisseur": f.nom_fournisseur,
            "ville_fournisseur": f.ville_fournisseur,
            "type_reliure": f.type_reliure,
        },
        status=201,
    )

#COMMANDE
@csrf_exempt
@require_http_methods(["GET", "POST"])
def commandes_api(request):
    if request.method == "GET":
        qs = commande.objects.select_related("utilisateur")
        data = [
            {
                "id": c.id,
                "date_commande": c.date_commande.isoformat(),
                "utilisateur_id": c.utilisateur_id,
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    c = commande.objects.create(
        date_commande=body["date_commande"],      # "YYYY-MM-DD"
        utilisateur_id=body["utilisateur_id"],
    )

    return JsonResponse(
        {
            "id": c.id,
            "date_commande": c.date_commande.isoformat(),
            "utilisateur_id": c.utilisateur_id,
        },
        status=201,
    )

#COMMANDER
@csrf_exempt
@require_http_methods(["GET", "POST"])
def commander_api(request):
    if request.method == "GET":
        qs = commander.objects.select_related("commande", "chansonnier")
        data = [
            {
                "id": l.id,
                "commande_id": l.commande_id,
                "chansonnier_id": l.chansonnier_id,
                "quantite": l.quantite,
            }
            for l in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    l = commander.objects.create(
        commande_id=body["commande_id"],
        chansonnier_id=body["chansonnier_id"],
        quantite=body["quantite"],
    )

    return JsonResponse(
        {
            "id": l.id,
            "commande_id": l.commande_id,
            "chansonnier_id": l.chansonnier_id,
            "quantite": l.quantite,
        },
        status=201,
    )

#EVENENMENT
@csrf_exempt
@require_http_methods(["GET", "POST"])
def evenements_api(request):
    if request.method == "GET":
        qs = evenement.objects.all()
        data = [
            {
                "id": e.id,
                "date_evenement": e.date_evenement.isoformat(),
                "lieu": e.lieu,
                "nom_evenement": e.nom_evenement,
                "annonce_fil_actu": e.annonce_fil_actu,
                "histoire": e.histoire,
            }
            for e in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    e = evenement.objects.create(
        date_evenement=body["date_evenement"],
        lieu=body["lieu"],
        nom_evenement=body["nom_evenement"],
        annonce_fil_actu=body.get("annonce_fil_actu", ""),
        histoire=body.get("histoire", ""),
    )

    return JsonResponse(
        {
            "id": e.id,
            "date_evenement": e.date_evenement.isoformat(),
            "lieu": e.lieu,
            "nom_evenement": e.nom_evenement,
            "annonce_fil_actu": e.annonce_fil_actu,
            "histoire": e.histoire,
        },
        status=201,
    )

#CHANTER
@csrf_exempt
@require_http_methods(["GET", "POST"])
def chanter_api(request):
    if request.method == "GET":
        qs = chanter.objects.select_related("chant", "evenement")
        data = [
            {
                "id": c.id,
                "chant_id": c.chant_id,
                "evenement_id": c.evenement_id,
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    c = chanter.objects.create(
        chant_id=body["chant_id"],
        evenement_id=body["evenement_id"],
    )

    return JsonResponse(
        {"id": c.id, "chant_id": c.chant_id, "evenement_id": c.evenement_id},
        status=201,
    )

#CATEGORIES
@csrf_exempt
@require_http_methods(["GET", "POST"])
def categories_api(request):
    if request.method == "GET":
        qs = categories.objects.all()
        data = [{"id": c.id, "nom_categorie": c.nom_categorie} for c in qs]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    c = categories.objects.create(nom_categorie=body["nom_categorie"])

    return JsonResponse({"id": c.id, "nom_categorie": c.nom_categorie}, status=201)

#APPARTENIR
@csrf_exempt
@require_http_methods(["GET", "POST"])
def appartenir_api(request):
    if request.method == "GET":
        qs = appartenir.objects.select_related("nom_categorie", "chant", "utilisateur")
        data = [
            {
                "id": a.id,
                "categorie_id": a.nom_categorie_id,
                "chant_id": a.chant_id,
                "utilisateur_id": a.utilisateur_id,
            }
            for a in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    a = appartenir.objects.create(
        nom_categorie_id=body["categorie_id"],
        chant_id=body["chant_id"],
        utilisateur_id=body.get("utilisateur_id"),
    )

    return JsonResponse(
        {
            "id": a.id,
            "categorie_id": a.nom_categorie_id,
            "chant_id": a.chant_id,
            "utilisateur_id": a.utilisateur_id,
        },
        status=201,
    )

#CONTENIR
@csrf_exempt
@require_http_methods(["GET", "POST"])
def contenir_api(request):
    if request.method == "GET":
        qs = contenir.objects.select_related("chant", "chansonnier")
        data = [
            {
                "id": c.id,
                "chant_id": c.chant_id,
                "chansonnier_id": c.chansonnier_id,
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    c = contenir.objects.create(
        chant_id=body["chant_id"],
        chansonnier_id=body["chansonnier_id"],
    )

    return JsonResponse(
        {"id": c.id, "chant_id": c.chant_id, "chansonnier_id": c.chansonnier_id},
        status=201,
    )

#FOURNIR
@csrf_exempt
@require_http_methods(["GET", "POST"])
def fournir_api(request):
    if request.method == "GET":
        qs = fournir.objects.select_related("fournisseur", "chansonnier")
        data = [
            {
                "id": f.id,
                "fournisseur_id": f.fournisseur_id,
                "chansonnier_id": f.chansonnier_id,
                "date_fourniture": f.date_fourniture.isoformat(),
            }
            for f in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    f = fournir.objects.create(
        fournisseur_id=body["fournisseur_id"],
        chansonnier_id=body["chansonnier_id"],
        date_fourniture=body["date_fourniture"],
    )

    return JsonResponse(
        {
            "id": f.id,
            "fournisseur_id": f.fournisseur_id,
            "chansonnier_id": f.chansonnier_id,
            "date_fourniture": f.date_fourniture.isoformat(),
        },
        status=201,
    )

#NOTER
@csrf_exempt
@require_http_methods(["GET", "POST"])
def noter_api(request):
    if request.method == "GET":
        qs = noter.objects.select_related("utilisateur", "piste_audio")
        data = [
            {
                "id": n.id,
                "utilisateur_id": n.utilisateur_id,
                "piste_audio_id": n.piste_audio_id,
                "date_rating": n.date_rating.isoformat(),
            }
            for n in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    n = noter.objects.create(
        utilisateur_id=body["utilisateur_id"],
        piste_audio_id=body["piste_audio_id"],
        date_rating=body["date_rating"],
    )

    return JsonResponse(
        {
            "id": n.id,
            "utilisateur_id": n.utilisateur_id,
            "piste_audio_id": n.piste_audio_id,
            "date_rating": n.date_rating.isoformat(),
        },
        status=201,
    )

