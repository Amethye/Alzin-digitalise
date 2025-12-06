from django.urls import path
from . import views

urlpatterns = [
    path("api/utilisateurs/", views.utilisateurs_api, name="api_utilisateurs"),
    path("api/chants/", views.chants_api, name="api_chants"),
    path("api/favoris/", views.favoris_api, name="api_favoris"),
    path("api/commentaires/", views.commentaires_api, name="api_commentaires"),
    path("api/pistes-audio/", views.pistes_audio_api, name="api_pistes_audio"),
    path("api/chansonniers/", views.chansonniers_api, name="api_chansonniers"),
    path("api/fournisseurs/", views.fournisseurs_api, name="api_fournisseurs"),
    path("api/commandes/", views.commandes_api, name="api_commandes"),
    path("api/commandes-lignes/", views.commander_api, name="api_commander"),
    path("api/evenements/", views.evenements_api, name="api_evenements"),
    path("api/chanter/", views.chanter_api, name="api_chanter"),
    path("api/categories/", views.categories_api, name="api_categories"),
    path("api/appartenir/", views.appartenir_api, name="api_appartenir"),
    path("api/contenir/", views.contenir_api, name="api_contenir"),
    path("api/fournir/", views.fournir_api, name="api_fournir"),
    path("api/noter/", views.noter_api, name="api_noter"),
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