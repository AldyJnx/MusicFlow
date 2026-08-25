import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type PagedLibraryCarouselProps<T> = {
  pages: T[][];
  total: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  resetKey: string;
  label: string;
};

const PAGE_SIZE = 6;

export default function PagedLibraryCarousel<T>({
  pages,
  total,
  getKey,
  renderItem,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  resetKey,
  label,
}: PagedLibraryCarouselProps<T>) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, moved: false, x: 0, scrollLeft: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const scrollToPage = useCallback(
    (page: number, behavior: ScrollBehavior) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const next = Math.max(0, Math.min(page, totalPages - 1));
      viewport.scrollTo({ left: next * viewport.clientWidth, behavior });
      setCurrentPage(next);
    },
    [totalPages],
  );

  const goToPage = useCallback(
    async (page: number) => {
      if (page >= pages.length && hasNextPage && !isFetchingNextPage) {
        await fetchNextPage();
      }
      requestAnimationFrame(() => scrollToPage(page, "smooth"));
    },
    [
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
      pages.length,
      scrollToPage,
    ],
  );

  useEffect(() => {
    if (currentPage >= pages.length - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [
    currentPage,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pages.length,
  ]);

  function finishDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || !dragRef.current.active) return;
    const drag = dragRef.current;
    dragRef.current.active = false;
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    if (!drag.moved) return;
    const nearest = Math.round(viewport.scrollLeft / viewport.clientWidth);
    const direction = event.clientX - drag.x;
    const requestedPage = drag.moved
      ? direction < 0
        ? currentPage + 1
        : currentPage - 1
      : nearest;
    void goToPage(requestedPage);
  }

  return (
    <section aria-label={label} className="min-w-0">
      <div className="relative">
        <div
          ref={viewportRef}
          data-testid="library-carousel-viewport"
          className="flex touch-pan-y snap-x snap-mandatory select-none overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const viewport = event.currentTarget;
            if (!viewport.clientWidth) return;
            setCurrentPage(
              Math.max(
                0,
                Math.min(
                  totalPages - 1,
                  Math.round(viewport.scrollLeft / viewport.clientWidth),
                ),
              ),
            );
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            if (
              event.target instanceof Element &&
              event.target.closest("button, a, input, select, textarea")
            ) {
              return;
            }
            const viewport = event.currentTarget;
            dragRef.current = {
              active: true,
              moved: false,
              x: event.clientX,
              scrollLeft: viewport.scrollLeft,
            };
            viewport.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const viewport = event.currentTarget;
            const drag = dragRef.current;
            if (!drag.active) return;
            const delta = event.clientX - drag.x;
            if (Math.abs(delta) > 5) drag.moved = true;
            viewport.scrollLeft = drag.scrollLeft - delta;
          }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onClickCapture={(event) => {
            if (!dragRef.current.moved) return;
            event.preventDefault();
            event.stopPropagation();
            dragRef.current.moved = false;
          }}
        >
          {pages.map((page, pageIndex) => (
            <div
              key={`${resetKey}-${pageIndex}`}
              className="min-w-full snap-start px-8 py-1"
              aria-label={`${label}, página ${pageIndex + 1} de ${totalPages}`}
            >
              <div className="mx-auto grid w-full max-w-[780px] grid-cols-3 gap-3">
                {page.map((item) => (
                  <div key={getKey(item)} className="min-w-0">
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-center">
          <div className="flex items-center gap-1.5" aria-label="Páginas">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => void goToPage(index)}
                aria-label={`Ir a la página ${index + 1}`}
                aria-current={currentPage === index ? "page" : undefined}
                className={`h-2 rounded-full transition-all ${
                  currentPage === index
                    ? "w-6 bg-[var(--color-primary)]"
                    : "w-2 bg-[var(--color-muted)]/45 hover:bg-[var(--color-muted)]"
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
