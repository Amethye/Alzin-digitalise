from django.shortcuts import render
from django.http import HttpResponse
from datetime import date
from django.views.decorators.http import require_http_methods


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
from django.utils import timezone

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
    template_chansonnier,
    fournisseur,
    commande,
    evenement,
    details_commande,
    chanter,
    categorie,
    appartenir,
    contenir_chant_perso,
    contenir_chant_template,
    fournir,
    noter,
    maitre_chant,
    role,
    demande_support,
    piece_jointe_support
)
#------------------------------------------------------------------------
                            #UTILISATEURS
#------------------------------------------------------------------------
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

#------------------------------------------------------------------------
                                #LOGIN
#------------------------------------------------------------------------
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
#------------------------------------------------------------------------
                                    #ME
#------------------------------------------------------------------------
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
#------------------------------------------------------------------------
                                #LOGOUT
#------------------------------------------------------------------------
@csrf_exempt
def logout_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    return JsonResponse({"success": True})


#------------------------------------------------------------------------
                                #ADMIN_USER
#------------------------------------------------------------------------
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


    
#------------------------------------------------------------------------
                            #CHANTS
#------------------------------------------------------------------------
#------------------------------------------------------------------------
#                            CHANTS
#------------------------------------------------------------------------

def serialize_chant(c):
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

        # catégories via appartenir
        "categories": [
            rel.categorie.nom_categorie
            for rel in c.categories_associees.all()
        ],

        # pistes audio
        "pistes_audio": [
            {
                "id": pa.id,
                "fichier_mp3": pa.fichier_mp3.url if pa.fichier_mp3 else None,
                "utilisateur": pa.utilisateur.id if pa.utilisateur else None,
            }
            for pa in c.pistes_audio.all()
        ]
    }


@csrf_exempt
def chants_api(request, chant_id=None):

    # ============================================================
    #                      GET (DETAIL)
    # ============================================================
    if chant_id:
        try:
            c = chant.objects.get(id=chant_id)
        except chant.DoesNotExist:
            return JsonResponse({"error": "Chant introuvable"}, status=404)

        # ---------------- DETAIL
        if request.method == "GET":
            return JsonResponse(serialize_chant(c))

        # --------- UPDATE ---------
        if request.method == "PUT":
            # Mise à jour des champs texte
            c.nom_chant = request.POST.get("nom_chant", c.nom_chant)
            c.auteur = request.POST.get("auteur") or ""
            c.ville_origine = request.POST.get("ville_origine") or ""
            c.paroles = request.POST.get("paroles", c.paroles)
            c.description = request.POST.get("description") or ""

            # -----------------------------
            # Mise à jour des catégories
            # -----------------------------
            categories = request.POST.getlist("categories")
            appartenir.objects.filter(chant=c).delete()

            for cat_name in categories:
                cat_obj, _ = categorie.objects.get_or_create(nom_categorie=cat_name)
                appartenir.objects.create(
                    chant=c,
                    categorie=cat_obj,
                    utilisateur=None
                )

            # -----------------------------
            # Remplacement des fichiers
            # -----------------------------

            # Illustration
            if "illustration_chant" in request.FILES:
                if c.illustration_chant and c.illustration_chant.path:
                    if os.path.isfile(c.illustration_chant.path):
                        os.remove(c.illustration_chant.path)
                c.illustration_chant = request.FILES["illustration_chant"]

            # PDF paroles
            if "paroles_pdf" in request.FILES:
                if c.paroles_pdf and c.paroles_pdf.path:
                    if os.path.isfile(c.paroles_pdf.path):
                        os.remove(c.paroles_pdf.path)
                c.paroles_pdf = request.FILES["paroles_pdf"]

            # Partition
            if "partition" in request.FILES:
                if c.partition and c.partition.path:
                    if os.path.isfile(c.partition.path):
                        os.remove(c.partition.path)
                c.partition = request.FILES["partition"]

            c.save()
            return JsonResponse({"success": True})

        # ============================================================
        #                      DELETE
        # ============================================================
        if request.method == "DELETE":
            c.delete()
            return JsonResponse({"success": True})

        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    # ============================================================
    #                      GET (LISTE)
    # ============================================================
    if request.method == "GET":
        qs = (
            chant.objects
            .all()
            .prefetch_related("pistes_audio", "categories_associees__categorie")
            .order_by("nom_chant")
        )
        data = [serialize_chant(c) for c in qs]
        return JsonResponse(data, safe=False)

    # ============================================================
    #                      CRÉATION (POST)
    # ============================================================
    if request.method == "POST":
        nom = request.POST.get("nom_chant")
        paroles = request.POST.get("paroles")
        categories = request.POST.getlist("categories")

        if not nom or not paroles:
            return JsonResponse({"error": "Champs requis manquants"}, status=400)

        # Création du chant
        c = chant.objects.create(
            nom_chant=nom,
            auteur=request.POST.get("auteur", ""),
            ville_origine=request.POST.get("ville_origine", ""),
            paroles=paroles,
            description=request.POST.get("description", ""),
            utilisateur=None,
        )

        # Ajout catégories
        for cat_name in categories:
            cat_obj, _ = categorie.objects.get_or_create(nom_categorie=cat_name)
            appartenir.objects.create(chant=c, categorie=cat_obj, utilisateur=None)

        # FICHIERS
        if "illustration_chant" in request.FILES:
            c.illustration_chant = request.FILES["illustration_chant"]

        if "paroles_pdf" in request.FILES:
            c.paroles_pdf = request.FILES["paroles_pdf"]

        if "partition" in request.FILES:
            c.partition = request.FILES["partition"]

        c.save()

        return JsonResponse({"id": c.id}, status=201)

    return JsonResponse({"error": "Méthode non autorisée"}, status=405) 
