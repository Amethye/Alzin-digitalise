from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("login/", views.login_page, name="login"),
    path("cart/", views.cart_page, name="cart"),
    path("pins/", views.pins_page, name="pins"),
    path("register/", views.register_page, name="register"),
    path("reset-password/", views.reset_password_page, name="reset_password"),

    path("api/utilisateurs/", views.utilisateurs_api, name="api_utilisateurs"),
    path("api/chants/", views.chants_api, name="api_chants"),
    path("api/favoris/", views.favoris_api, name="api_favoris"),
    path("api/commentaires/", views.commentaires_api, name="api_commentaires"),
]

