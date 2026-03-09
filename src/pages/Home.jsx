import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Rocket,
  BookOpen,
} from "lucide-react";
import { getProducts, getCategories, getSettings } from "../lib/api";
import ProductCard from "../components/ProductCard";

const PRODUCTS_PER_PAGE = 18;
const BUYER_ROTATE_INTERVAL_MS = 5000;
const SEARCH_DEBOUNCE_MS = 1000;

const SORT_OPTIONS = [
  { value: "terlaris", label: "Terlaris" },
  { value: "terbaru", label: "Terbaru" },
  { value: "harga_terendah", label: "Harga Terendah" },
  { value: "harga_tertinggi", label: "Harga Tertinggi" },
];

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("terlaris");
  const [sortOpen, setSortOpen] = useState(false);
  const [buyerIndex, setBuyerIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [announcement, setAnnouncement] = useState("");
  const requestIdRef = useRef(0);

  const debouncedSearch = useDebounce(search, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    getSettings()
      .then((s) => setAnnouncement(s.announcement || ""))
      .catch(() => {});
  }, []);

  const buyerListForRotate = products.filter((p) => p.name);
  useEffect(() => {
    if (buyerListForRotate.length <= 1) return;
    const t = setInterval(() => {
      setBuyerIndex((i) => (i + 1) % buyerListForRotate.length);
    }, BUYER_ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [buyerListForRotate.length]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, sort]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    async function load() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          getProducts({
            search: debouncedSearch || undefined,
            category: category || undefined,
            sort,
            page,
            limit: PRODUCTS_PER_PAGE,
          }),
          getCategories(),
        ]);
        if (requestIdRef.current !== requestId) return;
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setTotalPages(productsRes.totalPages || 1);
        setCategories(
          Array.isArray(categoriesRes)
            ? categoriesRes
            : categoriesRes.data || [],
        );
      } catch {
        if (requestIdRef.current !== requestId) return;
        setProducts([]);
        setTotalPages(1);
      } finally {
        if (requestIdRef.current === requestId) setLoading(false);
      }
    }
    load();
  }, [debouncedSearch, category, sort, page]);

  const buyerListForShow = products.filter((p) => p.name);
  const currentBuyer =
    buyerListForShow[buyerIndex % Math.max(buyerListForShow.length, 1)] ??
    buyerListForShow[0];

  const goPage = useCallback(
    (p) => {
      setPage(Math.max(1, Math.min(p, totalPages)));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages],
  );

  const pageNumbers = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="flex min-h-full flex-1 flex-col space-y-6">
      <div className="flex-1 space-y-6">
        {/* Pengumuman marquee */}
        {announcement && (
          <div
            className="flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3"
            data-aos="fade-down"
          >
            <div className="flex shrink-0 items-center justify-center rounded-lg bg-primary-100 p-2">
              <Rocket className="h-5 w-5 text-primary-600" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900">Pengumuman</p>
              <div className="relative mt-0.5 overflow-hidden">
                <div className="inline-block animate-marquee whitespace-nowrap text-sm text-gray-600">
                  <span className="mr-8">{announcement}</span>
                  <span className="mr-8">{announcement}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buyer notification */}
        <div
          className="flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3"
          data-aos="fade-down"
        >
          <div className="flex shrink-0 items-center justify-center rounded-lg bg-amber-100 p-2">
            <BookOpen className="h-5 w-5 text-amber-700" />
          </div>
          <div className="min-w-0 flex-1">
            {currentBuyer ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  Terjual : {currentBuyer.name} —{" "}
                  <span className="font-semibold text-primary-600">
                    Rp{Number(currentBuyer.price).toLocaleString("id-ID")}
                  </span>
                </p>
                {currentBuyer.original_price > 0 &&
                  currentBuyer.original_price > currentBuyer.price && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      Harga Normal: Rp
                      {Number(currentBuyer.original_price).toLocaleString(
                        "id-ID",
                      )}{" "}
                      —{" "}
                      <span className="text-red-600">
                        Potongan: Rp
                        {Number(
                          currentBuyer.original_price - currentBuyer.price,
                        ).toLocaleString("id-ID")}
                      </span>
                    </p>
                  )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                Belum ada notifikasi pembeli.
              </p>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2" data-aos="fade-up">
          <button
            onClick={() => setCategory("")}
            className={`inline-flex transform px-4 py-2.5 text-sm font-medium italic transition-colors [-skew-x-12] shadow-sm ${
              !category
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 shadow-card hover:bg-gray-50"
            }`}
          >
            <span className="skew-x-12">Semua</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug || cat.id}
              onClick={() => setCategory(cat.slug || cat.name)}
              className={`inline-flex transform px-4 py-2.5 text-sm font-medium italic transition-colors [-skew-x-12] shadow-sm ${
                category === (cat.slug || cat.name)
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 shadow-card hover:bg-gray-50"
              }`}
            >
              <span className="skew-x-12">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Search & sort */}
        <div className="flex flex-wrap items-center gap-4" data-aos="fade-up">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
            >
              {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Terlaris"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${sortOpen ? "rotate-180" : ""}`}
              />
            </button>
            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSortOpen(false)}
                />
                <ul className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <li key={opt.value}>
                      <button
                        onClick={() => {
                          setSort(opt.value);
                          setSortOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm ${
                          sort === opt.value
                            ? "bg-primary-50 text-primary-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="text-sm text-gray-500">Memuat produk...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-white py-12 text-center shadow-card">
            <Package className="h-12 w-12 text-gray-300" />
            <p className="mt-2 font-medium text-gray-600">Belum ada produk</p>
            <p className="text-sm text-gray-500">
              Coba ubah filter atau kata kunci.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  data-aos-delay={(i % 3) * 100}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <button
                  onClick={() => goPage(page - 1)}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {start > 1 && (
                  <>
                    <button
                      onClick={() => goPage(1)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      1
                    </button>
                    {start > 2 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                  </>
                )}
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => goPage(n)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      n === page
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {end < totalPages && (
                  <>
                    {end < totalPages - 1 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => goPage(totalPages)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => goPage(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer
        className="mt-auto flex flex-wrap items-center gap-4 border-t border-gray-200 pt-6"
        data-aos="fade-up"
      >
        <a href="#" className="text-sm text-primary-600 hover:underline">
          Kontak CS
        </a>
        <a href="#" className="text-sm text-primary-600 hover:underline">
          Metode Pembayaran
        </a>
      </footer>
    </div>
  );
}
