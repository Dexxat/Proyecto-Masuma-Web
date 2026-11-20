import { ProductType } from './models';

/**
 * Orden de los tipos de producto en el sitio (estante del home, filtros y catálogo completo): una sola regla para todos.
 * Pilatus Aircraft (los aviones) primero, Neumáticos segundo, luego Baterías, AeroSpecialties y Otros.
 * Se reconoce por slug O por nombre (no depende de cómo se haya cargado en la base ni de la columna `sort`).
 * Un tipo nuevo, que no esté en la lista, va al final (entre sí, por `sort`).
 */
const ORDER: RegExp[] = [/pilatus/i, /neum[aá]tic/i, /bater[ií]a/i, /aero\s*-?\s*specialties/i, /otros?/i];

export function typeRank(t: Pick<ProductType, 'slug' | 'name'>): number {
  const key = `${t.slug ?? ''} ${t.name ?? ''}`;
  const i = ORDER.findIndex(re => re.test(key));
  return i < 0 ? ORDER.length : i;
}

export function orderTypes<T extends Pick<ProductType, 'slug' | 'name' | 'sort'>>(types: readonly T[]): T[] {
  return [...types].sort((a, b) => typeRank(a) - typeRank(b) || (a.sort ?? 0) - (b.sort ?? 0));
}
