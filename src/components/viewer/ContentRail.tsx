import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Rail horizontal scrollable — flèches apparaissant au survol du rail. */
export function ContentRail({
  titre,
  sousTitre,
  extra,
  children,
  id,
}: {
  titre: string;
  sousTitre?: string;
  extra?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const maj = () => {
    const el = ref.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    maj();
    window.addEventListener("resize", maj);
    return () => window.removeEventListener("resize", maj);
  }, [children]);

  const scroller = (dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section id={id} className="group/rail relative scroll-mt-24">
      <div className="flex items-end justify-between gap-4 mb-3.5">
        <div>
          <h2 className="font-display font-extrabold text-[19px] sm:text-[21px] tracking-tight flex items-center gap-2.5">
            <span className="inline-block w-[4px] h-[20px] rounded-full bg-brand" />
            {titre}
          </h2>
          {sousTitre && <p className="text-[12px] text-white/35 mt-1 ml-[17px]">{sousTitre}</p>}
        </div>
        <div className="flex items-center gap-2 flex-none">
          {extra}
          <div className="flex gap-1.5 opacity-0 group-hover/rail:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => scroller(-1)}
              disabled={!canLeft}
              className="grid place-items-center w-9 h-9 rounded-full border border-line bg-panel hover:bg-panel3 hover:border-line2 disabled:opacity-25 transition-all"
              aria-label={`Faire défiler « ${titre} » vers la gauche`}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={() => scroller(1)}
              disabled={!canRight}
              className="grid place-items-center w-9 h-9 rounded-full border border-line bg-panel hover:bg-panel3 hover:border-line2 disabled:opacity-25 transition-all"
              aria-label={`Faire défiler « ${titre} » vers la droite`}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
      <div ref={ref} onScroll={maj} className="rail-fade flex gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-2 -my-2">
        {children}
      </div>
    </section>
  );
}
