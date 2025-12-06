
# Create your models here.
from django.db import models



#--  CHECK (Email_adress LIKE '%_@__%.%__%')
class utilisateur(models.Model):
    email = models.CharField(max_length = 50)
    nom = models.CharField(max_length = 30)
    prenom = models.CharField(max_length = 30)
    pseudo = models.CharField(max_length = 30)
    password = models.CharField(max_length = 128)
    ville = models.CharField(max_length = 85)
    
    class Meta:
        db_table = 'utilisateur'
    
    def __str__(self):
        return f"{self.nom} {self.prenom}"

class chant(models.Model):
    nom_chant = models.CharField(max_length = 50)
    auteur = models.CharField(max_length = 100)
    ville_origine = models.CharField(max_length = 85)
    illustration_chant = models.FileField(upload_to='illustrations_chant/',null=True, blank=True)
    paroles = models.TextField()
    paroles_pdf = models.FileField(upload_to='paroles_pdf/',null=True, blank=True)
    description = models.CharField(max_length = 255)
    partition = models.FileField(upload_to='partitions/',null=True, blank=True)
    
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


class chansonnier(models.Model):
    couleur = models.CharField(max_length = 50)
    illustration_chansonnier = models.FileField(upload_to='illustrations_chansonnier/',null=True, blank=True)
    type_papier = models.CharField(max_length = 100)
    prix_vente_unite = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        db_table = 'chansonnier'
    
    def __str__(self):
        return f"Chansonnier {self.id} - {self.couleur}"



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




class fournisseur(models.Model):
    nom_fournisseur = models.CharField(max_length = 100)
    ville_fournisseur = models.CharField(max_length = 85)
    type_reliure = models.CharField(max_length= 30)
    
    class Meta:
        db_table = 'fournisseur'
    
    def __str__(self):
        return f"{self.nom_fournisseur} {self.ville_fournisseur}"





        

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



class commander(models.Model):
    commande = models.ForeignKey(
        commande,
        on_delete=models.CASCADE,
    )
    chansonnier = models.ForeignKey(
        chansonnier,
        on_delete=models.CASCADE,
    )
    quantite = models.IntegerField()

    class Meta:
        db_table = 'commander'
        # PRIMARY KEY (num_commande, id_chansonnier)
        unique_together = (('commande', 'chansonnier'),)
    
    def __str__(self):
        return f"Order {self.commande} includes {self.quantite} of {self.chansonnier}"



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



class categories(models.Model):
    nom_categorie = models.CharField(max_length = 50)

    class Meta:
        db_table = 'catégories'
    
    def __str__(self):
        return self.nom_categorie




class appartenir(models.Model):
    nom_categorie = models.ForeignKey(
        categories,
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


class contenir(models.Model):
    chant = models.ForeignKey(
        chant,            
        on_delete=models.CASCADE,
    )
    chansonnier = models.ForeignKey(
        chansonnier,
        on_delete=models.CASCADE,
    )

    class Meta:
        db_table = 'contenir'
        # PRIMARY KEY (nom_chant, id_chansonnier)
        unique_together = (('chant', 'chansonnier'),)
    
    def __str__(self):
        return f"{self.chansonnier} contient {self.chant}"

class fournir(models.Model):
    fournisseur = models.ForeignKey(
        fournisseur, 
        on_delete=models.CASCADE
    )
    chansonnier = models.ForeignKey(
        chansonnier,
        on_delete=models.CASCADE
    )
    date_fourniture = models.DateField()

    class Meta:
        db_table = 'fournir'
        # PRIMARY KEY (nom_fournisseur, id_chansonnier, date_fourniture)
        unique_together = (('fournisseur', 'chansonnier', 'date_fourniture'),)


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
