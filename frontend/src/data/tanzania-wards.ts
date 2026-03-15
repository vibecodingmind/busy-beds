export interface TanzaniaRegion {
  region: string;
}

export const tanzaniaRegions: TanzaniaRegion[] = [
  { region: 'Arusha' },
  { region: 'Dar es Salaam' },
  { region: 'Dodoma' },
  { region: 'Geita' },
  { region: 'Iringa' },
  { region: 'Kagera' },
  { region: 'Kaskazini Pemba' },
  { region: 'Kaskazini Unguja' },
  { region: 'Katavi' },
  { region: 'Kigoma' },
  { region: 'Kilimanjaro' },
  { region: 'Kusini Pemba' },
  { region: 'Kusini Unguja' },
  { region: 'Lindi' },
  { region: 'Manyara' },
  { region: 'Mara' },
  { region: 'Mbeya' },
  { region: 'Mjini Magharibi' },
  { region: 'Morogoro' },
  { region: 'Mtwara' },
  { region: 'Mwanza' },
  { region: 'Njombe' },
  { region: 'Pwani' },
  { region: 'Rukwa' },
  { region: 'Ruvuma' },
  { region: 'Shinyanga' },
  { region: 'Simiyu' },
  { region: 'Singida' },
  { region: 'Songwe' },
  { region: 'Tabora' },
  { region: 'Tanga' },
];

export function getTanzaniaLocationData() {
  const regions = tanzaniaRegions.map(r => r.region);
  return {
    country: 'Tanzania',
    regions,
  };
}

export function getAllRegions(): string[] {
  return tanzaniaRegions.map(r => r.region).sort();
}
