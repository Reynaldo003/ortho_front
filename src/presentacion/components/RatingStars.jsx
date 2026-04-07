// src/components/RatingStars.jsx
import { useMemo } from "react";
import { Star } from "lucide-react";

export default function RatingStars({
  value = 0,
  onChange,
  size = "md",
  readOnly = false,
  className = "",
  title,
}) {
  const sizes = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  };
  const starSize = sizes[size] || sizes.md;

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={title || "Calificación"}>
      {stars.map((n) => {
        const active = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            title={readOnly ? `${value} de 5` : `Calificar con ${n} estrellas`}
            onClick={readOnly ? undefined : () => onChange?.(n)}
            className={`transition ${readOnly ? "cursor-default" : "hover:scale-110"}`}
            aria-pressed={n === value}
            disabled={readOnly}
          >
            <Star
              className={`${starSize} ${active ? "text-amber-400" : "text-slate-500"} drop-shadow-sm`}
              strokeWidth={1.5}
              // Truco para “rellenar” el icono de lucide
              style={active ? { fill: "currentColor" } : { fill: "transparent" }}
            />
          </button>
        );
      })}
    </div>
  );
}