#------------------------------------------------------------------------
#                           CATEGORIES
#------------------------------------------------------------------------
@csrf_exempt
def categories_api(request):

    # -------- GET : liste --------
    if request.method == "GET":
        cats = categorie.objects.all().order_by("nom_categorie")
        return JsonResponse(
            [{"id": c.id, "nom_categorie": c.nom_categorie} for c in cats],
            safe=False
        )

    # -------- DELETE : supprimer --------
    if request.method == "DELETE":
        name = request.GET.get("delete")

        if not name:
            return JsonResponse({"error": "Nom requis"}, status=400)

        try:
            cat = categorie.objects.get(nom_categorie=name)
        except categorie.DoesNotExist:
            return JsonResponse({"error": "Catégorie introuvable"}, status=404)

        if appartenir.objects.filter(categorie=cat).exists():
            return JsonResponse({"error": "Catégorie utilisée"}, status=400)

        cat.delete()
        return JsonResponse({"success": True})
    # -------- POST : créer --------
    if request.method == "POST":
        body = json.loads(request.body.decode())
        nom = body.get("nom_categorie")

        if not nom:
            return JsonResponse({"error": "nom_categorie requis"}, status=400)

        if categorie.objects.filter(nom_categorie=nom).exists():
            return JsonResponse({"error": "Catégorie existe déjà"}, status=400)

        c = categorie.objects.create(nom_categorie=nom)
        return JsonResponse({"id": c.id, "nom_categorie": c.nom_categorie}, status=201)

    # -------- PUT : renommer --------
    if request.method == "PUT":
        body = json.loads(request.body.decode())
        old = body.get("old_name")
        new = body.get("new_name")

        if not old or not new:
            return JsonResponse({"error": "Champs manquants"}, status=400)

        try:
            c = categorie.objects.get(nom_categorie=old)
        except categorie.DoesNotExist:
            return JsonResponse({"error": "Catégorie introuvable"}, status=404)

        if categorie.objects.filter(nom_categorie=new).exists():
            return JsonResponse({"error": "Nom déjà utilisé"}, status=400)

        c.nom_categorie = new
        c.save()
        return JsonResponse({"success": True})

#------------------------------------------------------------------------
                                #APPARTENIR
