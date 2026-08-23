import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Coffee, MonitorOff, QrCode, Sparkles } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Cafe, Category, Product, TvMenuStyle } from '../../types';
import { formatPrice } from '../../utils/formatPrice';

const chunk = <T,>(items: T[], size: number) => {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size));
  return pages.length ? pages : [[]];
};

const priceFor = (product: Product) => product.promoPrice && product.promoPrice < product.price ? product.promoPrice : product.price;
const showcaseColumns = (count: number) => count <= 3 ? 'grid-cols-3' : count <= 6 ? 'grid-cols-3 grid-rows-2' : count <= 8 ? 'grid-cols-4 grid-rows-2' : 'grid-cols-4 grid-rows-3';

interface BoardProps {
  cafe: Cafe | null;
  products: Product[];
  categories: Category[];
  page: number;
  pages: Product[][];
  showcase: boolean;
  now: Date;
}

const productCategory = (categories: Category[], product: Product) => categories.find((category) => category.id === product.categoryId)?.name || 'Menu';

const CafeMark: React.FC<{ cafe?: Cafe | null; className?: string; iconClassName?: string }> = ({ className = '', iconClassName = '' }) => (
  <div className={`relative shrink-0 overflow-hidden ${className}`}><Coffee className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${iconClassName}`} /></div>
);

const ProductPicture: React.FC<{ product: Product; className?: string }> = ({ product, className = '' }) => (
  <div className={`relative overflow-hidden bg-black/10 ${className}`}>
    <Coffee className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-current opacity-25" />
    {product.imageUrl && <img src={product.imageUrl} alt="" onError={(event) => event.currentTarget.remove()} className="relative h-full w-full object-cover" />}
  </div>
);

const ElegantBoard: React.FC<BoardProps> = ({ cafe, products, categories, page, pages, showcase, now }) => {
  const visible = pages[page];
  const index: number = -1;
  return (
    <div className="min-h-screen overflow-hidden bg-[#c9a678] p-[1.5vw] text-[#3b2417]">
      <div className="relative flex min-h-[calc(100vh-3vw)] overflow-hidden rounded-[1.7vw] border-[0.35vw] border-[#4a2b1a] bg-[#f6eddb] shadow-[0_2vw_5vw_rgba(38,18,9,0.42)]">
        <aside className="relative z-10 flex w-[19vw] shrink-0 flex-col border-r border-[#b18b5c] bg-[#f8f1e4] p-[2vw] text-center">
          <div className="mx-auto flex h-[5vw] w-[5vw] items-center justify-center rounded-full border-2 border-[#9b7b43] text-[#9b7b43]"><Sparkles className="h-[2.2vw] w-[2.2vw]" /></div>
          <p className="mt-[1.5vw] font-serif text-[0.85vw] uppercase tracking-[0.35em] text-[#927242]">Maison de café</p>
          <h1 className="mt-[0.6vw] font-serif text-[2.15vw] leading-none">{cafe?.name || 'TakTak Café'}</h1>
          <div className="my-[1.8vw] h-px bg-[#b18b5c]" />
          <p className="font-serif text-[1.05vw] italic text-[#765235]">Une pause, bien servie.</p>
          <div className="mt-auto rounded-[1.2vw] border border-[#b18b5c] bg-[#eee0c6] p-[1.1vw]">
            <QrCode className="mx-auto h-[3.3vw] w-[3.3vw] text-[#3b2417]" />
            <p className="mt-[0.65vw] text-[0.68vw] font-bold uppercase tracking-[0.13em]">Scannez pour commander</p>
          </div>
          <p className="mt-[1.4vw] text-[0.72vw] font-semibold text-[#765235]">{products.length} créations • {new Intl.DateTimeFormat('fr-TN', { hour: '2-digit', minute: '2-digit' }).format(now)}</p>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col p-[2.2vw]">
          <header className="flex items-end justify-between border-b border-[#b18b5c] pb-[1.15vw]">
            <div>
              <p className="text-[0.72vw] font-bold uppercase tracking-[0.25em] text-[#947143]">La carte du jour</p>
              <h2 className="mt-[0.25vw] font-serif text-[2.6vw] leading-none">{showcase ? 'Nos indispensables' : 'Le menu complet'}</h2>
            </div>
            {!showcase && <p className="font-serif text-[1.2vw] italic text-[#765235]">Page {page + 1} / {pages.length}</p>}
          </header>

          {showcase ? (
            <div className={`mt-[1.5vw] grid min-h-0 flex-1 gap-[1.05vw] ${showcaseColumns(visible.length)}`}>
              {visible.map((product) => (
                <article key={product.id} className="flex min-h-0 flex-col rounded-[1vw] border border-[#c8a778] bg-[#fffaf0] p-[0.65vw] shadow-[0_0.35vw_0.8vw_rgba(68,39,20,0.12)]">
                  <ProductPicture product={product} className="min-h-0 flex-1 rounded-[0.65vw] text-[#765235]" />
                  <div className="pt-[0.75vw]">
                    <p className="text-[0.58vw] font-bold uppercase tracking-[0.13em] text-[#9b7745]">{productCategory(categories, product)}</p>
                    <div className="mt-[0.25vw] flex items-end justify-between gap-2"><h3 className="font-serif text-[1.12vw] leading-tight">{product.name}</h3><span className="shrink-0 font-serif text-[1.2vw] font-bold">{formatPrice(priceFor(product))}</span></div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-[1.3vw] grid min-h-0 flex-1 grid-cols-3 content-start gap-x-[1vw] gap-y-[0.7vw]">
              {visible.map((product) => (
                <article key={product.id} className={`${index === 0 ? 'col-span-2 row-span-2 flex-col items-stretch p-[0.65vw]' : 'flex h-[9.15vh] items-center gap-[0.65vw] p-[0.5vw]'} flex overflow-hidden rounded-[0.65vw] border border-[#d4b98f] bg-[#fffaf0]`}>
                  {index === 0 ? <><ProductPicture product={product} className="min-h-0 flex-1 rounded-[0.45vw] text-[#765235]" /><div className="flex items-end justify-between gap-2 pt-[0.45vw]"><div><p className="text-[0.55vw] font-bold uppercase tracking-wider text-[#967544]">SÃ©lection â€¢ {productCategory(categories, product)}</p><h3 className="font-serif text-[1.25vw] leading-tight">{product.name}</h3></div><span className="font-serif text-[1.18vw] font-bold">{formatPrice(priceFor(product))}</span></div></> : <>
                  <ProductPicture product={product} className="h-full w-[4.7vw] shrink-0 rounded-[0.4vw] text-[#765235]" />
                  <div className="min-w-0 flex-1"><p className="truncate text-[0.52vw] font-bold uppercase tracking-wider text-[#967544]">{productCategory(categories, product)}</p><h3 className="mt-[0.2vw] line-clamp-2 font-serif text-[0.92vw] leading-tight">{product.name}</h3></div>
                  <span className="shrink-0 font-serif text-[0.94vw] font-bold">{formatPrice(priceFor(product))}</span></>}
                </article>
              ))}
            </div>
          )}
          <footer className="mt-[1vw] flex items-center justify-between border-t border-[#b18b5c] pt-[0.8vw] text-[0.65vw] font-semibold uppercase tracking-[0.14em] text-[#765235]"><span>Prix et disponibilités mis à jour en direct</span><span>TakTak • À votre table</span></footer>
        </main>
      </div>
    </div>
  );
};

