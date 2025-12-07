from django.urls import path
from . import views

urlpatterns = [
    path("utilisateurs/", views.utilisateurs_api, name="api_utilisateurs"),
    path("login/", views.login_api, name="api_login"),
    path("me/", views.me_api, name="api_me"),
    path("auth/logout/", views.logout_api, name="api_logout"),
    path("admin/users/", views.admin_users_api, name="api_admin_users"),
    path("admin/users/<int:user_id>/", views.admin_users_api, name="api_admin_user_detail"),
    path("admin/users/<int:user_id>/<str:action>/", views.admin_users_api, name="api_admin_user_role"),
    path("chants/", views.chants_api, name="api_chants"),
    path("chants/<int:chant_id>/",views.chants_api, name="api_chant_detail"),
    path("categories/", views.categorie_api, name="api_categorie"),
    path("maitres/", views.maitres_api, name="api_maitres"),

    path("favoris/", views.favoris_api, name="api_favoris"),
    path("commentaires/", views.commentaires_api, name="api_commentaires"),
    path("pistes-audio/", views.pistes_audio_api, name="api_pistes_audio"),
    path("chansonniers/", views.chansonniers_api, name="api_chansonniers"),
    path("fournisseurs/", views.fournisseurs_api, name="api_fournisseurs"),
    path("commandes/", views.commandes_api, name="api_commandes"),
    path("commandes-lignes/", views.commander_api, name="api_commander"),
    path("evenements/", views.evenements_api, name="api_evenements"),
    path("chanter/", views.chanter_api, name="api_chanter"),
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