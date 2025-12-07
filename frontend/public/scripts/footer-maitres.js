console.log("[Footer] Script chargé");

// Récupère la liste
const list = document.getElementById("footer-maitres");

if (!list) {
  console.error("[Footer] #footer-maitres introuvable !");
} else {
  console.log("[Footer] Élément trouvé, chargement en cours…");
}

async function loadMaitres() {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/maitres/", {
      method: "GET"
    });

    console.log("[Footer] Status API:", res.status);

    if (!res.ok) {
      console.error("[Footer] API erreur HTTP", res.status);
      return;
    }

    const data = await res.json();
    console.log("[Footer] Données reçues :", data);

    const maitres = data.maitres ?? [];

    // Vide la liste
    list.innerHTML = "";

    // Ajoute les maîtres du backend
    maitres.forEach((m) => {
      const li = document.createElement("li");
      li.textContent = m;
      list.appendChild(li);
    });

    console.log("[Footer] Mise à jour effectuée !");
  } catch (error) {
    console.error("[Footer] Erreur lors du chargement :", error);
  }
}

// Lance le chargement
loadMaitres();