const EspressoBoard: React.FC<BoardProps> = ({ cafe, products, categories, page, pages, showcase, now }) => {
  const visible = pages[page];
  const index: number = -1;
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#100a07] px-[3vw] py-[2vw] text-[#f8e5bd]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(203,137,64,0.35),transparent_24%),radial-gradient(circle_at_88%_4%,rgba(203,137,64,0.25),transparent_20%),linear-gradient(90deg,rgba(0,0,0,0.35)_1px,transparent_1px)] bg-[length:auto,auto,8vw_100%]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4vw)] max-w-[94vw] flex-col rounded-[1.1vw] border border-[#ab7740]/60 bg-[#1c110c]/90 p-[1.6vw] shadow-[0_2vw_5vw_rgba(0,0,0,0.6)]">
        <header className="flex items-center justify-between border-b border-[#b8864c]/60 pb-[1vw]">
          <div className="flex items-center gap-[1vw]"><CafeMark cafe={cafe} className="flex h-[4.2vw] w-[4.2vw] items-center justify-center rounded-full border border-[#d8ad6d] bg-[#3c2316] text-[#edc67e]" iconClassName="h-[1.8vw] w-[1.8vw]" /><div><p className="text-[0.63vw] font-bold uppercase tracking-[0.32em] text-[#d7aa68]">Roasted daily</p><h1 className="mt-[0.2vw] font-serif text-[2.2vw] leading-none">{cafe?.name || 'TakTak Café'}</h1></div></div>
          <div className="text-right"><p className="font-serif text-[1.7vw]">{new Intl.DateTimeFormat('fr-TN', { hour: '2-digit', minute: '2-digit' }).format(now)}</p><p className="mt-[0.2vw] text-[0.63vw] uppercase tracking-[0.18em] text-[#b99565]">{products.length} produits • {showcase ? 'sélection maison' : `page ${page + 1}/${pages.length}`}</p></div>
        </header>

          <div className="flex min-h-0 flex-1 flex-col py-[1.2vw]">
          <div className="mb-[0.9vw] flex items-center gap-[0.8vw]"><span className="h-px flex-1 bg-[#b8864c]/50" /><h2 className="font-serif text-[1.5vw] italic">{showcase ? 'Laissez-vous tenter' : 'Coffee & Kitchen Menu'}</h2><span className="h-px flex-1 bg-[#b8864c]/50" /></div>
          {showcase ? (
            <div className={`grid min-h-0 flex-1 gap-[1vw] ${showcaseColumns(visible.length)}`}>
              {visible.map((product) => (
                <article key={product.id} className="group relative flex min-h-0 flex-col overflow-hidden rounded-[0.85vw] border border-[#8c5f36] bg-[#2a1811]">
                  <ProductPicture product={product} className="min-h-0 flex-1 text-[#e1af68]" />
                  <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(transparent,rgba(16,8,5,0.97)_40%)] px-[1vw] pb-[1vw] pt-[3vw]"><p className="text-[0.58vw] font-bold uppercase tracking-[0.18em] text-[#e5b66f]">{productCategory(categories, product)}</p><div className="mt-[0.25vw] flex items-end justify-between gap-2"><h3 className="font-serif text-[1.18vw] leading-tight text-white">{product.name}</h3><span className="shrink-0 text-[1.05vw] font-bold text-[#f0c479]">{formatPrice(priceFor(product))} <small className="text-[0.52vw]">TND</small></span></div></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-4 content-start gap-[0.75vw]">
              {visible.map((product) => (
                <article key={product.id} className={`${index === 0 ? 'col-span-2 row-span-2' : ''} flex h-[14.7vh] flex-col overflow-hidden rounded-[0.65vw] border border-[#674326] bg-[#28170f]`}>
                  {index === 0 ? <><ProductPicture product={product} className="min-h-0 flex-1 text-[#e1af68]" /><div className="flex items-end justify-between border-t border-[#674326] p-[0.72vw]"><div><p className="text-[0.52vw] font-bold uppercase tracking-wider text-[#bc8f58]">Signature • {productCategory(categories, product)}</p><h3 className="font-serif text-[1.2vw] leading-tight text-white">{product.name}</h3></div><span className="text-[1.08vw] font-bold text-[#efc173]">{formatPrice(priceFor(product))} TND</span></div></> : <><div className="flex min-h-0 flex-1 items-center gap-[0.55vw] p-[0.5vw]"><ProductPicture product={product} className="h-full w-[5.2vw] shrink-0 rounded-[0.4vw] text-[#d39f5b]" /><div className="min-w-0"><p className="truncate text-[0.48vw] font-bold uppercase tracking-wider text-[#bc8f58]">{productCategory(categories, product)}</p><h3 className="mt-[0.25vw] line-clamp-2 font-serif text-[0.88vw] leading-tight text-white">{product.name}</h3></div></div><div className="flex justify-end border-t border-[#674326] px-[0.55vw] py-[0.35vw] text-[0.82vw] font-bold text-[#efc173]">{formatPrice(priceFor(product))} TND</div></>}
                </article>
              ))}
            </div>
          )}
        </div>
        <footer className="flex items-center justify-between border-t border-[#b8864c]/45 pt-[0.8vw] text-[0.62vw] uppercase tracking-[0.2em] text-[#c59b63]"><span>Barista craft • kitchen favourites</span><span>Scannez le QR de votre table pour commander</span></footer>
      </div>
    </div>
  );
};

const UrbanBoard: React.FC<BoardProps> = ({ cafe, products, categories, page, pages, showcase, now }) => {
  const visible = pages[page];
  const index: number = -1;
  return (
    <div className="min-h-screen overflow-hidden bg-[#10100e] p-[1.25vw] text-white">
      <div className="relative flex min-h-[calc(100vh-2.5vw)] overflow-hidden border border-[#f6c841] bg-[#151512]">
        <div className="pointer-events-none absolute -right-[9vw] -top-[10vw] h-[28vw] w-[28vw] rounded-full bg-[#f6c841] opacity-15 blur-[1vw]" />
        <aside className="relative z-10 flex w-[16vw] shrink-0 flex-col border-r border-[#f6c841] bg-[#f6c841] p-[1.5vw] text-[#11110e]">
          <p className="text-[0.68vw] font-black uppercase tracking-[0.18em]">Coffee / food / more</p>
          <h1 className="mt-[1vw] text-[2.55vw] font-black uppercase leading-[0.82] tracking-[-0.08em]">{(cafe?.name || 'TakTak').split(' ')[0]}<br />Menu</h1>
          <div className="mt-[1.5vw] h-2 w-full bg-[#11110e]" />
          <p className="mt-[1.2vw] text-[1.05vw] font-bold leading-tight">Direct. Fresh.<br />Made for now.</p>
          <div className="mt-auto"><QrCode className="h-[3.2vw] w-[3.2vw]" /><p className="mt-[0.55vw] text-[0.6vw] font-black uppercase tracking-[0.12em]">Commande à table</p></div>
        </aside>
        <main className="relative z-10 flex min-w-0 flex-1 flex-col p-[1.6vw]">
          <header className="flex items-start justify-between"><div><p className="text-[0.65vw] font-black uppercase tracking-[0.22em] text-[#f6c841]">Live menu board</p><h2 className="mt-[0.35vw] text-[2.6vw] font-black uppercase leading-none tracking-[-0.055em]">{showcase ? 'Top picks' : 'Full menu'}</h2></div><div className="text-right"><p className="text-[1.7vw] font-black tabular-nums">{new Intl.DateTimeFormat('fr-TN', { hour: '2-digit', minute: '2-digit' }).format(now)}</p><p className="mt-[0.2vw] text-[0.6vw] font-bold uppercase tracking-[0.14em] text-gray-400">{products.length} produits • {showcase ? 'now serving' : `page ${page + 1}/${pages.length}`}</p></div></header>

          {showcase ? (
            <div className={`mt-[1.25vw] grid min-h-0 flex-1 gap-[0.8vw] ${showcaseColumns(visible.length)}`}>
              {visible.map((product, index) => (
                <article key={product.id} className={`relative overflow-hidden border ${index % 3 === 1 ? 'border-[#f6c841] bg-[#f6c841] text-[#11110e]' : 'border-[#3d3d35] bg-[#23231f]'}`}>
                  <ProductPicture product={product} className="absolute inset-0 h-full w-full opacity-60" />
                  <div className={`absolute inset-x-0 bottom-0 p-[0.9vw] ${index % 3 === 1 ? 'bg-[#f6c841]/95' : 'bg-[#11110e]/90'}`}><p className="text-[0.5vw] font-black uppercase tracking-[0.15em] opacity-70">{productCategory(categories, product)}</p><h3 className="mt-[0.25vw] text-[1.18vw] font-black uppercase leading-tight tracking-[-0.04em]">{product.name}</h3><p className="mt-[0.45vw] text-[1.08vw] font-black">{formatPrice(priceFor(product))} <small className="text-[0.52vw]">TND</small></p></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-[1.25vw] grid min-h-0 flex-1 grid-cols-4 content-start gap-[0.6vw]">
              {visible.map((product) => (
                <article key={product.id} className={`${index === 0 ? 'col-span-2 row-span-2 flex-col' : 'flex'} h-[14.6vh] overflow-hidden border ${index === 0 || index % 5 === 1 ? 'border-[#f6c841] bg-[#f6c841] text-[#11110e]' : 'border-[#393932] bg-[#20201c] text-white'}`}>
                  {index === 0 ? <><ProductPicture product={product} className="min-h-0 flex-1 text-[#11110e]" /><div className="p-[0.7vw]"><p className="text-[0.5vw] font-black uppercase tracking-[0.13em] opacity-60">Featured • {productCategory(categories, product)}</p><div className="flex items-end justify-between gap-2"><h3 className="text-[1.25vw] font-black uppercase leading-tight tracking-[-0.04em]">{product.name}</h3><p className="shrink-0 text-[1.05vw] font-black">{formatPrice(priceFor(product))} TND</p></div></div></> : <><ProductPicture product={product} className="h-full w-[5.2vw] shrink-0 text-[#f6c841]" /><div className="flex min-w-0 flex-1 flex-col p-[0.55vw]"><p className="truncate text-[0.48vw] font-black uppercase tracking-[0.13em] opacity-60">{productCategory(categories, product)}</p><h3 className="mt-[0.25vw] line-clamp-2 text-[0.9vw] font-black uppercase leading-tight tracking-[-0.03em]">{product.name}</h3><p className="mt-auto text-[0.86vw] font-black">{formatPrice(priceFor(product))} <small className="text-[0.48vw]">TND</small></p></div></>}
                </article>
              ))}
            </div>
          )}
          <footer className="mt-[0.9vw] flex items-center justify-between border-t border-[#3d3d35] pt-[0.75vw] text-[0.6vw] font-bold uppercase tracking-[0.18em] text-gray-400"><span>Prix et disponibilité en direct</span><span className="text-[#f6c841]">{pages.length > 1 ? `● ${Array.from({ length: pages.length - 1 }, () => '○').join(' ')}` : '●'} </span></footer>
        </main>
      </div>
    </div>
  );
};

export const TvMenu: React.FC = () => {
  const { cafeSlug = 'monastir-lounge' } = useParams<{ cafeSlug: string }>();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cafeData, menuData] = await Promise.all([api.getCafeBySlug(cafeSlug), api.getMenu(cafeSlug)]);
        setCafe(cafeData);
        setCategories(menuData.categories);
        setProducts(menuData.products.filter((product) => product.isAvailable));
      } finally {
        setLoading(false);
      }
    };
    load();
    const refresh = window.setInterval(load, 60000);
    return () => window.clearInterval(refresh);
  }, [cafeSlug]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(clock);
  }, []);

  const style: TvMenuStyle = cafe?.tvMenuStyle ?? 'ELEGANT';
  const showcase = products.length <= 12;
  const pageSize = style === 'URBAN' ? 24 : style === 'ESPRESSO' ? 20 : 18;
  const orderedProducts = useMemo(() => {
    const order = new Map(categories.map((category, index) => [category.id, index]));
    return [...products].sort((a, b) => (order.get(a.categoryId) ?? 99) - (order.get(b.categoryId) ?? 99));
  }, [products, categories]);
  const pages = useMemo(() => chunk(orderedProducts, showcase ? 12 : pageSize), [orderedProducts, pageSize, showcase]);

  useEffect(() => {
    setPage(0);
    if (pages.length <= 1) return;
    const rotation = window.setInterval(() => setPage((current) => (current + 1) % pages.length), 12000);
    return () => window.clearInterval(rotation);
  }, [pages.length]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#10100e] text-xl font-bold text-white">Préparation du menu…</div>;
  if (cafe?.tvMenuEnabled === false) return <div className="flex h-screen flex-col items-center justify-center gap-5 bg-[#090a0d] text-center text-white"><MonitorOff className="h-14 w-14 text-gray-600" /><div><h1 className="text-3xl font-black">Menu TV indisponible</h1><p className="mt-2 text-gray-400">Activez cette fonctionnalité depuis l’administration.</p></div></div>;
  if (products.length === 0) return <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#10100e] text-center text-white"><Coffee className="h-12 w-12 text-[#f6c841]" /><h1 className="text-3xl font-black">Le menu arrive bientôt</h1><p className="text-gray-400">Les produits disponibles s’afficheront automatiquement.</p></div>;

  const boardProps: BoardProps = { cafe, products, categories, page, pages, showcase, now };
  if (style === 'ESPRESSO') return <EspressoBoard {...boardProps} />;
  if (style === 'URBAN') return <UrbanBoard {...boardProps} />;
  return <ElegantBoard {...boardProps} />;
};
