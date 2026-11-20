import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { CatalogService } from '../core/catalog.service';
import { FavoritesService } from '../core/favorites.service';
import { Product, ProductType } from '../core/models';
import { orderTypes } from '../core/shelf-order';
import { ProductsShelf } from './products-shelf';

// Caso más adverso: Pilatus con sort 5 y otro slug, y los tipos llegan en cualquier orden.
const types: ProductType[] = [
  { id: 4, name: 'Otros', slug: 'otros', sellable: true, sort: 4 },
  { id: 3, name: 'AeroSpecialties', slug: 'aerospecialties', sellable: true, sort: 3 },
  { id: 5, name: 'Pilatus Aircraft', slug: 'pilatus-aircraft', sellable: false, sort: 5 },
  { id: 1, name: 'Neumáticos', slug: 'neumaticos', sellable: true, sort: 1 },
  { id: 2, name: 'Baterías', slug: 'baterias', sellable: true, sort: 2 },
];
const mk = (id: number, name: string, type_id: number, extra: Partial<Product> = {}): Product => ({
  id, slug: 's' + id, name, part_number: null, description: null, price_ars: null, stock: 0, image_url: null, active: true,
  brand_id: null, type_id, attributes: {}, ...extra,
});
const products: Product[] = [
  ...['PC-24 Jet', 'PC-12 NG', 'PC-7 MkII', 'PC-21', 'PC-9 M'].map((n, i) => mk(100 + i, n, 5, { video_url: n === 'PC-24 Jet' ? 'https://youtu.be/x' : null })),
  ...Array.from({ length: 15 }, (_, i) => mk(200 + i, 'Neumático ' + (i + 1), 1, { price_ars: 10, stock: 3 })),
  mk(300, 'Batería A', 2), mk(400, 'Spec A', 3), mk(500, 'Otro A', 4),
];

describe('orderTypes', () => {
  it('Pilatus, Neumáticos, Baterías, AeroSpecialties, Otros — sin importar el orden ni el sort', () => {
    expect(orderTypes(types).map(t => t.name)).toEqual(['Pilatus Aircraft', 'Neumáticos', 'Baterías', 'AeroSpecialties', 'Otros']);
  });
  it('reconoce el tipo por nombre aunque el slug sea otro', () => {
    const t = [{ name: 'Neumáticos', slug: 'x1', sort: 1 }, { name: 'Pilatus Aircraft', slug: 'x2', sort: 9 }];
    expect(orderTypes(t).map(x => x.name)).toEqual(['Pilatus Aircraft', 'Neumáticos']);
  });
  it('un tipo nuevo va al final, por sort', () => {
    const t = [{ name: 'Z nuevo', slug: 'z', sort: 2 }, { name: 'Y nuevo', slug: 'y', sort: 1 }, { name: 'Otros', slug: 'otros', sort: 9 }, { name: 'Pilatus', slug: 'pilatus', sort: 7 }];
    expect(orderTypes(t).map(x => x.name)).toEqual(['Pilatus', 'Otros', 'Y nuevo', 'Z nuevo']);
  });
});

describe('ProductsShelf (orden de carriles)', () => {
  async function render() {
    await TestBed.configureTestingModule({
      imports: [ProductsShelf],
      providers: [
        provideRouter([]),
        { provide: CatalogService, useValue: { types: () => Promise.resolve(types), products: () => Promise.resolve(products) } },
        { provide: AuthService, useValue: { loggedIn: () => false } },
        { provide: CartService, useValue: { add: async () => {} } },
        { provide: FavoritesService, useValue: { isFav: () => false, toggle: async () => {} } },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(ProductsShelf); f.detectChanges(); await f.whenStable(); f.detectChanges();
    return f.nativeElement as HTMLElement;
  }

  it('muestra primero los 5 Pilatus (en orden natural), después los 15 neumáticos y el resto', async () => {
    const el = await render();
    const labels = [...el.querySelectorAll('.row-label')].map(e => e.textContent!.replace(/\s+/g, ' ').trim());
    expect(labels).toEqual(['Pilatus Aircraft 5', 'Neumáticos 15', 'Baterías 1', 'AeroSpecialties 1', 'Otros 1']);
    const rows = el.querySelectorAll('.row');
    expect(rows[0].classList.contains('lead')).toBe(true);
    expect(rows[1].classList.contains('lead')).toBe(false);
    const planes = [...rows[0].querySelectorAll('.item h4')].map(e => e.textContent);
    expect(planes).toEqual(['PC-7 MkII', 'PC-9 M', 'PC-12 NG', 'PC-21', 'PC-24 Jet']);
  });

  it('los aviones se consultan (sin precio ni carrito) y el PC-24 trae su video', async () => {
    const el = await render();
    const lead = el.querySelector('.row.lead')!;
    expect(lead.textContent).toContain('Consultar este modelo');
    expect(lead.textContent).not.toContain('en stock');
    expect(lead.querySelectorAll('a[href^="https://youtu.be"]').length).toBe(1);
    expect(el.querySelectorAll('.row')[1].textContent).toContain('en stock');
  });
});