#------------------------------------------------------------------------
@csrf_exempt
def appartenir_api(request):
    
    # POST = ajouter catégorie à un chant
    if request.method == "POST":
        body = json.loads(request.body.decode())
        chant_id = body.get("chant_id")
        cat_name = body.get("categorie")
        utilisateur_id = body.get("utilisateur")

        try:
            ch = chant.objects.get(id=chant_id)
        except chant.DoesNotExist:
            return JsonResponse({"error": "Chant introuvable"}, status=404)

        cat, _ = categorie.objects.get_or_create(nom_categorie=cat_name)

        rel, created = appartenir.objects.get_or_create(
            chant=ch,
            categorie=cat,
            utilisateur_id=utilisateur_id
        )

        return JsonResponse({"success": True, "created": created})

    # DELETE = enlever une catégorie d’un chant
    if request.method == "DELETE":
        chant_id = request.GET.get("chant_id")
        cat_name = request.GET.get("categorie")

        try:
            rel = appartenir.objects.get(
                chant_id=chant_id,
                categorie__nom_categorie=cat_name
            )
        except appartenir.DoesNotExist:
            return JsonResponse({"error": "Relation introuvable"}, status=404)

        rel.delete()
        return JsonResponse({"success": True})

#------------------------------------------------------------------------
#                           PISTE AUDIO
#------------------------------------------------------------------------
@csrf_exempt
def pistes_audio_api(request, piste_id=None):

    # ----------- GET /api/pistes-audio/ -------------
    if request.method == "GET" and piste_id is None:
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

    # ----------- GET /api/pistes-audio/<id>/ ----------
    if request.method == "GET" and piste_id:
        try:
            p = piste_audio.objects.get(id=piste_id)
        except piste_audio.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        return JsonResponse({
            "id": p.id,
            "fichier_mp3": p.fichier_mp3.url if p.fichier_mp3 else None,
            "utilisateur_id": p.utilisateur_id,
            "chant_id": p.chant_id,
        })

    # ----------- POST : upload --------------
    if request.method == "POST":
        chant_id = request.POST.get("chant_id")
        utilisateur_id = request.POST.get("utilisateur_id")

        if "fichier_mp3" not in request.FILES:
            return JsonResponse({"error": "MP3 manquant"}, status=400)

        mp3 = request.FILES["fichier_mp3"]

        p = piste_audio.objects.create(
            fichier_mp3=mp3,
            chant_id=chant_id,
            utilisateur_id=utilisateur_id,
        )

        return JsonResponse({
            "id": p.id,
            "fichier_mp3": p.fichier_mp3.url,
        }, status=201)

    # ----------- DELETE /api/pistes-audio/<id>/ ----------
    if request.method == "DELETE" and piste_id:
        try:
            p = piste_audio.objects.get(id=piste_id)
        except piste_audio.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        p.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

#----------------------------------------------------------------------------
                                #NOTER
