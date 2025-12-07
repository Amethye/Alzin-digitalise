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
from django.contrib.auth.hashers import check_password, make_password
from django.forms.models import model_to_dict
from django.core.files.storage import default_storage

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
    chansonnier_perso,
    fournisseur,
    commande,
    evenement,
    commander,
    chanter,
    categorie,
    appartenir,
    contenir,
    fournir,
    noter,
    maitre_chant,
    role,
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
                fields=["id", "email", "nom", "prenom", "pseudo", "ville"]
            )
            for u in users
        ]
        return JsonResponse(data, safe=False)

    # POST : création d'un utilisateur
    try:
        body = json.loads(request.body.decode("utf-8"))
    except:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    required = ["email", "nom", "prenom", "pseudo", "ville", "password"]
    for field in required:
        if field not in body or not body[field]:
            return JsonResponse({"error": f"Missing field: {field}"}, status=400)

    # vérifie email unique
    if utilisateur.objects.filter(email=body["email"]).exists():
        return JsonResponse({"error": "Email déjà utilisé"}, status=409)

    # vérifie pseudo unique
    if utilisateur.objects.filter(pseudo=body["pseudo"]).exists():
        return JsonResponse({"error": "Pseudo déjà utilisé"}, status=409)
    
    role_user = role.objects.get(nom_role="user")

    # création utilisateur avec mot de passe hashé
    u = utilisateur.objects.create(
        email=body["email"],
        nom=body["nom"],
        prenom=body["prenom"],
        pseudo=body["pseudo"],
        ville=body["ville"],
        password=make_password(body["password"]),
        role=role_user,
    )

    return JsonResponse(
        {"success": True, "user_id": u.id, "message": "Compte créé"},
        status=201
    )

#LOGIN
@csrf_exempt
def login_api(request):
    if request.method == "OPTIONS":
        return JsonResponse({"ok": True})

    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    body = json.loads(request.body.decode("utf-8"))
    email = body.get("email", "").lower()
    password = body.get("password", "")

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"success": False, "error": "Utilisateur introuvable"}, status=400)

    # Vérification du mot de passe hashé
    if not check_password(password, user.password):
        return JsonResponse({"success": False, "error": "Mot de passe incorrect"}, status=400)

    # Succès
    return JsonResponse({
        "success": True,
        "user_id": user.id,
        "email": user.email,
        "pseudo": user.pseudo,
        "role":user.role.nom_role
    })

