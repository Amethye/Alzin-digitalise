
# Create your models here.
from django.db import models


# ================================================================================
# ROLE & UTILISATEUR
# ================================================================================

#--  CHECK (Email_adress LIKE '%_@__%.%__%')
class role(models.Model):
    nom_role = models.CharField(max_length = 50, unique=True)

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
    nom_chant = models.CharField(max_length = 50)
    auteur = models.CharField(max_length = 100)
    ville_origine = models.CharField(max_length = 85)
    illustration_chant = models.FileField(upload_to='illustrations_chant/',null=True, blank=True)
    paroles = models.TextField()
    paroles_pdf = models.FileField(upload_to='paroles_pdf/',null=True, blank=True)
    description = models.CharField(max_length = 255)
    partition = models.FileField(upload_to='partitions/',null=True, blank=True)
    categorie =models.ManyToManyField('categorie', blank = True)
    
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.SET_NULL, 
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'chant'
    
    def __str__(self):
        return self.nom_chant
    
    def serialize(self):
        return {
            "id": self.id,
            "nom_chant": self.nom_chant,
            "auteur": self.auteur,
            "ville_origine": self.ville_origine,
            "paroles": self.paroles,
            "description": self.description,
            "illustration_chant_url": self.illustration_chant.url if self.illustration_chant else None,
            "paroles_pdf_url": self.paroles_pdf.url if self.paroles_pdf else None,
            "partition_url": self.partition.url if self.partition else None,
        }



# ================================================================================
# CATÉGORIE & APPARTENIR
# ================================================================================

class categorie(models.Model):
    nom_categorie = models.CharField(max_length = 50)

    class Meta:
        db_table = 'catégories'
    
    def __str__(self):
        return self.nom_categorie


class appartenir(models.Model):
    nom_categorie = models.ForeignKey(
        categorie,
        on_delete=models.CASCADE
    )
    chant = models.ForeignKey(
        chant,
        on_delete=models.CASCADE
    )
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'appartenir'
        unique_together = (('nom_categorie', 'chant', 'utilisateur'),)
        # ça remplace ta clé primaire composée (Access)

# ================================================================================
# PISTE AUDIO & NOTER
# ================================================================================

class piste_audio(models.Model):
    fichier_mp3 = models.FileField(upload_to='pistes_audio/')
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.SET_NULL, 
        null=True,
        blank=True
    )
    chant = models.ForeignKey(
        chant,
        on_delete=models.CASCADE
    )
    
    class Meta:
        db_table = 'piste_audio'
    
    def __str__(self):
        return self.fichier_mp3.name


class noter(models.Model):
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.CASCADE
    )
    piste_audio = models.ForeignKey(
        piste_audio,
        on_delete=models.CASCADE
    )
    date_rating = models.DateField()

    class Meta:
        db_table = 'noter'
        unique_together = (('utilisateur', 'piste_audio'))

    def __str__(self):
        return f"{self.utilisateur} rated {self.piste_audio} on {self.date_rating}"


# ================================================================================
# FAVORIS
# ================================================================================

class favoris(models.Model):
    utilisateur = models.ForeignKey(
        utilisateur,         
        on_delete=models.CASCADE,
    )
    chant = models.ForeignKey(
        chant,     
        on_delete=models.CASCADE,
    )
    date_favori = models.DateField()

    class Meta:
        db_table = 'favoris'
        unique_together = (('utilisateur', 'chant'),)

    def __str__(self):
        return f"{self.utilisateur} favoris {self.chant} on {self.date_favori}"


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
    date_comment = models.DateField()
    texte = models.CharField(max_length=255)

    class Meta:
        db_table = 'commentaire'
        # PRIMARY KEY (Email_adress, nom_chant, date_comment)
        unique_together = (('utilisateur', 'chant', 'date_comment'),)

    def __str__(self):
        return f"Comment by {self.utilisateur} on {self.chant} at {self.date_comment}"


# ================================================================================
# CHANSONNIER (+ relations : contenir, fournir)
# ================================================================================

class chansonnier_perso(models.Model):
    couleur = models.CharField(max_length = 50)
    illustration_chansonnier = models.FileField(upload_to='illustrations_chansonnier/',null=True, blank=True)
    type_papier = models.CharField(max_length = 100)
    prix_vente_unite = models.DecimalField(max_digits=5, decimal_places=2)
    date_creation = models.DateField()

    class Meta:
        db_table = 'chansonnier_perso'
    
    def __str__(self):
        return f"Chansonnier_perso {self.id} - {self.couleur}"

class template_chansonnier(models.Model):
    nom_template = models.CharField(max_length = 100)
    description = models.CharField(max_length = 255)
    illustration_template = models.FileField(upload_to='illustrations_template/',null=True, blank=True)
    type_papier = models.CharField(max_length = 100)
    prix_vente_unite = models.DecimalField(max_digits=5, decimal_places=2)
    

    class Meta:
        db_table = 'template_chansonnier'
    
    def __str__(self):
        return self.nom_template

class contenir(models.Model):
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
        db_table = 'contenir'
        # PRIMARY KEY (nom_chant, id_chansonnier)
        unique_together = (('chant', 'chansonnier_perso'),)
    
    def __str__(self):
        return f"{self.chansonnier_perso} contient {self.chant}"

# ================================================================================
# COMMANDE (+ relation commander)
# ================================================================================


class commande(models.Model):
    date_commande = models.DateField()
    utilisateur = models.ForeignKey(
        utilisateur,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = 'commande'
    
    def __str__(self):
        return f"Commande {self.id} by {self.utilisateur} on {self.date_commande}"


class commander(models.Model):
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
        db_table = 'commander'
        # PRIMARY KEY (num_commande, id_chansonnier)
        unique_together = (('commande', 'chansonnier_perso'),)
    
    def __str__(self):
        return f"Order {self.commande} includes {self.quantite} of {self.chansonnier_perso}"

# ================================================================================
# FOURNISSEUR (+ relation fournir)
# ================================================================================

class fournisseur(models.Model):
    nom_fournisseur = models.CharField(max_length = 100)
    ville_fournisseur = models.CharField(max_length = 85)
    type_reliure = models.CharField(max_length= 30)
    
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
# ÉVÉNEMENT & CHANTER
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
# MAÎTRE CHANT
# ================================================================================

class maitre_chant(models.Model):
    nom = models.CharField(max_length=200)

    def __str__(self):
        return self.nom
