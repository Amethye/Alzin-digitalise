
# Create your models here.
from django.db import models


# ================================================================================
# ROLE & UTILISATEUR
# ================================================================================

#--  CHECK (Email_adress LIKE '%_@__%.%__%')
class role(models.Model):
    nom_role = models.CharField(max_length = 50, unique=True,default = "user", db_index=True)

    class Meta:
        db_table = 'role'
    
    def __str__(self):
        return self.nom_role


class utilisateur(models.Model):
    email = models.CharField(max_length = 50)
    nom = models.CharField(max_length = 30)
    prenom = models.CharField(max_length = 30)
    pseudo = models.CharField(max_length = 30)
    password = models.CharField(max_length = 128)
    ville = models.CharField(max_length = 85)

    role = models.ForeignKey(
        role,
        on_delete=models.PROTECT
    )
    
    class Meta:
        db_table = 'utilisateur'
    
    def __str__(self):
        return f"{self.nom} {self.prenom}"


# ================================================================================
# CHANT (+ relation avec utilisateur et catégories)
# ================================================================================

class chant(models.Model):
    nom_chant = models.CharField(max_length=100, db_index=True)
    auteur = models.CharField(max_length=100, blank=True, null=True)
    ville_origine = models.CharField(max_length=100, blank=True, null=True)
    paroles = models.TextField()
    description = models.TextField(blank=True, null=True)

    illustration_chant = models.ImageField(upload_to="illustrations/", null=True, blank=True)
    paroles_pdf = models.FileField(upload_to="paroles_pdf/", null=True, blank=True)
    partition = models.FileField(upload_to="partitions/", null=True, blank=True)

    utilisateur = models.ForeignKey(
        "utilisateur",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = "chant"

    def __str__(self):
        return self.nom_chant
# ================================================================================
# CATÉGORIE & APPARTENIR
# ================================================================================
class categorie(models.Model):
    nom_categorie = models.CharField(max_length=50, unique=True, db_index=True)

    class Meta:
        db_table = "categories"

    def __str__(self):
        return self.nom_categorie

class appartenir(models.Model):
    categorie = models.ForeignKey(
        categorie,
        on_delete=models.CASCADE,
        related_name="appartenances"
    )
    chant = models.ForeignKey(
        chant,
        on_delete=models.CASCADE,
        related_name="categories_associees"
    )
    utilisateur = models.ForeignKey(
        "utilisateur",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'appartenir'
        unique_together = (('categorie', 'chant', 'utilisateur'),)

# ================================================================================
# PISTE AUDIO & NOTER
# ================================================================================

class piste_audio(models.Model):
    fichier_mp3 = models.FileField(upload_to="pistes_audio/")

    utilisateur = models.ForeignKey(
        "utilisateur",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    chant = models.ForeignKey(
        chant,
        on_delete=models.CASCADE,
        related_name="pistes_audio",
        db_index=True
    )

    class Meta:
        db_table = "piste_audio"

    def __str__(self):
        return f"Audio {self.id} - {self.chant.nom_chant}"
        
class noter(models.Model):
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.CASCADE
    )
    piste_audio = models.ForeignKey(
        piste_audio,
        on_delete=models.CASCADE
    )
    date_rating = models.DateField(auto_now_add=True)
    valeur_note = models.PositiveSmallIntegerField()

    class Meta:
        db_table = 'noter'
        unique_together = (('utilisateur', 'piste_audio'))

    def __str__(self):
        return f"{self.utilisateur} note {self.piste_audio} le {self.date_rating} : {self.valeur_note}/5"


# ================================================================================
# FAVORIS
# ================================================================================

class favoris(models.Model):
    utilisateur = models.ForeignKey(
        utilisateur,         
        on_delete=models.CASCADE,
        db_index= True
    )
    chant = models.ForeignKey(
        chant,     
        on_delete=models.CASCADE,
        db_index=True
    )
    date_favori = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'favoris'
        unique_together = (('utilisateur', 'chant'),)

    def __str__(self):
        return f"{self.utilisateur} favoris {self.chant} le {self.date_favori}"


# ================================================================================
# COMMENTAIRE
# ================================================================================

class commentaire(models.Model):
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.CASCADE,
    )
    chant = models.ForeignKey(
        chant,
        on_delete=models.CASCADE,
    )
    date_comment = models.DateField(auto_now_add=True)
    texte = models.CharField(max_length=255)

    class Meta:
        db_table = 'commentaire'
        unique_together = (('utilisateur', 'chant'),)

    def __str__(self):
        return f"Comment by {self.utilisateur} on {self.chant} at {self.date_comment}"


# ================================================================================
# CHANSONNIER (+ relations : contenir, fournir)
# ================================================================================
class template_chansonnier(models.Model):
    nom_template = models.CharField(max_length = 100)
    description = models.CharField(max_length = 255)
    couleur = models.CharField(max_length = 50)
    illustration_template = models.FileField(upload_to='illustrations_template/',null=True, blank=True)
    type_papier = models.CharField(max_length = 100)
    
    class Meta:
        db_table = 'template_chansonnier'
    
    def __str__(self):
        return self.nom_template
    


class chansonnier_perso(models.Model):
    nom_chansonnier_perso = models.CharField(max_length = 100)
    couleur = models.CharField(max_length = 50)
    illustration_chansonnier = models.FileField(upload_to='illustrations_chansonnier/',null=True, blank=True)
    type_papier = models.CharField(max_length = 100)
    date_creation = models.DateField()
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    template_chansonnier = models.ForeignKey(
        template_chansonnier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'chansonnier_perso'
    
    def __str__(self):
        return f"Chansonnier_perso {self.nom_chansonnier_perso} - {self.id}"



class contenir_chant_perso(models.Model):
    chant = models.ForeignKey(
        chant,            
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    chansonnier_perso = models.ForeignKey(
        chansonnier_perso,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = 'contenir_chant_perso'
        # PRIMARY KEY (nom_chant, id_chansonnier)
        unique_together = (('chant', 'chansonnier_perso'),)
    
    def __str__(self):
        return f"{self.chansonnier_perso} contient {self.chant}"
    

class contenir_chant_template(models.Model):
    chant = models.ForeignKey(
        chant,            
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    template_chansonnier = models.ForeignKey(
        template_chansonnier,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = 'contenir_chant_template'
        # PRIMARY KEY (nom_chant, id_chansonnier)
        unique_together = (('chant', 'template_chansonnier'),)
    
    def __str__(self):
        return f"{self.template_chansonnier} contient {self.chant}"

# ================================================================================
# COMMANDE (+ relation details_commande)
# ================================================================================

class commande(models.Model):
    date_commande = models.DateField()
    status = models.CharField(max_length = 50) #Pour dire ou on en est et si le panier d'affiche ou non
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = 'commande'
    
    def __str__(self):
        return f"- Commande {self.id} {self.utilisateur} - Status: {self.status}"


class details_commande(models.Model):
    
    commande = models.ForeignKey(
        commande,
        on_delete=models.CASCADE,
    )
    chansonnier_perso = models.ForeignKey(
        chansonnier_perso,
        on_delete=models.CASCADE,
    )
    quantite = models.IntegerField()

    class Meta:
        db_table = 'details_commande'
        # PRIMARY KEY (num_commande, id_chansonnier)
        unique_together = (('commande', 'chansonnier_perso'),)
    
    def __str__(self):
        return f"Order {self.commande} includes {self.quantite} of {self.chansonnier_perso}"

# ================================================================================
#                       FOURNISSEUR (+ relation fournir)
# ================================================================================

class fournisseur(models.Model):
    nom_fournisseur = models.CharField(max_length = 100)
    ville_fournisseur = models.CharField(max_length = 85)
    type_reliure = models.CharField(max_length= 30) #Reliures que le fournisseur propose
    
    class Meta:
        db_table = 'fournisseur'
    
    def __str__(self):
        return f"{self.nom_fournisseur} {self.ville_fournisseur}"


class fournir(models.Model):
    fournisseur = models.ForeignKey(
        fournisseur, 
        on_delete=models.CASCADE
    )
    chansonnier_perso = models.ForeignKey(
        chansonnier_perso,
        on_delete=models.CASCADE,
    )
    date_fourniture = models.DateField()

    class Meta:
        db_table = 'fournir'
        # PRIMARY KEY (nom_fournisseur, id_chansonnier, date_fourniture)
        unique_together = (('fournisseur', 'chansonnier_perso', 'date_fourniture'),)



# ================================================================================
#                            ÉVÉNEMENT & CHANTER
# ================================================================================

class evenement(models.Model):
    date_evenement = models.DateField()
    lieu = models.CharField(max_length = 50)
    nom_evenement = models.CharField(max_length = 50)
    annonce_fil_actu = models.CharField(max_length = 255)
    histoire = models.TextField()
    
    class Meta:
        db_table = 'evenement'
        unique_together = (('date_evenement', 'lieu'),) 
    
    def __str__(self):
        return f"{self.nom_evenement} ({self.date_evenement}, {self.lieu})"


class chanter(models.Model):
    chant = models.ForeignKey(
        chant,
        on_delete=models.CASCADE,
    )
    evenement = models.ForeignKey(
        evenement,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = 'chanter'
        # PRIMARY KEY (nom_chant, date_evenement, lieu)
        # → on l'approxime par (chant, evenement)
        unique_together = (('chant', 'evenement'),)
    
    def __str__(self):
        return f"{self.chant} chanté à {self.evenement}"


# ================================================================================
#                                   MAÎTRE CHANT
# ================================================================================

class maitre_chant(models.Model):
    nom = models.CharField(max_length=200)

    def __str__(self):
        return self.nom



from django.db.models.signals import post_delete
from django.dispatch import receiver
import os

# ----------------------------
# Suppression fichiers chant
# ----------------------------
@receiver(post_delete, sender=chant)
def delete_chant_files(sender, instance, **kwargs):
    if instance.illustration_chant:
        if os.path.isfile(instance.illustration_chant.path):
            os.remove(instance.illustration_chant.path)

    if instance.paroles_pdf:
        if os.path.isfile(instance.paroles_pdf.path):
            os.remove(instance.paroles_pdf.path)

    if instance.partition:
        if os.path.isfile(instance.partition.path):
            os.remove(instance.partition.path)

# ----------------------------
# Suppression MP3 quand piste_audio supprimée
# ----------------------------
@receiver(post_delete, sender=piste_audio)
def delete_audio_file(sender, instance, **kwargs):
    if instance.fichier_mp3:
        if os.path.isfile(instance.fichier_mp3.path):
            os.remove(instance.fichier_mp3.path)