#---------------------------------------------------------------------------
@csrf_exempt
def noter_api(request, note_id=None):
    if request.method == "GET":
        if note_id:
            try:
                n = noter.objects.get(id=note_id)
            except noter.DoesNotExist:
                return JsonResponse({"error": "Note introuvable"}, status=404)

            return JsonResponse({
                "id": n.id,
                "utilisateur_id": n.utilisateur_id,
                "piste_audio_id": n.piste_audio_id,
                "valeur_note": n.valeur_note,
                "date_rating": n.date_rating.isoformat(),
            })

        qs = noter.objects.all()

        user_id = request.GET.get("utilisateur_id")
        piste_id = request.GET.get("piste_id")

        if user_id:
            qs = qs.filter(utilisateur_id=user_id)
        if piste_id:
            qs = qs.filter(piste_audio_id=piste_id)

        data = [
            {
                "id": n.id,
                "utilisateur_id": n.utilisateur_id,
                "piste_audio_id": n.piste_audio_id,
                "valeur_note": n.valeur_note,
                "date_rating": n.date_rating.isoformat(),
            }
            for n in qs
        ]

        return JsonResponse(data, safe=False)

    # ------------------------------------
    # POST 
    # ------------------------------------
    if request.method == "POST":
        body = json.loads(request.body.decode("utf-8"))

        note = noter.objects.create(
            utilisateur_id=body["utilisateur_id"],
            piste_audio_id=body["piste_audio_id"],
            valeur_note=body["valeur_note"]
        )

        return JsonResponse({
            "id": note.id,
            "utilisateur_id": note.utilisateur_id,
            "piste_audio_id": note.piste_audio_id,
            "valeur_note": note.valeur_note,
            "date_rating": note.date_rating.isoformat(),
        }, status=201)

    # ------------------------------------
    # PUT 
    # ------------------------------------
    if request.method == "PUT":
        if not note_id:
            return JsonResponse({"error": "ID requis"}, status=400)

        try:
            note = noter.objects.get(id=note_id)
        except noter.DoesNotExist:
            return JsonResponse({"error": "Note introuvable"}, status=404)

        body = json.loads(request.body.decode("utf-8"))
        note.valeur_note = body.get("valeur_note", note.valeur_note)
        note.save()

        return JsonResponse({"success": True})

    # ------------------------------------
    # DELETE
    # ------------------------------------
    if request.method == "DELETE":
        if not note_id:
            return JsonResponse({"error": "ID requis"}, status=400)

        try:
            note = noter.objects.get(id=note_id)
        except noter.DoesNotExist:
            return JsonResponse({"error": "Note introuvable"}, status=404)

        note.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    
#-----------------------------------------------------------
#                          FAVORIS
#-----------------------------------------------------------
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

    # -------- POST --------
    body = json.loads(request.body.decode("utf-8"))
    user_id = body.get("utilisateur_id")
    chant_id = body.get("chant_id")
    date_favori = body.get("date_favori")
    

    # Vérifier si favori existe déjà
    if favoris.objects.filter(utilisateur_id=user_id, chant_id=chant_id).exists():
        return JsonResponse({"error": "Déjà dans les favoris"}, status=400)

    # Si aucune date fournie → date du jour
    if not date_favori:
        date_favori = timezone.now().date()

    fav = favoris.objects.create(
        utilisateur_id=user_id,
        chant_id=chant_id,
        date_favori=date_favori
    )

    return JsonResponse({
        "id": fav.id,
        "utilisateur_id": fav.utilisateur_id,
        "chant_id": fav.chant_id,
        "date_favori": fav.date_favori.isoformat(),
    }, status=201)
#-----------------------------------------------------------
#                         COMMENTAIRE
#-----------------------------------------------------------
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

#----------------------------------------------------------------------------------------
#                           CHANSONNIER 
#  ----------------------------------------------------------------------------------------



