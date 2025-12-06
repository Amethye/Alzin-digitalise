from django.urls import path
from . import views

urlpatterns = [
    path("utilisateurs/", views.utilisateurs_api, name="api_utilisateurs"),
    path("login/", views.login_api, name="api_login"),
    path("me/", views.me_api, name="api_me"),
    path("chants/", views.chants_api, name="api_chants"),
    path("favoris/", views.favoris_api, name="api_favoris"),
    path("commentaires/", views.commentaires_api, name="api_commentaires"),
    path("pistes-audio/", views.pistes_audio_api, name="api_pistes_audio"),
    path("chansonniers/", views.chansonniers_api, name="api_chansonniers"),
    path("fournisseurs/", views.fournisseurs_api, name="api_fournisseurs"),
    path("commandes/", views.commandes_api, name="api_commandes"),
    path("commandes-lignes/", views.commander_api, name="api_commander"),
    path("evenements/", views.evenements_api, name="api_evenements"),
    path("chanter/", views.chanter_api, name="api_chanter"),
    path("categories/", views.categories_api, name="api_categories"),
    path("appartenir/", views.appartenir_api, name="api_appartenir"),
    path("contenir/", views.contenir_api, name="api_contenir"),
    path("fournir/", views.fournir_api, name="api_fournir"),
    path("noter/", views.noter_api, name="api_noter"),
]

'''
de CAPPPPPP
    path("", views.home, name="home"),
    path("login/", views.login_page, name="login"),
    path("cart/", views.cart_page, name="cart"),
    path("pins/", views.pins_page, name="pins"),
    path("register/", views.register_page, name="register"),
    path("reset-password/", views.reset_password_page, name="reset_password"),
    '''