#ME
@csrf_exempt
def me_api(request):
    # Email envoyé par le frontend dans les headers
    email = request.headers.get("X-User-Email", "").lower()

    if not email:
        return JsonResponse({"error": "Email manquant"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    # Récupérer les informations
    if request.method == "GET":
        return JsonResponse({
            "id": user.id,
            "nom": user.nom,
            "prenom": user.prenom,
            "email": user.email,
            "pseudo": user.pseudo,
            "ville": user.ville,
            "role" : user.role.nom_role
        })
    
    # Mise à jour des informations utilisateur
    if request.method == "PATCH":
        body = json.loads(request.body.decode("utf-8"))

        user.nom = body.get("nom", user.nom)
        user.prenom = body.get("prenom", user.prenom)
        user.pseudo = body.get("pseudo", user.pseudo)
        user.ville = body.get("ville", user.ville)
        user.email = body.get("email", user.email)

        user.save()
        return JsonResponse({"success": True})

    # Méthode non autorisée
    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

#LOGOUT
@csrf_exempt
def logout_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    return JsonResponse({"success": True})



#ADMIN_USER
@csrf_exempt
def admin_users_api(request, user_id=None, action=None):

    #GET /api/admin/users/
    if request.method == "GET" and user_id is None:
        users = utilisateur.objects.all()
        data = []
        for u in users:
            data.append({
                "id": u.id,
                "nom": u.nom,
                "prenom": u.prenom,
                "pseudo": u.pseudo,
                "email": u.email,
                "ville": u.ville,
                "role": u.role.nom_role if u.role else "user",
            })
        return JsonResponse(data, safe=False)

    # On cherche l'utilisateur si user_id est fourni
    if user_id is not None:
        try:
            user = utilisateur.objects.get(id=user_id)
        except utilisateur.DoesNotExist:
            return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    #PUT /api/admin/users/<id>/role/
    if request.method == "PUT" and action == "role":
        try:
            body = json.loads(request.body)
        except:
            return JsonResponse({"error": "JSON invalide"}, status=400)

        role_name = body.get("role")
        if not role_name:
            return JsonResponse({"error": "Paramètre 'role' manquant"}, status=400)

        try:
            new_role = role.objects.get(nom_role=role_name)
        except role.DoesNotExist:
            return JsonResponse({"error": "Rôle inconnu"}, status=400)

        user.role = new_role
        user.save()

        return JsonResponse({"success": True, "role": new_role.nom_role})

    #PUT /api/admin/users/<id>/
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
        except:
            return JsonResponse({"error": "JSON invalide"}, status=400)

        for field in ["nom", "prenom", "pseudo", "email", "ville"]:
            if field in data:
                setattr(user, field, data[field])

        user.save()
        return JsonResponse({"success": True})

    #DELETE /api/admin/users/<id>/
    if request.method == "DELETE":
        user.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)


    

#CHANTS
def serialize_chant(c: chant):
    return {
        "id": c.id,
        "nom_chant": c.nom_chant,
        "auteur": c.auteur or "",
        "ville_origine": c.ville_origine or "",
        "paroles": c.paroles,
        "description": c.description or "",
        "illustration_chant_url": c.illustration_chant.url if c.illustration_chant else None,
        "paroles_pdf_url": c.paroles_pdf.url if c.paroles_pdf else None,
        "partition_url": c.partition.url if c.partition else None,
        "categorie": [cat.nom_categorie for cat in c.categorie.all()]
    }

@csrf_exempt
def chants_api(request, chant_id=None):
    # ---- GET /api/chants/<id>/ (DETAIL) ----
    if chant_id is not None:
        try:
            c = chant.objects.get(id=chant_id)
        except chant.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        return JsonResponse({
            "id": c.id,
            "nom_chant": c.nom_chant,
            "auteur": c.auteur,
            "ville_origine": c.ville_origine,
            "paroles": c.paroles,
            "description": c.description,
            "illustration_chant_url": c.illustration_chant.url if c.illustration_chant else None,
            "paroles_pdf_url": c.paroles_pdf.url if c.paroles_pdf else None,
            "partition_url": c.partition.url if c.partition else None,
        })

    # ---- GET /api/chants/ (LISTE) ----
    if request.method == "GET":
        qs = chant.objects.all().order_by("nom_chant")
        data = [
            {
                "id": c.id,
                "nom_chant": c.nom_chant,
                "auteur": c.auteur,
                "ville_origine": c.ville_origine,
                "description": c.description,
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    # ---- POST /api/chants/ (CREATE) ----
    if request.method == "POST":
        nom_chant = request.POST.get("nom_chant")
        paroles = request.POST.get("paroles")

        c = chant.objects.create(
            nom_chant=nom_chant,
            auteur=request.POST.get("auteur", ""),
            ville_origine=request.POST.get("ville_origine", ""),
            paroles=paroles,
            description=request.POST.get("description", ""),
        )

        # Files
        if "illustration_chant" in request.FILES:
            c.illustration_chant = request.FILES["illustration_chant"]
        if "paroles_pdf" in request.FILES:
            c.paroles_pdf = request.FILES["paroles_pdf"]
        if "partition" in request.FILES:
            c.partition = request.FILES["partition"]

        c.save()
        return JsonResponse({"id": c.id}, status=201)

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

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
        qs = chansonnier_perso.objects.all()
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

    c = chansonnier_perso.objects.create(
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
        qs = commander.objects.select_related("commande", "chansonnier_perso")
        data = [
            {
                "id": l.id,
                "commande_id": l.commande_id,
                "chansonnier_perso_id": l.chansonnier_perso_id,
                "quantite": l.quantite,
            }
            for l in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    l = commander.objects.create(
        commande_id=body["commande_id"],
        chansonnier_perso_id=body["chansonnier_perso_id"],
        quantite=body["quantite"],
    )

    return JsonResponse(
        {
            "id": l.id,
            "commande_id": l.commande_id,
            "chansonnier_perso_id": l.chansonnier_perso_id,
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
def categorie_api(request):
    # GET : renvoie la liste des catégories
    if request.method == "GET":
        qs = categorie.objects.all().order_by("nom_categorie")
        data = [
            {"id": c.id, "nom_categorie": c.nom_categorie}
        for c in qs]
        return JsonResponse(data, safe=False)

    # DELETE : suppression via ?delete=Nom
    if request.method == "DELETE":
        name = request.GET.get("delete")
        if not name:
            return JsonResponse({"error": "Nom manquant"}, status=400)

        if name == "Autre":
            return JsonResponse({"error": "Impossible de supprimer 'Autre'"}, status=400)

        try:
            c = categorie.objects.get(nom_categorie=name)
            c.delete()
        except categorie.DoesNotExist:
            return JsonResponse({"error": "Catégorie introuvable"}, status=404)

        return JsonResponse({"success": True})

    # Pour POST & PUT on lit le body JSON
    try:
        body = json.loads(request.body.decode("utf-8"))
    except:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    # POST : ajouter une catégorie
    if request.method == "POST":
        nom = body.get("nom_categorie")
        if not nom:
            return JsonResponse({"error": "nom_categorie requis"}, status=400)

        c = categorie.objects.create(nom_categorie=nom)
        return JsonResponse({"id": c.id, "nom_categorie": c.nom_categorie}, status=201)

    # PUT : renommer une catégorie
    if request.method == "PUT":
        old = body.get("old_name")
        new = body.get("new_name")

        if not old or not new:
            return JsonResponse({"error": "Paramètres old_name et new_name requis"}, status=400)

        try:
            c = categorie.objects.get(nom_categorie=old)
        except categorie.DoesNotExist:
            return JsonResponse({"error": "Ancienne catégorie introuvable"}, status=404)

        c.nom_categorie = new
        c.save()

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

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
        qs = contenir.objects.select_related("chant", "chansonnier_perso")
        data = [
            {
                "id": c.id,
                "chant_id": c.chant_id,
                "chansonnier_perso_id": c.chansonnier_perso_id,
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    c = contenir.objects.create(
        chant_id=body["chant_id"],
        chansonnier_perso_id=body["chansonnier_perso_id"],
    )

    return JsonResponse(
        {"id": c.id, "chant_id": c.chant_id, "chansonnier_perso_id": c.chansonnier_perso_id},
        status=201,
    )

#FOURNIR
@csrf_exempt
@require_http_methods(["GET", "POST"])
def fournir_api(request):
    if request.method == "GET":
        qs = fournir.objects.select_related("fournisseur", "chansonnier_perso")
        data = [
            {
                "id": f.id,
                "fournisseur_id": f.fournisseur_id,
                "chansonnier_perso_id": f.chansonnier_perso_id,
                "date_fourniture": f.date_fourniture.isoformat(),
            }
            for f in qs
        ]
        return JsonResponse(data, safe=False)

    body = json.loads(request.body.decode("utf-8"))

    f = fournir.objects.create(
        fournisseur_id=body["fournisseur_id"],
        chansonnier_perso_id=body["chansonnier_perso_id"],
        date_fourniture=body["date_fourniture"],
    )

    return JsonResponse(
        {
            "id": f.id,
            "fournisseur_id": f.fournisseur_id,
            "chansonnier_perso_id": f.chansonnier_perso_id,
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

@csrf_exempt
@require_http_methods(["GET", "POST"])
def maitres_api(request):

    if request.method == "GET":
        data = [m.nom for m in maitre_chant.objects.all()]
        return JsonResponse({"maitres": data}, safe=False)

    # POST → remplace toute la liste
    try:
        body = json.loads(request.body.decode("utf-8"))

        maitres = body.get("maitres", None)
        if maitres is None or not isinstance(maitres, list):
            return JsonResponse({"error": "Format invalide"}, status=400)

        # On réinitialise la table
        maitre_chant.objects.all().delete()

        # On insère les nouveaux éléments
        for nom in maitres:
            maitre_chant.objects.create(nom=nom)

        return JsonResponse({"maitres": maitres}, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)