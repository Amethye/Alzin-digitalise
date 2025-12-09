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
    
    path("maitres/", views.maitres_api, name="api_maitres"),
    
    path("chants/", views.chants_api, name="api_chants"),
    path("chants/<int:chant_id>/",views.chants_api, name="api_chant_detail"),
    
    path("appartenir/", views.appartenir_api, name="api_appartenir"),
    
    path("categories/", views.categories_api, name="api_categorie"),
    

    path("details-commande/", views.details_commande_api, name="api_details_commande"),
    path("commandes-lignes/", views.details_commande_api, name="api_commandes_lignes"),  # alias pour le front
    path("mes-chansonniers/", views.mes_chansonniers_api, name="api_mes_chansonniers"),
    path(
        "mes-chansonniers/<int:chansonnier_id>/",
        views.chansonnier_perso_detail_api,
        name="api_chansonnier_perso_detail",
    ),

    path("templates-chansonniers/", views.templates_chansonniers_api, name="api_templates_chansonniers"),

    
    path("pistes-audio/", views.pistes_audio_api, name="api_pistes_audio"),
    path("pistes-audio/<int:piste_id>/", views.pistes_audio_api, name="api_pistes_audio_detail"),

    path("noter/", views.noter_api, name="api_noter"),
    path("noter/<int:note_id>/", views.noter_api, name="api_noter_detail"),

    path("favoris/", views.favoris_api, name="api_favoris"),

    path("commentaires/", views.commentaires_api, name="api_commentaires"),
    
    path("chansonniers/", views.mes_chansonniers_api, name="api_chansonniers"),
    path("fournisseurs/", views.fournisseurs_api, name="api_fournisseurs"),
    path("commandes/", views.commandes_api, name="api_commandes"),
    path("mes-commandes/", views.mes_commandes_api, name="api_mes_commandes"),
    path("commandes-lignes/", views.details_commande_api, name="api_details_commande"),
    path("mes-chansonniers/", views.mes_chansonniers_api, name="api_mes_chansonniers"),
    
    path("evenements/", views.evenements_api, name="api_evenements"),
    path("api/evenements/<int:id>/", views.evenement_detail_api, name="api_evenement_detail"),
    
    path("chanter/", views.chanter_api, name="api_chanter"),
    path("chanter/<int:chanter_id>/", views.chanter_detail_api, name="api_chanter_detail"),

    path("contenir/", views.contenir_api, name="api_contenir"),
    path("fournir/", views.fournir_api, name="api_fournir"),
    path("support/", views.support_api, name="api_support"),
    
    
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