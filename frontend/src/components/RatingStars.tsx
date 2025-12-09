import { useEffect, useState } from "react";

interface RatingProps {
  pisteId: number;
  userId: number;
}

export default function RatingStars({ pisteId, userId }: RatingProps) {
  const [rating, setRating] = useState<number | null>(null);     // note utilisateur
  const [average, setAverage] = useState<number | null>(null);   // moyenne
  const [total, setTotal] = useState<number>(0);                 // nombre de votes


useEffect(() => {
  const loadNotes = async () => {
    if (!userId) return;

    const res = await fetch(`http://127.0.0.1:8000/api/noter/?piste_id=${pisteId}`);
    const data = await res.json();

    setAverage(data.moyenne);


    const my = data.notes.find((n: any) => n.utilisateur_id == userId);
    if (my) {
      setRating(my.valeur_note);
    }
  };

  loadNotes();
}, [pisteId, userId]);



  const handleRate = async (value: number) => {
    setRating(value);

    await fetch("http://127.0.0.1:8000/api/noter/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        utilisateur_id: userId,
        piste_audio_id: pisteId,
        valeur_note: value,
      }),
    });

    const res = await fetch(
      `http://127.0.0.1:8000/api/noter/?piste_id=${pisteId}`
    );
    const data = await res.json();

    setAverage(data.moyenne);
    setTotal(data.nb_notes);
  };


  return (
    <div className="flex items-center gap-3 mt-2">

      {/* ⭐ Étoiles */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((v) => (
          <span
            key={v}
            className={`cursor-pointer text-2xl transition ${
              rating !== null && v <= rating
                ? "text-yellow-400"
                : "text-gray-400"
            }`}
            onClick={() => handleRate(v)}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}