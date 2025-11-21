
# Create your models here.
from django.db import models



#--  CHECK (Email_adress LIKE '%_@__%.%__%')
class utilisateur(models.Model):
    email = models.CharField(max_length = 50)
    nom = models.CharField(max_length = 30)
    prenom = models.CharField(max_length = 30)
    pseudo = models.CharField(max_length = 30)
    password = models.CharField(max_length = 50)
    ville = models.CharField(max_length = 85)
    statut = models.CharField(max_length= 50) #a modifier , faire ne autre table pour les statuts ?
    
    class Meta:
        db_table = 'utilisateur'
    
    def __str__(self):
        return f"{self.nom} {self.prenom}"

'''
CREATE TABLE Utilisateur (
    Email_adress CHAR(50) PRIMARY KEY NOT NULL,
    Pseudo VARCHAR(30),
    mot_de_passe VARCHAR(50),
    Ville VARCHAR(85),
    Statut VARCHAR(50)
);
'''

class Noter(models.Model):
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

'''
CREATE TABLE noter (
    Email_adress VARCHAR(50),
    fichier_mp3 VARCHAR(255),
    date_rating DATE,
    PRIMARY KEY (Email_adress, fichier_mp3),
    CONSTRAINT lien_noter_user FOREIGN KEY (Email_adress) REFERENCES utilisateur (Email_adress),
    CONSTRAINT lien_noter_mp3 FOREIGN KEY (fichier_mp3) REFERENCES piste_audio (fichier_mp3)
);
'''
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

'''  
CREATE TABLE piste_audio (
    fichier_mp3 VARCHAR(255) PRIMARY KEY,
    nom_chant VARCHAR(50),
    Email_adress VARCHAR(50),
    CONSTRAINT fk_piste_chant FOREIGN KEY (nom_chant) REFERENCES chant (nom_chant),
    CONSTRAINT fk_piste_utilisateur FOREIGN KEY (Email_adress) REFERENCES utilisateur (Email_adress)
);
'''

class fournisseur(models.Model):
    nom_fournisseur = models.CharField(max_length = 100)
    ville_fournisseur = models.CharField(max_length = 85)
    type_reliure = models.CharField(max_length= 30)
    
    class Meta:
        db_table = 'fournisseur'
    
    def __str__(self):
        return f"{self.nom_fournisseur} {self.ville_fournisseur}"
'''
CREATE TABLE fournisseur (
    nom_fournisseur VARCHAR(100) PRIMARY KEY,
    ville VARCHAR(50),
    type_reliure VARCHAR(30)
);
'''

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

        

'''
CREATE TABLE fournir (
    nom_fournisseur VARCHAR(100),
    id_chansonnier VARCHAR(50),
    date_fourniture DATE,
    PRIMARY KEY (nom_fournisseur, id_chansonnier, date_fourniture),
    CONSTRAINT fk_fournir_fournisseur FOREIGN KEY (nom_fournisseur) REFERENCES fournisseur (nom_fournisseur),
    CONSTRAINT fk_fournir_chansonnier FOREIGN KEY (id_chansonnier) REFERENCES chansonnier (id_chansonnier)
);
'''

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
        # PRIMARY KEY (Email_adress, nom_chant)
        unique_together = (('utilisateur', 'chant'),)

    def __str__(self):
        return f"{self.utilisateur} favoris {self.chant} on {self.date_favori}"

'''
CREATE TABLE favoris (
    Email_adress VARCHAR(50),
    nom_chant VARCHAR(50),
    date_favori DATE,
    PRIMARY KEY (Email_adress, nom_chant),
    CONSTRAINT lien_favoris_user FOREIGN KEY (Email_adress) REFERENCES utilisateur (Email_adress),
    CONSTRAINT lien_favoris_chant FOREIGN KEY (nom_chant) REFERENCES chant (nom_chant)
);
'''

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

'''
CREATE TABLE evenement (
    date_evenement DATE,
    lieu VARCHAR(50),
    nom_evenement VARCHAR(50),
    annonce_fil_actu VARCHAR(255),
    histoire TEXT,
    PRIMARY KEY (date_evenement, lieu)
);
'''

class Contenir(models.Model):
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

'''
CREATE TABLE contenir (
    nom_chant VARCHAR(50),
    id_chansonnier VARCHAR(50),
    PRIMARY KEY (nom_chant, id_chansonnier),
    CONSTRAINT lien_contenir_chant FOREIGN KEY (nom_chant) REFERENCES chant (nom_chant),
    CONSTRAINT lien_contenir_chansonnier FOREIGN KEY (id_chansonnier) REFERENCES chansonnier (id_chansonnier)
);
'''

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

