import React from "react";

export default function RatingStars({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          onClick={() => onChange(n)}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={value >= n ? "#7e3af2" : "rgba(126,58,242,0.25)"}
          stroke="#7e3af2"
          strokeWidth="1.5"
          className="w-7 h-7 cursor-pointer hover:opacity-80 transition"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.5c.3-.9 1.74-.9 2.04 0l1.77 5.3c.12.36.46.6.84.6h5.56c.96 0 1.36 1.22.58 1.78l-4.5 3.27c-.32.23-.46.63-.34 1l1.77 5.3c.3.9-.74 1.65-1.52 1.1l-4.5-3.27a.98.98 0 00-1.16 0l-4.5 3.27c-.78.55-1.82-.2-1.52-1.1l1.77-5.3c.12-.37-.02-.77-.34-1l-4.5-3.27c-.78-.56-.38-1.78.58-1.78h5.56c.38 0 .72-.24.84-.6l1.77-5.3z"
          />
        </svg>
      ))}
    </div>
  );
}