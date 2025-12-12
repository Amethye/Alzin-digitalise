from django.shortcuts import render
from django.http import HttpResponse, QueryDict
from datetime import date
from django.views.decorators.http import require_http_methods
from json import JSONDecodeError
from django.http.multipartparser import MultiPartParser, MultiPartParserError
from django.utils.datastructures import MultiValueDict
from io import BytesIO
from django.conf import settings

#views pour le site Alzin
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import check_password, make_password
from django.forms.models import model_to_dict
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db import models, IntegrityError, transaction
import os
from json import JSONDecodeError
from django.db.models import Avg, Prefetch
from django.core.exceptions import DisallowedHost


from datetime import date
def parse_iso_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


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

DELETED_USER_LABEL = "Utilisateur supprimé"
DELETED_USER_EMAIL = "deleted@alzin.local"

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
    piece_jointe_support,
    demande_chant,
    demande_chant_audio,
    demande_piste_audio,
    demande_modification_chant,
)


def _extract_body_data(request):
    """
    Django ne remplit pas request.POST/FILES pour PUT/PATCH multipart.
    On parse donc manuellement lorsqu'on reçoit ces méthodes.
    """
    if request.method not in ("PUT", "PATCH"):
        return request.POST, request.FILES

    content_type = request.META.get("CONTENT_TYPE", "")
    if content_type.startswith("multipart/"):
        stream = BytesIO(request.body)
        parser = MultiPartParser(
            request.META,
            stream,
            request.upload_handlers,
            request.encoding or settings.DEFAULT_CHARSET,
        )
        return parser.parse()

    encoding = request.encoding or settings.DEFAULT_CHARSET
    body = request.body.decode(encoding or "utf-8")
    return QueryDict(body, encoding=encoding), MultiValueDict()

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

    email = body["email"].strip().lower()
    nom = body["nom"].strip()
    prenom = body["prenom"].strip()
    pseudo = body["pseudo"].strip()

    # Vérification format email
    import re
    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    if not re.match(email_regex, email):
        return JsonResponse({"error": "Format de l'adresse email invalide."}, status=400)

    # Vérification email unique
    if utilisateur.objects.filter(email__iexact=email).exists():
        return JsonResponse({"error": "Email déjà utilisé."}, status=409)

    # Vérification pseudo unique
    if utilisateur.objects.filter(pseudo__iexact=pseudo).exists():
        return JsonResponse({"error": "Pseudo déjà utilisé."}, status=409)

    # Vérification nom + prénom unique ensemble
    if utilisateur.objects.filter(nom__iexact=nom, prenom__iexact=prenom).exists():
        return JsonResponse({"error": "Un utilisateur avec le même nom et prénom existe déjà."}, status=409)

    # Attribution rôle user
    try:
        role_user = role.objects.get(nom_role="user")
    except role.DoesNotExist:
        return JsonResponse({"error": "Le rôle 'user' n'existe pas dans la base."}, status=500)

    # Création utilisateur avec mot de passe hashé
    u = utilisateur.objects.create(
        email=email,
        nom=nom,
        prenom=prenom,
        pseudo=pseudo,
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


# -----------------------------------------------------------
#                DEMANDES CHANTS - ADMIN
# -----------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET", "PATCH"])
def admin_demandes_chants_api(request, demande_id=None):
    admin_user, error = _require_authenticated_user(request)
    if error:
        return error

    if admin_user.role.nom_role != "admin":
        return JsonResponse({"error": "Accès réservé aux admins"}, status=403)

    if request.method == "GET" and demande_id is None:
        statut = request.GET.get("statut")
        qs = (
            demande_chant.objects.select_related("utilisateur")
            .prefetch_related("pistes_audio")
            .order_by("-date_creation")
        )
        if statut in {"EN_ATTENTE", "ACCEPTEE", "REFUSEE"}:
            qs = qs.filter(statut=statut)
        data = [serialize_demande_chant(request, d) for d in qs]
        return JsonResponse(data, safe=False)

    try:
        demande = demande_chant.objects.select_related("utilisateur").prefetch_related("pistes_audio").get(
            id=demande_id
        )
    except demande_chant.DoesNotExist:
        return JsonResponse({"error": "Demande introuvable"}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_demande_chant(request, demande))

    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        body = {}

    action = (body.get("action") or "").upper()

    if action == "ACCEPTER":
        if demande.statut != "EN_ATTENTE":
            return JsonResponse({"error": "Demande déjà traitée"}, status=400)
        if chant.objects.filter(nom_chant__iexact=demande.nom_chant).exists():
            return JsonResponse({"error": "Un chant avec ce nom existe déjà."}, status=409)

        new_chant = _create_chant_from_demande(demande)
        demande.statut = "ACCEPTEE"
        demande.justification_refus = None
        demande.date_decision = timezone.now()
        demande.save(update_fields=["statut", "justification_refus", "date_decision"])

        return JsonResponse(
            {
                "demande": serialize_demande_chant(request, demande),
                "chant": serialize_chant(request, new_chant),
            }
        )

    if action == "REFUSER":
        justification = (body.get("justification") or "").strip()
        if not justification:
            return JsonResponse({"error": "Justification requise pour un refus."}, status=400)
        if demande.statut != "EN_ATTENTE":
            return JsonResponse({"error": "Demande déjà traitée"}, status=400)

        demande.statut = "REFUSEE"
        demande.justification_refus = justification
        demande.date_decision = timezone.now()
        demande.save(update_fields=["statut", "justification_refus", "date_decision"])
        return JsonResponse({"demande": serialize_demande_chant(request, demande)})

    return JsonResponse({"error": "Action invalide"}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PATCH"])
def admin_demandes_audio_api(request, demande_id=None):
    admin_user, error = _require_authenticated_user(request)
    if error:
        return error

    if admin_user.role.nom_role != "admin":
        return JsonResponse({"error": "Accès réservé aux admins"}, status=403)

    if request.method == "GET" and demande_id is None:
        statut = request.GET.get("statut")
        qs = demande_piste_audio.objects.select_related("utilisateur", "chant").order_by("-date_creation")
        if statut in {"EN_ATTENTE", "ACCEPTEE", "REFUSEE"}:
            qs = qs.filter(statut=statut)
        data = [serialize_demande_audio(request, d) for d in qs]
        return JsonResponse(data, safe=False)

    try:
        demande = demande_piste_audio.objects.select_related("utilisateur", "chant").get(id=demande_id)
    except demande_piste_audio.DoesNotExist:
        return JsonResponse({"error": "Demande introuvable"}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_demande_audio(request, demande))

    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        body = {}

    action = (body.get("action") or "").upper()

    if action == "ACCEPTER":
        if demande.statut != "EN_ATTENTE":
            return JsonResponse({"error": "Demande déjà traitée"}, status=400)
        piste = _create_piste_audio_from_demande_audio(demande)
        demande.statut = "ACCEPTEE"
        demande.justification_refus = None
        demande.date_decision = timezone.now()
        demande.save(update_fields=["statut", "justification_refus", "date_decision"])
        return JsonResponse(
            {
                "demande": serialize_demande_audio(request, demande),
                "piste_audio": {
                    "id": piste.id if piste else None,
                    "chant_id": demande.chant_id,
                },
            }
        )

    if action == "REFUSER":
        justification = (body.get("justification") or "").strip()
        if not justification:
            return JsonResponse({"error": "Justification requise pour un refus."}, status=400)
        if demande.statut != "EN_ATTENTE":
            return JsonResponse({"error": "Demande déjà traitée"}, status=400)
        demande.statut = "REFUSEE"
        demande.justification_refus = justification
        demande.date_decision = timezone.now()
        demande.save(update_fields=["statut", "justification_refus", "date_decision"])
        return JsonResponse({"demande": serialize_demande_audio(request, demande)})

    return JsonResponse({"error": "Action invalide"}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PATCH"])
def admin_demandes_modification_api(request, demande_id=None):
    admin_user, error = _require_authenticated_user(request)
    if error:
        return error

    if admin_user.role.nom_role != "admin":
        return JsonResponse({"error": "Accès réservé aux admins"}, status=403)

    if request.method == "GET" and demande_id is None:
        statut = request.GET.get("statut")
        qs = demande_modification_chant.objects.select_related("utilisateur", "chant").order_by("-date_creation")
        if statut in {"EN_ATTENTE", "ACCEPTEE", "REFUSEE"}:
            qs = qs.filter(statut=statut)
        data = [serialize_demande_modification(request, d) for d in qs]
        return JsonResponse(data, safe=False)

    try:
        demande = demande_modification_chant.objects.select_related("utilisateur", "chant").get(id=demande_id)
    except demande_modification_chant.DoesNotExist:
        return JsonResponse({"error": "Demande introuvable"}, status=404)

    if request.method == "GET":
        return JsonResponse(serialize_demande_modification(request, demande))

    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        body = {}

    action = (body.get("action") or "").upper()

    if action == "ACCEPTER":
        if demande.statut != "EN_ATTENTE":
            return JsonResponse({"error": "Demande déjà traitée"}, status=400)
        _apply_modification_to_chant(demande)
        demande.statut = "ACCEPTEE"
        demande.justification_refus = None
        demande.date_decision = timezone.now()
        demande.save(update_fields=["statut", "justification_refus", "date_decision"])
        return JsonResponse({"demande": serialize_demande_modification(request, demande)})

    if action == "REFUSER":
        justification = (body.get("justification") or "").strip()
        if not justification:
            return JsonResponse({"error": "Justification requise pour un refus."}, status=400)
        if demande.statut != "EN_ATTENTE":
            return JsonResponse({"error": "Demande déjà traitée"}, status=400)
        demande.statut = "REFUSEE"
        demande.justification_refus = justification
        demande.date_decision = timezone.now()
        demande.save(update_fields=["statut", "justification_refus", "date_decision"])
        return JsonResponse({"demande": serialize_demande_modification(request, demande)})

    return JsonResponse({"error": "Action invalide"}, status=400)

#------------------------------------------------------------------------
                                #RESET PASSWORD
#------------------------------------------------------------------------
@csrf_exempt
def reset_password_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    try:
        body = json.loads(request.body.decode("utf-8"))
    except:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    email = body.get("email")
    old_password = body.get("old_password")
    new_password = body.get("new_password")

    if not email or not old_password or not new_password:
        return JsonResponse({"error": "Champs manquants"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    # Vérification ancien mdp
    if not check_password(old_password, user.password):
        return JsonResponse({"error": "Ancien mot de passe incorrect"}, status=401)

    # Mettre à jour
    user.password = make_password(new_password)
    user.save()

    return JsonResponse({"ok": True, "message": "Mot de passe mis à jour avec succès"})

#------------------------------------------------------------------------
                                #LOGOUT
#------------------------------------------------------------------------
@csrf_exempt
def logout_api(request):
    if request.method != "POST":
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    return JsonResponse({"success": True})


def _cleanup_user_relations(user_obj: utilisateur):

    # Relations SET_NULL
    chant.objects.filter(utilisateur=user_obj).update(utilisateur=None)
    appartenir.objects.filter(utilisateur=user_obj).update(utilisateur=None)
    piste_audio.objects.filter(utilisateur=user_obj).update(utilisateur=None)

    # Relations en cascade (on supprime les objets dépendants)
    demande_chant.objects.filter(utilisateur=user_obj).delete()
    demande_modification_chant.objects.filter(utilisateur=user_obj).delete()
    demande_piste_audio.objects.filter(utilisateur=user_obj).delete()
    noter.objects.filter(utilisateur=user_obj).delete()
    favoris.objects.filter(utilisateur=user_obj).delete()
    commentaire.objects.filter(utilisateur=user_obj).delete()
    chansonnier_perso.objects.filter(utilisateur=user_obj).delete()
    commande.objects.filter(utilisateur=user_obj).delete()
    demande_support.objects.filter(utilisateur=user_obj).delete()


#------------------------------------------------------------------------
                                #ADMIN_USER
#------------------------------------------------------------------------
@csrf_exempt
def admin_users_api(request, user_id=None, action=None):

    # Préflight CORS pour les requêtes cross-origin (DELETE/PUT)
    if request.method == "OPTIONS":
        return JsonResponse({"ok": True})

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

    if user_id is None:
        return JsonResponse({"error": "Paramètre 'user_id' requis"}, status=400)

    # On cherche l'utilisateur si user_id est fourni
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
        try:
            with transaction.atomic():
                _cleanup_user_relations(user)
                user.delete()
        except IntegrityError:
            return JsonResponse(
                {"error": "Impossible de supprimer cet utilisateur (données liées)."},
                status=400,
            )
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

#------------------------------------------------------------------------
                            #CHANTS
#------------------------------------------------------------------------
def _absolute_media_url(request, relative_url: str | None):
    if not relative_url:
        return None
    if relative_url.startswith(("http://", "https://")):
        return relative_url
    try:
        return request.build_absolute_uri(relative_url)
    except DisallowedHost:
        return relative_url


def _resolve_demande_categorie(form_data):
    if not form_data:
        return None

    cat_id = form_data.get("categorie_id")
    if cat_id:
        try:
            return categorie.objects.get(id=int(cat_id))
        except (ValueError, categorie.DoesNotExist):
            pass

    if hasattr(form_data, "getlist"):
        for cat_name in form_data.getlist("categories"):
            if not cat_name:
                continue
            try:
                return categorie.objects.get(nom_categorie=cat_name)
            except categorie.DoesNotExist:
                continue

    cat_name = (form_data.get("categorie") or form_data.get("nom_categorie") or "").strip()
    if cat_name:
        try:
            return categorie.objects.get(nom_categorie=cat_name)
        except categorie.DoesNotExist:
            pass

    return None


ACCEPTED_MODIFICATIONS_PREFETCH = Prefetch(
    "demandes_modifications",
    queryset=demande_modification_chant.objects.filter(statut="ACCEPTEE")
        .select_related("utilisateur")
        .order_by("-date_decision"),
    to_attr="accepted_modifications",
)


def serialize_chant(request, c):

    # ----------- Construction du JSON principal -----------
    data = {
        "id": c.id,
        "nom_chant": c.nom_chant,
        "auteur": c.auteur or "",
        "ville_origine": c.ville_origine or "",
        "paroles": c.paroles,
        "description": c.description or "",
        "utilisateur_id": c.utilisateur_id,
        "utilisateur_pseudo": c.utilisateur.pseudo if c.utilisateur else None,

        # FICHIERS (URLs absolues)
        "illustration_chant_url": _absolute_media_url(
            request,
            c.illustration_chant.url if c.illustration_chant else None
        ),
        "paroles_pdf_url": _absolute_media_url(
            request,
            c.paroles_pdf.url if c.paroles_pdf else None
        ),
        "partition_url": _absolute_media_url(
            request,
            c.partition.url if c.partition else None
        ),

        # CATÉGORIES
        "categories": [
            rel.categorie.nom_categorie
            for rel in c.categories_associees.all()
        ],

        # PISTES AUDIO (avec notes)
        "pistes_audio": [],
    }

    # ----------- Ajouter pistes audio + notes -----------
    for pa in c.pistes_audio.all():

        notes_qs = noter.objects.filter(piste_audio=pa)

        nb_notes = notes_qs.count()

        note_moyenne = notes_qs.aggregate(
            Avg("valeur_note")
        )["valeur_note__avg"] or 0.0

        data["pistes_audio"].append({
            "id": pa.id,
            "fichier_mp3": (
                pa.fichier_mp3.url if pa.fichier_mp3 else None
            ),
            "utilisateur_id": pa.utilisateur_id,
            "utilisateur_pseudo": pa.utilisateur.pseudo if pa.utilisateur else None,
            "note_moyenne": float(note_moyenne),
            "nb_notes": nb_notes,
        })

    accepted_modifications = getattr(c, "accepted_modifications", None) or []
    last_modification = accepted_modifications[0] if accepted_modifications else None
    data["a_ete_modifie"] = bool(last_modification)

    return data


def _require_authenticated_user(request):
    email = request.headers.get("X-User-Email", "").lower()
    if not email:
        return None, JsonResponse({"error": "Email manquant"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return None, JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    return user, None


def serialize_demande_chant(request, demande):
    return {
        "id": demande.id,
        "nom_chant": demande.nom_chant,
        "auteur": demande.auteur or "",
        "ville_origine": demande.ville_origine or "",
        "paroles": demande.paroles or "",
        "description": demande.description or "",
        "categories": (
            [demande.categorie.nom_categorie]
            if demande.categorie
            else []
        ),
        "categorie": {
            "id": demande.categorie_id,
            "nom_categorie": demande.categorie.nom_categorie,
        } if demande.categorie else None,
        "statut": demande.statut,
        "justification_refus": demande.justification_refus,
        "date_creation": demande.date_creation.isoformat(),
        "date_decision": demande.date_decision.isoformat() if demande.date_decision else None,
        "utilisateur": {
            "id": demande.utilisateur_id,
            "pseudo": demande.utilisateur.pseudo,
            "email": demande.utilisateur.email,
        },
        "illustration_chant_url": _absolute_media_url(
            request,
            demande.illustration_chant.url if demande.illustration_chant else None,
        ),
        "paroles_pdf_url": _absolute_media_url(
            request,
            demande.paroles_pdf.url if demande.paroles_pdf else None,
        ),
        "partition_url": _absolute_media_url(
            request,
            demande.partition.url if demande.partition else None,
        ),
        "pistes_audio": [
            {
                "id": audio.id,
                "fichier_mp3": _absolute_media_url(request, audio.fichier_mp3.url),
            }
            for audio in demande.pistes_audio.all()
        ],
    }


def serialize_demande_audio(request, demande):
    return {
        "id": demande.id,
        "statut": demande.statut,
        "justification_refus": demande.justification_refus,
        "date_creation": demande.date_creation.isoformat(),
        "date_decision": demande.date_decision.isoformat() if demande.date_decision else None,
        "chant": {
            "id": demande.chant_id,
            "nom_chant": demande.chant.nom_chant,
        },
        "utilisateur": {
            "id": demande.utilisateur_id,
            "pseudo": demande.utilisateur.pseudo,
            "email": demande.utilisateur.email,
        },
        "fichier_mp3_url": _absolute_media_url(
            request, demande.fichier_mp3.url if demande.fichier_mp3 else None
        ),
    }


def serialize_demande_modification(request, demande):
    data = {
        "id": demande.id,
        "nom_chant": demande.nom_chant,
        "auteur": demande.auteur or "",
        "ville_origine": demande.ville_origine or "",
        "paroles": demande.paroles or "",
        "description": demande.description or "",
        "categories": demande.categories or [],
        "statut": demande.statut,
        "justification_refus": demande.justification_refus,
        "date_creation": demande.date_creation.isoformat(),
        "date_decision": demande.date_decision.isoformat() if demande.date_decision else None,
        "utilisateur": {
            "id": demande.utilisateur_id,
            "pseudo": demande.utilisateur.pseudo,
            "email": demande.utilisateur.email,
        },
        "illustration_chant_url": _absolute_media_url(
            request,
            demande.illustration_chant.url if demande.illustration_chant else None,
        ),
        "paroles_pdf_url": _absolute_media_url(
            request,
            demande.paroles_pdf.url if demande.paroles_pdf else None,
        ),
        "partition_url": _absolute_media_url(
            request,
            demande.partition.url if demande.partition else None,
        ),
        "chant_id": demande.chant_id,
        "chant_nom": demande.chant.nom_chant,
    }
    return data


def _clone_field_file(field_file):
    if not field_file:
        return None, None
    try:
        file_name = os.path.basename(field_file.name)
    except Exception:
        file_name = None
    field_file.open("rb")
    content = field_file.read()
    field_file.close()
    if not content or not file_name:
        return None, None
    return ContentFile(content), file_name


def _create_chant_from_demande(demande):
    illustration_content, illustration_name = _clone_field_file(demande.illustration_chant)
    pdf_content, pdf_name = _clone_field_file(demande.paroles_pdf)
    partition_content, partition_name = _clone_field_file(demande.partition)

    new_chant = chant(
        nom_chant=demande.nom_chant,
        auteur=demande.auteur,
        ville_origine=demande.ville_origine,
        paroles=demande.paroles,
        description=demande.description,
        utilisateur=demande.utilisateur,
    )

    if illustration_content:
        new_chant.illustration_chant.save(illustration_name, illustration_content, save=False)
    if pdf_content:
        new_chant.paroles_pdf.save(pdf_name, pdf_content, save=False)
    if partition_content:
        new_chant.partition.save(partition_name, partition_content, save=False)

    new_chant.save()

    demande_cat = demande.categorie
    if not demande_cat:
        demande_cat = categorie.objects.filter(nom_categorie="Autre").first()
    if demande_cat:
        appartenir.objects.create(
            categorie=demande_cat,
            chant=new_chant,
            utilisateur=demande.utilisateur,
        )

    for audio in demande.pistes_audio.all():
        audio_content, audio_name = _clone_field_file(audio.fichier_mp3)
        if not audio_content:
            continue
        piste = piste_audio(
            chant=new_chant,
            utilisateur=demande.utilisateur,
        )
        piste.fichier_mp3.save(audio_name, audio_content, save=False)
        piste.save()

    return new_chant


def _create_piste_audio_from_demande_audio(demande):
    audio_content, audio_name = _clone_field_file(demande.fichier_mp3)
    if not audio_content or not audio_name:
        return None
    piste = piste_audio(
        chant=demande.chant,
        utilisateur=demande.utilisateur,
    )
    piste.fichier_mp3.save(audio_name, audio_content, save=False)
    piste.save()
    return piste


def _apply_modification_to_chant(demande):
    chant_obj = demande.chant
    chant_obj.nom_chant = demande.nom_chant
    chant_obj.auteur = demande.auteur
    chant_obj.ville_origine = demande.ville_origine
    chant_obj.paroles = demande.paroles
    chant_obj.description = demande.description
    chant_obj.utilisateur = demande.utilisateur

    illustration_content, illustration_name = _clone_field_file(demande.illustration_chant)
    pdf_content, pdf_name = _clone_field_file(demande.paroles_pdf)
    partition_content, partition_name = _clone_field_file(demande.partition)

    if illustration_content:
        chant_obj.illustration_chant.save(illustration_name, illustration_content, save=False)
    if pdf_content:
        chant_obj.paroles_pdf.save(pdf_name, pdf_content, save=False)
    if partition_content:
        chant_obj.partition.save(partition_name, partition_content, save=False)

    chant_obj.save()

    categories = demande.categories or []
    if not categories:
        categories = ["Autre"]
    appartenir.objects.filter(chant=chant_obj).delete()
    for cat_name in categories:
        try:
            cat_obj = categorie.objects.get(nom_categorie=cat_name)
        except categorie.DoesNotExist:
            continue
        appartenir.objects.create(
            categorie=cat_obj,
            chant=chant_obj,
            utilisateur=demande.utilisateur,
        )

    return chant_obj


def delete_file_field(instance, field_name):
    field = getattr(instance, field_name, None)
    if field and hasattr(field, "path") and os.path.exists(field.path):
        os.remove(field.path)
    setattr(instance, field_name, None)
    instance.save()


@csrf_exempt
@require_http_methods(["GET", "POST"])
def demandes_chants_api(request, demande_id=None):
    user, error = _require_authenticated_user(request)
    if error:
        return error

    if demande_id:
        try:
            demande = demande_chant.objects.select_related("utilisateur", "categorie").prefetch_related("pistes_audio").get(
                id=demande_id, utilisateur=user
            )
        except demande_chant.DoesNotExist:
            return JsonResponse({"error": "Demande introuvable"}, status=404)

        if request.method == "GET":
            return JsonResponse(serialize_demande_chant(request, demande))

        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    if request.method == "GET":
        qs = (
            demande_chant.objects
            .filter(utilisateur=user)
            .select_related("categorie")
            .prefetch_related("pistes_audio")
            .order_by("-date_creation")
        )
        data = [serialize_demande_chant(request, d) for d in qs]
        return JsonResponse(data, safe=False)

    try:
        form_data, form_files = _extract_body_data(request)
    except MultiPartParserError:
        return JsonResponse({"error": "Formulaire invalide"}, status=400)

    nom_chant = (form_data.get("nom_chant") or "").strip()
    if not nom_chant:
        return JsonResponse({"error": "nom_chant requis"}, status=400)

    if chant.objects.filter(nom_chant__iexact=nom_chant).exists():
        return JsonResponse({"error": "Un chant avec ce nom existe déjà."}, status=409)
    if demande_chant.objects.filter(nom_chant__iexact=nom_chant, statut="EN_ATTENTE").exists():
        return JsonResponse({"error": "Une demande avec ce nom est déjà en attente."}, status=409)

    categorie_obj = _resolve_demande_categorie(form_data)

    demande = demande_chant.objects.create(
        utilisateur=user,
        nom_chant=nom_chant,
        auteur=form_data.get("auteur") or "",
        ville_origine=form_data.get("ville_origine") or "",
        paroles=form_data.get("paroles") or "",
        description=form_data.get("description") or "",
        categorie=categorie_obj,
    )

    if form_files.get("illustration_chant"):
        demande.illustration_chant = form_files["illustration_chant"]
    if form_files.get("paroles_pdf"):
        demande.paroles_pdf = form_files["paroles_pdf"]
    if form_files.get("partition"):
        demande.partition = form_files["partition"]

    demande.save()

    for audio_file in form_files.getlist("new_audio"):
        if audio_file:
            demande_chant_audio.objects.create(demande=demande, fichier_mp3=audio_file)

    return JsonResponse(serialize_demande_chant(request, demande), status=201)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def demandes_audio_api(request, demande_id=None):
    user, error = _require_authenticated_user(request)
    if error:
        return error

    if demande_id:
        try:
            demande = demande_piste_audio.objects.select_related("utilisateur", "chant").get(
                id=demande_id, utilisateur=user
            )
        except demande_piste_audio.DoesNotExist:
            return JsonResponse({"error": "Demande introuvable"}, status=404)

        if request.method == "GET":
            return JsonResponse(serialize_demande_audio(request, demande))
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    if request.method == "GET":
        qs = demande_piste_audio.objects.filter(utilisateur=user).select_related("chant").order_by("-date_creation")
        data = [serialize_demande_audio(request, d) for d in qs]
        return JsonResponse(data, safe=False)

    try:
        form_data, form_files = _extract_body_data(request)
    except MultiPartParserError:
        return JsonResponse({"error": "Formulaire invalide"}, status=400)

    chant_id = form_data.get("chant_id")
    if not chant_id:
        return JsonResponse({"error": "chant_id requis"}, status=400)

    try:
        chant_obj = chant.objects.get(id=chant_id)
    except chant.DoesNotExist:
        return JsonResponse({"error": "Chant introuvable"}, status=404)

    fichier_mp3 = form_files.get("fichier_mp3")
    if not fichier_mp3:
        return JsonResponse({"error": "fichier_mp3 requis"}, status=400)

    demande = demande_piste_audio.objects.create(
        utilisateur=user,
        chant=chant_obj,
        fichier_mp3=fichier_mp3,
    )

    return JsonResponse(serialize_demande_audio(request, demande), status=201)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def demandes_modification_chant_api(request, demande_id=None):
    user, error = _require_authenticated_user(request)
    if error:
        return error

    if demande_id:
        try:
            demande = demande_modification_chant.objects.select_related("chant", "utilisateur").get(
                id=demande_id, utilisateur=user
            )
        except demande_modification_chant.DoesNotExist:
            return JsonResponse({"error": "Demande introuvable"}, status=404)

        if request.method == "GET":
            return JsonResponse(serialize_demande_modification(request, demande))
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    if request.method == "GET":
        qs = demande_modification_chant.objects.filter(utilisateur=user).select_related("chant").order_by(
            "-date_creation"
        )
        data = [serialize_demande_modification(request, d) for d in qs]
        return JsonResponse(data, safe=False)

    try:
        form_data, form_files = _extract_body_data(request)
    except MultiPartParserError:
        return JsonResponse({"error": "Formulaire invalide"}, status=400)

    chant_id = form_data.get("chant_id")
    if not chant_id:
        return JsonResponse({"error": "chant_id requis"}, status=400)
    try:
        chant_obj = chant.objects.get(id=chant_id)
    except chant.DoesNotExist:
        return JsonResponse({"error": "Chant introuvable"}, status=404)

    nom_chant = (form_data.get("nom_chant") or "").strip()
    if not nom_chant:
        return JsonResponse({"error": "nom_chant requis"}, status=400)

    categories = form_data.getlist("categories")
    categories = [c for c in categories if c]

    demande = demande_modification_chant.objects.create(
        utilisateur=user,
        chant=chant_obj,
        nom_chant=nom_chant,
        auteur=form_data.get("auteur") or "",
        ville_origine=form_data.get("ville_origine") or "",
        paroles=form_data.get("paroles") or "",
        description=form_data.get("description") or "",
        categories=categories,
    )

    if form_files.get("illustration_chant"):
        demande.illustration_chant = form_files["illustration_chant"]
    if form_files.get("paroles_pdf"):
        demande.paroles_pdf = form_files["paroles_pdf"]
    if form_files.get("partition"):
        demande.partition = form_files["partition"]

    demande.save()

    return JsonResponse(serialize_demande_modification(request, demande), status=201)


@csrf_exempt
def chants_api(request, chant_id=None):

    #                     DETAIL (chant_id donné)
    if chant_id:
        try:
            c = (
                chant.objects
                .prefetch_related(
                    "pistes_audio",
                    "categories_associees__categorie",
                    ACCEPTED_MODIFICATIONS_PREFETCH,
                )
                .get(id=chant_id)
            )
        except chant.DoesNotExist:
            return JsonResponse({"error": "Chant introuvable"}, status=404)

        # ---------- GET ----------
        if request.method == "GET":
            return JsonResponse(serialize_chant(request, c))
        
        #        DELETE D'UN FICHIER SPÉCIFIQUE (field=xxx)
        if request.method == "DELETE" and request.GET.get("field"):
            field = request.GET.get("field")

            mapping = {
                "illustration": "illustration_chant",
                "pdf": "paroles_pdf",
                "partition": "partition"
            }

            if field not in mapping:
                return JsonResponse({"error": "Champ invalide"}, status=400)

            file_field = mapping[field]
            f = getattr(c, file_field)

            if f:
                f.delete()
                setattr(c, file_field, None)
                c.save()

            return JsonResponse({"success": True})

        # ---------- DELETE du chant entier ----------
        if request.method == "DELETE":
            c.delete()
            return JsonResponse({"success": True})

        # ========================================================
        #               MAJ (PUT ou PATCH)
        # ========================================================
        if request.method in ("PUT", "PATCH"):
            try:
                form_data, form_files = _extract_body_data(request)
            except MultiPartParserError:
                return JsonResponse({"error": "Fichiers ou données invalides"}, status=400)

            utilisateur_id = form_data.get("utilisateur_id")
            user_obj = None
            if utilisateur_id:
                try:
                    user_obj = utilisateur.objects.get(id=utilisateur_id)
                except utilisateur.DoesNotExist:
                    return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

            # Champs texte
            c.nom_chant = form_data.get("nom_chant", c.nom_chant)
            c.auteur = form_data.get("auteur", c.auteur)
            c.ville_origine = form_data.get("ville_origine", c.ville_origine)
            c.paroles = form_data.get("paroles", c.paroles)
            c.description = form_data.get("description", c.description)

            if user_obj:
                c.utilisateur = user_obj

            # MAJ Catégories
            categories = form_data.getlist("categories")
            if categories:
                appartenir.objects.filter(chant=c).delete()
                for cat_name in categories:
                    cat_obj, _ = categorie.objects.get_or_create(nom_categorie=cat_name)
                    appartenir.objects.create(
                        chant=c,
                        categorie=cat_obj,
                        utilisateur=user_obj or c.utilisateur
                    )

            # MAJ fichiers si envoyés
            if "illustration_chant" in form_files:
                c.illustration_chant = form_files["illustration_chant"]

            if "paroles_pdf" in form_files:
                c.paroles_pdf = form_files["paroles_pdf"]

            if "partition" in form_files:
                c.partition = form_files["partition"]

            c.save()

            return JsonResponse({"success": True})

        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

    # ============================================================
    #                     LISTE DES CHANTS
    # ============================================================
    if request.method == "GET":
        qs = (
            chant.objects
            .all()
            .prefetch_related(
                "pistes_audio",
                "categories_associees__categorie",
                ACCEPTED_MODIFICATIONS_PREFETCH,
            )
            .order_by("nom_chant")
        )
        return JsonResponse(
            [serialize_chant(request, c) for c in qs],
            safe=False
        )

    # ============================================================
    #                     CREATION D'UN CHANT
    # ============================================================
    if request.method == "POST":
        nom = request.POST.get("nom_chant")
        paroles = request.POST.get("paroles")
        utilisateur_id = request.POST.get("utilisateur_id")

        user_obj = None
        if utilisateur_id:
            try:
                user_obj = utilisateur.objects.get(id=utilisateur_id)
            except utilisateur.DoesNotExist:
                return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

        if not nom or not paroles:
            return JsonResponse({"error": "Champs requis manquants"}, status=400)

        c = chant.objects.create(
            nom_chant=nom,
            auteur=request.POST.get("auteur", ""),
            ville_origine=request.POST.get("ville_origine", ""),
            paroles=paroles,
            description=request.POST.get("description", ""),
            utilisateur=user_obj,
        )

        # Catégories (valeur par défaut "Autre")
        categories = request.POST.getlist("categories")
        if not categories:
            categories = ["Autre"]

        for cat_name in categories:
            cat_obj, _ = categorie.objects.get_or_create(nom_categorie=cat_name)
            appartenir.objects.create(
                chant=c,
                categorie=cat_obj,
                utilisateur=user_obj
            )

        # Fichiers
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

    # === AJOUTER UNE CATEGORIE À UN CHANT ===
    if request.method == "POST":
        try:
            body = json.loads(request.body.decode())
        except:
            return JsonResponse({"error": "JSON invalide"}, status=400)

        chant_id = body.get("chant_id")
        cat_name = body.get("nom_categorie") or body.get("categorie")
        utilisateur_id = body.get("utilisateur_id")

        if not chant_id:
            return JsonResponse({"error": "Champs manquants"}, status=400)
        if not cat_name:
            cat_name = "Autre"

        # --- Vérifier le chant ---
        try:
            ch = chant.objects.get(id=chant_id)
        except chant.DoesNotExist:
            return JsonResponse({"error": "Chant introuvable"}, status=404)

        # --- Vérifier / déduire l’utilisateur ---
        user_obj = None
        if utilisateur_id:
            try:
                user_obj = utilisateur.objects.get(id=utilisateur_id)
            except utilisateur.DoesNotExist:
                return JsonResponse({"error": "Utilisateur introuvable"}, status=404)
        elif ch.utilisateur:
            user_obj = ch.utilisateur

        # --- Récupérer / créer la catégorie ---
        cat, _ = categorie.objects.get_or_create(nom_categorie=cat_name)

        # --- Créer la relation appartenir ---
        rel, created = appartenir.objects.get_or_create(
            chant=ch,
            categorie=cat,
            utilisateur=user_obj
        )

        return JsonResponse({
            "success": True,
            "created": created,
            "categorie": cat_name,
            "utilisateur_id": user_obj.id if user_obj else None
        })

    # === SUPPRIMER UNE CATEGORIE D’UN CHANT ===
    if request.method == "DELETE":
        chant_id = request.GET.get("chant_id")
        cat_name = request.GET.get("nom_categorie") or request.GET.get("categorie")

        if not chant_id:
            return JsonResponse({"error": "chant_id requis"}, status=400)

        rels = appartenir.objects.filter(chant_id=chant_id)
        if cat_name:
            rels = rels.filter(categorie__nom_categorie=cat_name)

        count = rels.count()
        if count == 0:
            return JsonResponse({"error": "Relation introuvable"}, status=404)

        rels.delete()
        return JsonResponse({"success": True, "deleted": count})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

#------------------------------------------------------------------------
#                           PISTE AUDIO
#------------------------------------------------------------------------
@csrf_exempt
def pistes_audio_api(request, piste_id=None):

    # ---------- GET LISTE ----------
    if request.method == "GET" and piste_id is None:
        qs = piste_audio.objects.all()

        data = []
        for p in qs:
            notes = noter.objects.filter(piste_audio=p)
            avg = notes.aggregate(avg=Avg("valeur_note"))["avg"] or 0
            count = notes.count()

            data.append({
                "id": p.id,
                "fichier_mp3": p.fichier_mp3.url if p.fichier_mp3 else None,
                "chant_id": p.chant_id,
                "utilisateur_id": p.utilisateur_id,
                "note_moyenne": round(avg, 2),
                "nb_notes": count,
            })

        return JsonResponse(data, safe=False)

    # ---------- GET DETAIL ----------
    if request.method == "GET" and piste_id:
        try:
            p = piste_audio.objects.get(id=piste_id)
        except piste_audio.DoesNotExist:
            return JsonResponse({"error": "Not found"}, status=404)

        notes = noter.objects.filter(piste_audio=p)
        avg = notes.aggregate(avg=Avg("valeur_note"))["avg"] or 0
        count = notes.count()

        return JsonResponse({
            "id": p.id,
            "fichier_mp3": p.fichier_mp3.url if p.fichier_mp3 else None,
            "chant_id": p.chant_id,
            "utilisateur_id": p.utilisateur_id,
            "note_moyenne": round(avg, 2),
            "nb_notes": count,
        })

    # ---------- POST UPLOAD ----------
    if request.method == "POST":
        chant_id = request.POST.get("chant_id")
        utilisateur_id = request.POST.get("utilisateur_id")

        if "fichier_mp3" not in request.FILES:
            return JsonResponse({"error": "MP3 manquant"}, status=400)

        if not chant_id:
            return JsonResponse({"error": "chant_id requis"}, status=400)

        if not utilisateur_id:
            return JsonResponse({"error": "utilisateur_id requis"}, status=400)

        try:
            ch = chant.objects.get(id=chant_id)
        except chant.DoesNotExist:
            return JsonResponse({"error": "Chant introuvable"}, status=404)

        try:
            user_obj = utilisateur.objects.get(id=utilisateur_id)
        except utilisateur.DoesNotExist:
            return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

        mp3 = request.FILES["fichier_mp3"]

        p = piste_audio.objects.create(
            fichier_mp3=mp3,
            chant=ch,
            utilisateur=user_obj,
        )

        return JsonResponse({
            "id": p.id,
            "fichier_mp3": p.fichier_mp3.url,
            "chant_id": p.chant_id,
            "utilisateur_id": p.utilisateur_id,
        }, status=201)

    # ---------- DELETE ----------
    if request.method == "DELETE":
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

    # ---------- GET (liste + moyenne) ----------
    if request.method == "GET":
        piste_id = request.GET.get("piste_id")

        qs = noter.objects.all()

        if piste_id:
            qs = qs.filter(piste_audio_id=piste_id)

        notes_list = [
            {
                "id": n.id,
                "utilisateur_id": n.utilisateur_id,
                "piste_audio_id": n.piste_audio_id,
                "valeur_note": n.valeur_note,
                "date_rating": n.date_rating.isoformat(),
            }
            for n in qs
        ]

        moyenne = qs.aggregate(models.Avg("valeur_note"))["valeur_note__avg"]
        nb_notes = qs.count()

        return JsonResponse({
            "notes": notes_list,
            "moyenne": round(moyenne, 2) if moyenne else 0,
            "nb_notes": nb_notes
        })

    # ---------- POST (créer ou modifier note) ----------
    if request.method == "POST":
        body = json.loads(request.body.decode("utf-8"))

        user_id = body["utilisateur_id"]
        piste_id = body["piste_audio_id"]
        valeur = body["valeur_note"]

        # update_or_create = AUTO : met à jour si existe, sinon crée
        note, created = noter.objects.update_or_create(
            utilisateur_id=user_id,
            piste_audio_id=piste_id,
            defaults={"valeur_note": valeur}
        )

        return JsonResponse({
            "id": note.id,
            "utilisateur_id": note.utilisateur_id,
            "piste_audio_id": note.piste_audio_id,
            "valeur_note": note.valeur_note,
            "date_rating": note.date_rating.isoformat(),
            "created": created
        }, status=201)

    # ---------- DELETE ----------
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
@require_http_methods(["GET", "POST", "DELETE"])
def favoris_api(request):

    # -------------------------
    #  GET : récupérer favoris
    # -------------------------
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

    # -------------------------
    #  DELETE : supprimer favoris
    # -------------------------
    if request.method == "DELETE":
        fav_id = request.GET.get("id")

        if not fav_id:
            return JsonResponse({"error": "ID manquant"}, status=400)

        deleted, _ = favoris.objects.filter(id=fav_id).delete()

        if deleted == 0:
            return JsonResponse({"error": "Favori introuvable"}, status=404)

        return JsonResponse({"success": True})

    # -------------------------
    #  POST : ajouter favoris
    # -------------------------
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
        date_favori=date_favori,
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

def _user_is_admin(user: utilisateur) -> bool:
    role_name = getattr(getattr(user, "role", None), "nom_role", "")
    return isinstance(role_name, str) and role_name.lower() == "admin"


@csrf_exempt
def commentaires_api(request):

    # ============ GET - récupérer commentaires d’un chant =============
    if request.method == "GET":
        chant_id = request.GET.get("chant_id")
        if not chant_id:
            return JsonResponse({"error": "chant_id manquant"}, status=400)

        comments = commentaire.objects.filter(chant_id=chant_id).select_related("utilisateur")

        data = [
            {
                "id": c.id,
                "utilisateur_id": c.utilisateur_id,
                "utilisateur_pseudo": c.utilisateur.pseudo,
                "texte": c.texte,
                "date_comment": c.date_comment.isoformat(),
                "chant": c.chant_id,
            }
            for c in comments
        ]

        return JsonResponse(data, safe=False)

    # Lire le body JSON pour POST/PUT/DELETE
    try:
        body = json.loads(request.body.decode("utf-8"))
    except:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    # ============ POST - ajouter un commentaire ======================
    if request.method == "POST":
        required = ["utilisateur_id", "chant_id", "texte"]
        for field in required:
            if field not in body:
                return JsonResponse({"error": f"{field} manquant"}, status=400)

        try:
            user = utilisateur.objects.get(id=body["utilisateur_id"])
        except utilisateur.DoesNotExist:
            return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

        try:
            c = chant.objects.get(id=body["chant_id"])
        except chant.DoesNotExist:
            return JsonResponse({"error": "Chant introuvable"}, status=404)

        if commentaire.objects.filter(utilisateur=user, chant=c).exists():
            return JsonResponse({"error": "Vous avez déjà commenté ce chant."}, status=400)

        try:
            com = commentaire.objects.create(
                utilisateur=user,
                chant=c,
                texte=body["texte"],
            )
        except IntegrityError:
            return JsonResponse({"error": "Vous avez déjà commenté ce chant."}, status=400)

        return JsonResponse({
            "id": com.id,
            "utilisateur_id": user.id,
            "utilisateur_pseudo": user.pseudo,
            "texte": com.texte,
            "date_comment": com.date_comment.isoformat(),
            "chant": c.id,
        }, status=201)

    # ============ PUT - modifier un commentaire ======================
    if request.method == "PUT":
        comment_id = body.get("id")
        user_id = body.get("userId")
        texte = body.get("texte")

        if not comment_id or not user_id or texte is None:
            return JsonResponse({"error": "Champs manquants"}, status=400)

        try:
            com = commentaire.objects.get(id=comment_id)
        except commentaire.DoesNotExist:
            return JsonResponse({"error": "Commentaire introuvable"}, status=404)

        try:
            actor = utilisateur.objects.get(id=user_id)
        except utilisateur.DoesNotExist:
            return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

        # Vérifier permissions (admin = role)
        if actor.id != com.utilisateur_id and not _user_is_admin(actor):
            return JsonResponse({"error": "Permission refusée"}, status=403)

        com.texte = texte
        com.save()

        return JsonResponse({
            "id": com.id,
            "utilisateur_id": com.utilisateur_id,
            "utilisateur_pseudo": com.utilisateur.pseudo,
            "texte": com.texte,
            "date_comment": com.date_comment.isoformat(),
            "chant": com.chant_id,
        })

    # ============ DELETE - supprimer un commentaire ===================
    if request.method == "DELETE":
        comment_id = body.get("id")
        user_id = body.get("userId")

        if not comment_id or not user_id:
            return JsonResponse({"error": "Champs manquants"}, status=400)

        try:
            com = commentaire.objects.get(id=comment_id)
        except commentaire.DoesNotExist:
            return JsonResponse({"error": "Commentaire introuvable"}, status=404)

        try:
            actor = utilisateur.objects.get(id=user_id)
        except utilisateur.DoesNotExist:
            return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

        # Permissions (admin = rôle)
        if actor.id != com.utilisateur_id and not _user_is_admin(actor):
            return JsonResponse({"error": "Permission refusée"}, status=403)

        com.delete()
        return JsonResponse({"success": True})

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)

#----------------------------------------------------------------------------------------
#                           CHANSONNIER 
#  ----------------------------------------------------------------------------------------

#Chansonnier
@csrf_exempt
@require_http_methods(["GET", "POST"])
def mes_chansonniers_api(request):
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
@csrf_exempt
def templates_chansonniers_api(request):
    # -------- GET : liste des templates avec les ids des chants ----------
    if request.method == "GET":
        qs = template_chansonnier.objects.all()
        data = []

        for t in qs:
            chant_ids = list(
                contenir_chant_template.objects.filter(
                    template_chansonnier=t
                ).values_list("chant_id", flat=True)
            )

            data.append(
                {
                    "id": t.id,
                    "nom_template": t.nom_template,
                    "description": t.description,
                    "couleur": t.couleur,
                    "type_papier": t.type_papier,
                    "chant_ids": chant_ids,
                }
            )

        return JsonResponse(data, safe=False)

    # -------- POST : création d'un template + association de chants -------
    if request.method == "POST":
        try:
            body_raw = request.body.decode("utf-8")
            body = json.loads(body_raw) if body_raw else {}
        except Exception:
            return JsonResponse({"error": "JSON invalide"}, status=400)

        nom_template = (body.get("nom_template") or "").strip()
        description = (body.get("description") or "").strip()
        couleur = (body.get("couleur") or "").strip()
        type_papier = (body.get("type_papier") or "").strip()
        chant_ids = body.get("chant_ids") or []

        if not nom_template:
            return JsonResponse({"error": "nom_template requis"}, status=400)

        t = template_chansonnier.objects.create(
            nom_template=nom_template,
            description=description,
            couleur=couleur,
            type_papier=type_papier,
        )

        # Lier les chants au template via la table existante
        for cid in chant_ids:
            try:
                contenir_chant_template.objects.create(
                    chant_id=cid,
                    template_chansonnier=t,
                )
            except Exception:
                # on ignore les doublons / ids foireux
                continue

        return JsonResponse(
            {
                "id": t.id,
                "nom_template": t.nom_template,
                "description": t.description,
                "couleur": t.couleur,
                "type_papier": t.type_papier,
                "chant_ids": chant_ids,
            },
            status=201,
        )

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)


    # -------- POST : création d'un template + association de chants -------
    if request.method == "POST":
        try:
            body = json.loads(request.body.decode("utf-8") or "{}")
        except JSONDecodeError:
            return JsonResponse({"error": "JSON invalide"}, status=400)

        nom_template = (body.get("nom_template") or "").strip()
        description = (body.get("description") or "").strip()
        couleur = (body.get("couleur") or "").strip()
        type_papier = (body.get("type_papier") or "").strip()
        chant_ids = body.get("chant_ids") or []

        if not nom_template:
            return JsonResponse({"error": "nom_template requis"}, status=400)

        t = template_chansonnier.objects.create(
            nom_template=nom_template,
            description=description,
            couleur=couleur,
            type_papier=type_papier,
        )

        # Lier les chants au template
        for cid in chant_ids:
            try:
                contenir_chant_template.objects.create(
                    chant_id=cid,
                    template_chansonnier=t,
                )
            except Exception:
                # On ignore les doublons / ids invalides
                continue

        return JsonResponse(
            {
                "id": t.id,
                "nom_template": t.nom_template,
                "description": t.description,
                "couleur": t.couleur,
                "type_papier": t.type_papier,
                "chant_ids": chant_ids,
            },
            status=201,
        )

    return JsonResponse({"error": "Méthode non autorisée"}, status=405)


@csrf_exempt
@require_http_methods(["GET", "PUT", "PATCH", "DELETE"])
def template_chansonnier_detail_api(request, template_id):
    try:
        t = template_chansonnier.objects.get(id=template_id)
    except template_chansonnier.DoesNotExist:
        return JsonResponse({"error": "Template introuvable"}, status=404)

    # --------- DELETE : suppression du template ----------
    if request.method == "DELETE":
        # les liens contenir_chant_template sont supprimés via la FK
        t.delete()
        return JsonResponse({"success": True})

    # --------- GET : détail d'un template ----------
    if request.method == "GET":
        chant_ids = list(
            contenir_chant_template.objects.filter(
                template_chansonnier=t
            ).values_list("chant_id", flat=True)
        )
        return JsonResponse(
            {
                "id": t.id,
                "nom_template": t.nom_template,
                "description": t.description,
                "couleur": t.couleur,
                "type_papier": t.type_papier,
                "chant_ids": chant_ids,
            }
        )

    # --------- PUT / PATCH : mise à jour ----------
    try:
        body_raw = request.body.decode("utf-8")
        body = json.loads(body_raw) if body_raw else {}
    except Exception:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    # mise à jour des champs texte
    if "nom_template" in body or request.method == "PUT":
        t.nom_template = (body.get("nom_template", t.nom_template) or "").strip()
    if "description" in body or request.method == "PUT":
        t.description = (body.get("description", t.description) or "").strip()
    if "couleur" in body or request.method == "PUT":
        t.couleur = (body.get("couleur", t.couleur) or "").strip()
    if "type_papier" in body or request.method == "PUT":
        t.type_papier = (body.get("type_papier", t.type_papier) or "").strip()

    t.save()

    # si chant_ids est fourni, on remplace complètement la liste de chants
    if "chant_ids" in body or request.method == "PUT":
        chant_ids = body.get("chant_ids") or []
        contenir_chant_template.objects.filter(template_chansonnier=t).delete()
        for cid in chant_ids:
            try:
                contenir_chant_template.objects.create(
                    chant_id=cid,
                    template_chansonnier=t,
                )
            except Exception:
                continue

    final_chant_ids = list(
        contenir_chant_template.objects.filter(
            template_chansonnier=t
        ).values_list("chant_id", flat=True)
    )

    return JsonResponse(
        {
            "id": t.id,
            "nom_template": t.nom_template,
            "description": t.description,
            "couleur": t.couleur,
            "type_papier": t.type_papier,
            "chant_ids": final_chant_ids,
        }
    )

#----------------------------------------------------------------------------------------
#                           COMMANDES
#  ----------------------------------------------------------------------------------------

#Fournisseur
@csrf_exempt
@require_http_methods(["GET", "POST"])
def fournisseurs_api(request):
    # ------- GET : liste de tous les fournisseurs -------
    if request.method == "GET":
        qs = fournisseur.objects.all()
        data = [
            {
                "id": f.id,
                "nom_fournisseur": f.nom_fournisseur,
                "ville_fournisseur": f.ville_fournisseur,
            }
            for f in qs
        ]
        return JsonResponse(data, safe=False)

    # ------- POST : création d'un fournisseur -------
    try:
        body_raw = request.body.decode("utf-8")
        body = json.loads(body_raw) if body_raw else {}
    except Exception:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    nom = (body.get("nom_fournisseur") or "").strip()
    ville = (body.get("ville_fournisseur") or "").strip()

    if not nom:
        return JsonResponse(
            {"error": "Le champ 'nom_fournisseur' est requis."},
            status=400,
        )

    f = fournisseur.objects.create(
        nom_fournisseur=nom,
        ville_fournisseur=ville,
    )

    return JsonResponse(
        {
            "id": f.id,
            "nom_fournisseur": f.nom_fournisseur,
            "ville_fournisseur": f.ville_fournisseur,
        },
        status=201,
    )


#DETAIL FOURNISSEUR 
@csrf_exempt
@require_http_methods(["PATCH", "DELETE"])
def fournisseur_detail_api(request, fournisseur_id):
    try:
        f = fournisseur.objects.get(id=fournisseur_id)
    except fournisseur.DoesNotExist:
        return JsonResponse({"error": "Fournisseur introuvable"}, status=404)

    if request.method == "DELETE":
        f.delete()
        return JsonResponse({"success": True})

    # PATCH
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    f.nom_fournisseur = body.get("nom_fournisseur", f.nom_fournisseur)
    f.ville_fournisseur = body.get("ville_fournisseur", f.ville_fournisseur)
    f.save()

    return JsonResponse(
        {
            "id": f.id,
            "nom_fournisseur": f.nom_fournisseur,
            "ville_fournisseur": f.ville_fournisseur,
        }
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

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def mes_commandes_detail_api(request, commande_id):
    """
    GET    : retourne une commande de l'utilisateur courant
    PUT    : met à jour le status (optionnel)
    DELETE : supprime la commande + ses lignes
    """
    email = request.headers.get("X-User-Email", "").lower()
    if not email:
        return JsonResponse({"error": "Email manquant"}, status=400)

    try:
        user = utilisateur.objects.get(email=email)
    except utilisateur.DoesNotExist:
        return JsonResponse({"error": "Utilisateur introuvable"}, status=404)

    try:
        c = commande.objects.get(id=commande_id, utilisateur=user)
    except commande.DoesNotExist:
        return JsonResponse({"error": "Commande introuvable"}, status=404)

    # ---------- GET ----------
    if request.method == "GET":
        return JsonResponse({
            "id": c.id,
            "date_commande": c.date_commande.isoformat(),
            "status": c.status,
        })

    # ---------- DELETE ----------
    if request.method == "DELETE":
        # On supprime les lignes de cette commande, puis la commande
        details_commande.objects.filter(commande=c).delete()
        c.delete()
        return JsonResponse({"success": True})

    # ---------- PUT ----------
    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    new_status = body.get("status")
    if new_status is not None:
        c.status = new_status
        c.save()

    return JsonResponse({"success": True})



#----------------------------------------------------------------
#                           EVENENMENT
#----------------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET", "POST"])
def evenements_api(request):
    # ----------- GET : liste des évènements -----------
    if request.method == "GET":
        qs = evenement.objects.all().order_by("date_evenement")
        data = [
            {
                "id": e.id,
                "date_evenement": e.date_evenement.isoformat() if e.date_evenement else None,
                "lieu": e.lieu,
                "nom_evenement": e.nom_evenement,
                "annonce_fil_actu": e.annonce_fil_actu,
                "histoire": e.histoire,
            }
            for e in qs
        ]
        return JsonResponse(data, safe=False)

    # ----------- POST : création d'un évènement -----------
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    parsed_date = parse_iso_date(body.get("date_evenement"))
    if body.get("date_evenement") and parsed_date is None:
        return JsonResponse({"error": "date_evenement invalide"}, status=400)

    e = evenement.objects.create(
        date_evenement=parsed_date,
        lieu=body.get("lieu", ""),
        nom_evenement=body.get("nom_evenement", ""),
        annonce_fil_actu=body.get("annonce_fil_actu", ""),
        histoire=body.get("histoire", ""),
    )

    return JsonResponse(
        {
            "id": e.id,
            "date_evenement": e.date_evenement.isoformat() if e.date_evenement else None,
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

    # ----------- GET : détail d'un évènement -----------
    if request.method == "GET":
        data = {
            "id": e.id,
            "date_evenement": e.date_evenement.isoformat() if e.date_evenement else None,
            "lieu": e.lieu,
            "nom_evenement": e.nom_evenement,
            "annonce_fil_actu": e.annonce_fil_actu,
            "histoire": e.histoire,
        }
        return JsonResponse(data)

    # ----------- DELETE : suppression de l'évènement -----------
    if request.method == "DELETE":
        e.delete()
        return JsonResponse({"success": True})

    # ----------- PUT : modification d'un évènement -----------
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    e.nom_evenement = body.get("nom_evenement", e.nom_evenement)
    e.lieu = body.get("lieu", e.lieu)
    e.annonce_fil_actu = body.get("annonce_fil_actu", e.annonce_fil_actu)
    e.histoire = body.get("histoire", e.histoire)
    new_date = parse_iso_date(body.get("date_evenement"))
    if body.get("date_evenement") and new_date is None:
        return JsonResponse({"error": "date_evenement invalide"}, status=400)
    if new_date is not None:
        e.date_evenement = new_date
    e.save()

    data = {
        "id": e.id,
        "date_evenement": e.date_evenement.isoformat() if e.date_evenement else None,
        "lieu": e.lieu,
        "nom_evenement": e.nom_evenement,
        "annonce_fil_actu": e.annonce_fil_actu,
        "histoire": e.histoire,
    }
    return JsonResponse(data)



#---------------------------------------------------------------
#                            CHANTER
#---------------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET", "POST", "DELETE"])
def chanter_api(request):
    # --- DELETE : /api/chanter/?id=123 ---
    if request.method == "DELETE":
        link_id = request.GET.get("id")

        if not link_id:
            return JsonResponse({"error": "Paramètre 'id' manquant"}, status=400)

        try:
            rel = chanter.objects.get(id=link_id)
        except chanter.DoesNotExist:
            return JsonResponse({"error": "Relation introuvable"}, status=404)

        rel.delete()
        return JsonResponse({"status": "deleted"})

    # --- GET : /api/chanter/ ou filtré ---
    if request.method == "GET":
        qs = chanter.objects.select_related("chant", "evenement")

        evenement_id = request.GET.get("evenement_id")
        chant_id = request.GET.get("chant_id")

        if evenement_id:
            qs = qs.filter(evenement_id=evenement_id)
        if chant_id:
            qs = qs.filter(chant_id=chant_id)

        data = [
            {
                "id": c.id,
                "chant_id": c.chant_id,
                "evenement_id": c.evenement_id,
            }
            for c in qs
        ]
        return JsonResponse(data, safe=False)

    # --- POST : /api/chanter/ ---
    # body JSON : { "chant_id": 1, "evenement_id": 2 }
    if request.method == "POST":
        try:
            body = json.loads(request.body.decode("utf-8"))
        except Exception:
            return JsonResponse({"error": "JSON invalide"}, status=400)

        chant_id = body.get("chant_id")
        evenement_id = body.get("evenement_id")

        if not chant_id or not evenement_id:
            return JsonResponse(
                {"error": "chant_id et evenement_id requis"},
                status=400,
            )

        c = chanter.objects.create(
            chant_id=chant_id,
            evenement_id=evenement_id,
        )

        return JsonResponse(
            {"id": c.id, "chant_id": c.chant_id, "evenement_id": c.evenement_id},
            status=201,
        )

    # Normalement jamais atteint grâce à @require_http_methods
    return JsonResponse({"error": "Méthode non supportée"}, status=405)




#--------------------------------------------------------
                        #CONTENIR
#--------------------------------------------------------
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
#---------------------------------------------------------
                        #FOURNIR
#---------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET", "POST"])
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

    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    fournisseur_id = body.get("fournisseur_id")
    chansonnier_perso_id = body.get("chansonnier_perso_id")
    date_str = body.get("date_fourniture")

    if not fournisseur_id or not chansonnier_perso_id:
        return JsonResponse(
            {"error": "fournisseur_id et chansonnier_perso_id sont requis"},
            status=400,
        )

    from datetime import datetime
    try:
        if date_str:
            date_obj = datetime.fromisoformat(date_str).date()
        else:
            date_obj = timezone.now().date()
    except Exception:
        return JsonResponse(
            {"error": "Format de date_fourniture invalide (attendu YYYY-MM-DD)"},
            status=400,
        )

    f = fournir.objects.create(
        fournisseur_id=int(fournisseur_id),
        chansonnier_perso_id=int(chansonnier_perso_id),
        date_fourniture=date_obj,
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

#---------------------------------------------------------  
#MAITRE DE CHANT
#---------------------------------------------------------

@csrf_exempt
@require_http_methods(["GET", "POST"])
def maitres_api(request):

    # ----------- GET : liste des maîtres -----------
    if request.method == "GET":
        noms = list(maitre_chant.objects.values_list("nom", flat=True))
        # on renvoie toujours {"maitres": [...]} en 200
        return JsonResponse({"maitres": noms})

    # ----------- POST : remplace toute la liste -----------
    try:
        body = json.loads(request.body.decode("utf-8") or "{}")
    except JSONDecodeError:
        return JsonResponse({"error": "JSON invalide"}, status=400)

    maitres = body.get("maitres")
    if not isinstance(maitres, list):
        return JsonResponse({"error": "Format invalide (attendu: liste)"}, status=400)

    # On réinitialise la table
    maitre_chant.objects.all().delete()

    # On insère les nouveaux éléments
    for nom in maitres:
        maitre_chant.objects.create(nom=nom)

    return JsonResponse({"maitres": maitres}, status=200)

    

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