#Chansonnier
@csrf_exempt
@require_http_methods(["GET", "POST"])
def mes_chansonniers_api(request):
    """
    GET  : retourne les chansonniers personnalisés (alzins perso) de l'utilisateur courant.
    POST : crée un nouveau chansonnier perso pour l'utilisateur courant
           + (optionnel) associe une liste de chants via contenir_chant_perso.
    """
    email = request.headers.get("X-User-Email", "").lower()
    if not email:
        return JsonResponse({"error": "Email manquant"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    # --------- GET : liste mes alzins persos ----------
    if request.method == "GET":
        qs = chansonnier_perso.objects.filter(utilisateur=user).order_by(
            "-date_creation", "-id"
        )

        data = [
            {
                "id": c.id,
                "nom_chansonnier_perso": c.nom_chansonnier_perso,
                "couleur": c.couleur,
                "type_papier": c.type_papier,
                "prix_vente_unite": str(c.prix_vente_unite),
                "date_creation": c.date_creation.isoformat(),
                "template_id": c.template_chansonnier_id,
            }
            for c in qs
        ]

        return JsonResponse(data, safe=False)

    # --------- POST : création d'un nouvel alzin perso ----------
    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    nom = body.get("nom_chansonnier_perso")
    couleur = body.get("couleur")
    type_papier = body.get("type_papier")
    prix_vente_unite = body.get("prix_vente_unite", 0)
    template_id = body.get("template_id")
    chant_ids = body.get("chant_ids", [])

    if not nom or not couleur or not type_papier:
        return JsonResponse(
            {"error": "nom_chansonnier_perso, couleur et type_papier sont requis"},
            status=400,
        )

    # Création du chansonnier perso
    c = chansonnier_perso.objects.create(
        utilisateur=user,
        nom_chansonnier_perso=nom,
        couleur=couleur,
        type_papier=type_papier,
        prix_vente_unite=prix_vente_unite,
        template_chansonnier_id=template_id,
        date_creation=date.today(),
    )

    # Association des chants, si fournis
    for chant_id in chant_ids:
        try:
            contenir_chant_perso.objects.create(
                chant_id=chant_id,
                chansonnier_perso=c,
            )
        except Exception:
            # on ignore les IDs invalides pour l'instant
            continue

    return JsonResponse(
        {
            "id": c.id,
            "nom_chansonnier_perso": c.nom_chansonnier_perso,
            "couleur": c.couleur,
            "type_papier": c.type_papier,
            "prix_vente_unite": str(c.prix_vente_unite),
            "date_creation": c.date_creation.isoformat(),
            "template_id": c.template_chansonnier_id,
        },
        status=201,
    )


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def chansonnier_perso_detail_api(request, chansonnier_id):
    try:
        c = chansonnier_perso.objects.get(id=chansonnier_id)
    except chansonnier_perso.DoesNotExist:
        return JsonResponse({"error": "Chansonnier perso introuvable"}, status=404)

    if request.method == "GET":
        # On renvoie aussi la liste des chants associés
        chants_ids = list(
            contenir_chant_perso.objects.filter(chansonnier_perso=c).values_list(
                "chant_id", flat=True
            )
        )

        return JsonResponse(
            {
                "id": c.id,
                "nom_chansonnier_perso": c.nom_chansonnier_perso,
                "couleur": c.couleur,
                "type_papier": c.type_papier,
                "prix_vente_unite": str(c.prix_vente_unite),
                "date_creation": c.date_creation.isoformat(),
                "template_id": c.template_chansonnier_id,
                "chant_ids": chants_ids,
            }
        )

    if request.method == "DELETE":
        c.delete()
        return JsonResponse({"success": True})

    # PUT = mise à jour
    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    c.nom_chansonnier_perso = body.get("nom_chansonnier_perso", c.nom_chansonnier_perso)
    c.couleur = body.get("couleur", c.couleur)
    c.type_papier = body.get("type_papier", c.type_papier)
    c.prix_vente_unite = body.get("prix_vente_unite", c.prix_vente_unite)
    template_id = body.get("template_id", c.template_chansonnier_id)
    c.template_chansonnier_id = template_id

    c.save()

    # Si on a "chant_ids", on remplace complètement la liste de chants
    if "chant_ids" in body:
        chant_ids = body.get("chant_ids", [])

        contenir_chant_perso.objects.filter(chansonnier_perso=c).delete()
        for chant_id in chant_ids:
            try:
                contenir_chant_perso.objects.create(
                    chant_id=chant_id,
                    chansonnier_perso=c,
                )
            except Exception:
                continue

    return JsonResponse({"success": True})


@csrf_exempt
@require_http_methods(["GET"])
def templates_chansonniers_api(request):
    qs = template_chansonnier.objects.all()
    data = [
        {
            "id": t.id,
            # si ton modèle a un champ "nom_template", on le renvoie,
            # sinon on utilise str(t)
            "nom_template": getattr(t, "nom_template", str(t)),
        }
        for t in qs
    ]
    return JsonResponse(data, safe=False)




#----------------------------------------------------------------------------------------
#                           COMMANDES
#  ----------------------------------------------------------------------------------------


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


#details_commande
@csrf_exempt
@require_http_methods(["GET", "POST"])
def details_commande_api(request):
    if request.method == "GET":
        qs = details_commande.objects.select_related("commande", "chansonnier_perso")
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

    l = details_commande.objects.create(
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

@csrf_exempt
@require_http_methods(["GET", "POST"])
def mes_commandes_api(request):
    """
    Retourne ou crée les commandes de l'utilisateur courant (via X-User-Email).
    GET  : liste des commandes de l'utilisateur
           optionnel : ?status=XXX pour filtrer
    POST : crée une nouvelle commande pour l'utilisateur, avec la date du jour
           et un status par défaut "PANIER" (sauf si fourni dans le body).
    """
    email = request.headers.get("X-User-Email", "").lower()
    if not email:
        return JsonResponse({"error": "Email manquant"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    # Récupération
    if request.method == "GET":
        status_filter = request.GET.get("status")
        qs = commande.objects.filter(utilisateur=user).order_by("-date_commande", "-id")

        if status_filter:
            qs = qs.filter(status__iexact=status_filter)

        data = [
            {
                "id": c.id,
                "date_commande": c.date_commande.isoformat(),
                "status": c.status,
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    # Création
    if request.method == "POST":
        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            body = {}

        status_value = body.get("status", "PANIER")

        c = commande.objects.create(
            date_commande=date.today(),
            status=status_value,
            utilisateur=user,
        )

        return JsonResponse(
            {
                "id": c.id,
                "date_commande": c.date_commande.isoformat(),
                "status": c.status,
            },
            status=201,
        )




#----------------------------------------------------------------
#                           EVENENMENT
#----------------------------------------------------------------
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

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def evenement_detail_api(request, id):
    try:
        e = evenement.objects.get(id=id)
    except evenement.DoesNotExist:
        return JsonResponse({"error": "Évènement introuvable"}, status=404)

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
    
    if request.method == "DELETE":
        e.delete()
        return JsonResponse({"status": "deleted"})

    # PUT → modification (JSON)
    try:
        body = json.loads(request.body.decode("utf-8"))
    except:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    e.nom_evenement = body.get("nom_evenement", e.nom_evenement)
    e.date_evenement = body.get("date_evenement", e.date_evenement)
    e.lieu = body.get("lieu", e.lieu)
    e.annonce_fil_actu = body.get("annonce_fil_actu", e.annonce_fil_actu)
    e.histoire = body.get("histoire", e.histoire)

    e.save()

    return JsonResponse(
        {
            "id": e.id,
            "date_evenement": e.date_evenement.isoformat(),
            "lieu": e.lieu,
            "nom_evenement": e.nom_evenement,
            "annonce_fil_actu": e.annonce_fil_actu,
            "histoire": e.histoire,
        }
    )




#---------------------------------------------------------------
#                            CHANTER
#---------------------------------------------------------------
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


@csrf_exempt
@require_http_methods(["DELETE"])
def chanter_detail_api(request, chanter_id):
    try:
        c = chanter.objects.get(id=chanter_id)
    except chanter.DoesNotExist:
        return JsonResponse({"error": "Lien chant-évènement introuvable"}, status=404)

    c.delete()
    return JsonResponse({"status": "deleted"})




#CONTENIR #
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
    

    #--------------------------------------------------------
    #                           SUPPORT
    #--------------------------------------------------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def support_api(request):
    """
    GET  : (optionnel) liste des demandes de support de l'utilisateur courant
    POST : création d'une nouvelle demande de support + pièces jointes.
           Reçoit un formulaire multipart/form-data.
    """
    email = request.headers.get("X-User-Email", "").lower()
    if not email:
        return JsonResponse({"error": "Email manquant"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    # ---------- GET : liste des demandes de cet utilisateur ----------
    if request.method == "GET":
        qs = demande_support.objects.filter(utilisateur=user).order_by("-date_creation")
        data = []
        for d in qs:
            data.append({
                "id": d.id,
                "objet": d.objet,
                "description": d.description,
                "date_creation": d.date_creation.isoformat(),
                "statut": d.statut,
            })
        return JsonResponse(data, safe=False)

    # ---------- POST : création d'une demande ----------
    # On attend un formulaire multipart (FormData côté front)
    objet = request.POST.get("objet", "").strip()
    description = request.POST.get("description", "").strip()

    if not objet or not description:
        return JsonResponse(
            {"error": "objet et description sont requis"},
            status=400,
        )

    # Création de la demande
    demande = demande_support.objects.create(
        utilisateur=user,
        objet=objet,
        description=description,
    )

    # Gestion des éventuelles pièces jointes (champ "fichiers" côté front)
    fichiers = request.FILES.getlist("fichiers")
    for f in fichiers:
        piece_jointe_support.objects.create(
            demande=demande,
            fichier=f,
        )

    return JsonResponse(
        {
            "success": True,
            "id": demande.id,
            "objet": demande.objet,
            "date_creation": demande.date_creation.isoformat(),
        },
        status=201,
    )

# -----------------------------------------------------------
#                     SUPPORT - ADMIN
# -----------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET", "PATCH"])
def admin_support_api(request, ticket_id=None):
    """
    Admin : liste, détail, mise à jour des demandes de support.
    Utilise le modèle `demande_support` et `piece_jointe_support`.
    """

    # Vérification admin
    email = request.headers.get("X-User-Email", "").lower()
    if not email:
        return JsonResponse({"error": "Email manquant"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    if user.role.nom_role != "admin":
        return JsonResponse({"error": "Accès réservé aux admins"}, status=403)

    # IMPORTS corrects
    from .models import demande_support, piece_jointe_support

    # ============================================================
    # GET LISTE
    # ============================================================
    if request.method == "GET" and ticket_id is None:
        status_filter = request.GET.get("status")

        qs = demande_support.objects.select_related("utilisateur").order_by("-date_creation")

        # Conversion front → back
        mapping_front_to_back = {
            "new": "NOUVEAU",
            "in_progress": "EN_COURS",
            "closed": "RESOLU",
        }

        if status_filter in mapping_front_to_back:
            qs = qs.filter(statut=mapping_front_to_back[status_filter])

        data = []
        for d in qs:
            data.append({
                "id": d.id,
                "objet": d.objet,
                "description": d.description,
                # BACK → FRONT
                "status": {
                    "NOUVEAU": "new",
                    "EN_COURS": "in_progress",
                    "RESOLU": "closed",
                }[d.statut],
                "created_at": d.date_creation.isoformat(),
                "utilisateur": {
                    "id": d.utilisateur_id,
                    "pseudo": d.utilisateur.pseudo,
                    "email": d.utilisateur.email,
                },
                "has_attachments": d.pieces_jointes.exists(),
            })

        return JsonResponse(data, safe=False)

    # ============================================================
    # CHARGER UN TICKET
    # ============================================================
    try:
        ticket = demande_support.objects.get(id=ticket_id)
    except demande_support.DoesNotExist:
        return JsonResponse({"error": "Ticket introuvable"}, status=404)

    # ============================================================
    # GET DETAIL
    # ============================================================
    if request.method == "GET":
        attachments = []
        for att in ticket.pieces_jointes.all():
            try:
                url = request.build_absolute_uri(att.fichier.url)
            except Exception:
                url = None

            attachments.append({
                "id": att.id,
                "filename": att.fichier.name,
                "url": url,
            })

        return JsonResponse({
            "id": ticket.id,
            "objet": ticket.objet,
            "description": ticket.description,
            "status": {
                "NOUVEAU": "new",
                "EN_COURS": "in_progress",
                "RESOLU": "closed",
            }[ticket.statut],
            "created_at": ticket.date_creation.isoformat(),
            "utilisateur": {
                "id": ticket.utilisateur_id,
                "pseudo": ticket.utilisateur.pseudo,
                "email": ticket.utilisateur.email,
            },
            "attachments": attachments,
            "internal_notes": "",  # champ non existant mais attendu par ton front
        })

    # ============================================================
    # PATCH : mise à jour statut
    # ============================================================
    if request.method == "PATCH":
        body = json.loads(request.body.decode("utf-8"))

        # FRONT → BACK
        mapping_front_to_back = {
            "new": "NOUVEAU",
            "in_progress": "EN_COURS",
            "closed": "RESOLU",
        }

        new_status = body.get("status")
        if new_status in mapping_front_to_back:
            ticket.statut = mapping_front_to_back[new_status]

        ticket.save()

        return JsonResponse({"success": True})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)
