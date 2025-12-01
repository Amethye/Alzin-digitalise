from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("login/", views.login_page, name="login"),
    path("cart/", views.cart_page, name="cart"),
    path("pins/", views.pins_page, name="pins"),
    path("register/", views.register_page, name="register"),
    path("reset-password/", views.reset_password_page, name="reset_password"),

    path("utilisateurs/", views.liste_utilisateurs, name="liste_utilisateurs"),
    path("utilisateurs/ajouter/", views.ajouter_utilisateur, name="ajouter_utilisateur"),

    path("chants/", views.liste_chants, name="liste_chants"),
    path("chants/ajouter/", views.ajouter_chant, name="ajouter_chant"),

    path("pistes/", views.liste_pistes_audio, name="liste_pistes_audio"),
    path("pistes/ajouter/", views.ajouter_piste_audio, name="ajouter_piste_audio"),

    path("favoris/", views.liste_favoris, name="liste_favoris"),
    path("favoris/ajouter/", views.ajouter_favoris, name="ajouter_favoris"),

    path("commentaires/", views.liste_commentaires, name="liste_commentaires"),
    path("commentaires/ajouter/", views.ajouter_commentaire, name="ajouter_commentaire"),
]