'''
CREATE TABLE commentaire (
    Email_adress VARCHAR(50),
    nom_chant VARCHAR(50),
    date_comment DATE,
    texte VARCHAR(255),
    PRIMARY KEY (Email_adress, nom_chant, date_comment),
    CONSTRAINT lien_comment_Utilisateur FOREIGN KEY (Email_adress) REFERENCES utilisateur (Email_adress),
    CONSTRAINT lien_comment_chant FOREIGN KEY (nom_chant) REFERENCES chant (nom_chant)
);
'''

class Commander(models.Model):
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

'''
CREATE TABLE commander (
    num_commande VARCHAR(50),
    id_chansonnier VARCHAR(50),
    quantite NUMBER,
    PRIMARY KEY (num_commande, id_chansonnier),
    CONSTRAINT lien_commander_commande FOREIGN KEY (num_commande) REFERENCES commande (num_commande),
    CONSTRAINT lien_commander_chansonnier FOREIGN KEY (id_chansonnier) REFERENCES chansonnier (id_chansonnier)
);
'''
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

'''
CREATE TABLE commande (
    num_commande VARCHAR(50) PRIMARY KEY,
    date_commande DATE,
    Email_adress VARCHAR(50),
    CONSTRAINT lien_commande_utilisateur FOREIGN KEY (Email_adress) REFERENCES utilisateur (Email_adress)
);
'''

class Chanter(models.Model):
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

'''
CREATE TABLE chanter (
    nom_chant VARCHAR(50),
    date_evenement DATE,
    lieu VARCHAR(150),
    PRIMARY KEY (nom_chant, date_evenement, lieu),
    CONSTRAINT lien_chanter_chant FOREIGN KEY (nom_chant) REFERENCES chant (nom_chant),
    CONSTRAINT lien_chanter_event FOREIGN KEY (date_evenement, lieu) REFERENCES evenement (date_evenement, lieu)
);
'''

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
'''
CREATE TABLE chant (
    nom_chant VARCHAR(50) PRIMARY KEY,
    auteur VARCHAR(30),
    ville_origine VARCHAR(85),
    illustration VARCHAR(120),
    paroles TEXT,
    pdf VARCHAR(200),
    description VARCHAR(255),
    partition VARCHAR(255),
    Email_adress VARCHAR(50),
    CONSTRAINT lien_chant_utilisateur FOREIGN KEY (Email_adress) REFERENCES Utilisateur (Email_adress)
);
'''

class chansonnier(models.Model):
    couleur = models.CharField(max_length = 50)
    illustration_chansonnier = models.FileField(upload_to='illustrations_chansonnier/',null=True, blank=True)
    type_papier = models.CharField(max_length = 100)
    prix_vente_unite = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        db_table = 'chansonnier'
    
    def __str__(self):
        return f"Chansonnier {self.id} - {self.couleur}"

'''
CREATE TABLE chansonnier (
    id_chansonnier VARCHAR(50) PRIMARY KEY,
    couleur VARCHAR(50),
    illustration VARCHAR(255),
    type_papier VARCHAR(100),
    prix_vente_unite NUMBER
);
'''

class categories(models.Model):
    nom_categorie = models.CharField(max_length = 50)

    class Meta:
        db_table = 'catégories'
    
    def __str__(self):
        return self.nom_categorie

'''
CREATE TABLE Catégories (
    Nom_de_la_catégorie VARCHAR(50) PRIMARY KEY NOT NULL
);
'''


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
        unique_together = (('nom_categorie', 'nom_chant', 'email'),)
        # ça remplace ta clé primaire composée (Access)



'''
CREATE TABLE appartenir (
    nom_categorie VARCHAR(100),
    nom_chant VARCHAR(50),
    Email_adress VARCHAR(50),
    PRIMARY KEY (nom_categorie, nom_chant, Email_adress),
    CONSTRAINT lien_app_cat FOREIGN KEY (nom_categorie) REFERENCES categories (nom_categorie),
    CONSTRAINT lien_app_chant FOREIGN KEY (nom_chant) REFERENCES chant (nom_chant),
    CONSTRAINT lien_app_Utilisateur FOREIGN KEY (Email_adress) REFERENCES utilisateur (Email_adress)
);
'''

