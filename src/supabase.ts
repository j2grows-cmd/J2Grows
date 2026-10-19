import { createClient } from "@supabase/supabase-js";
import { makeStorageSpecies, species as prototypeSpecies, type Species } from "./data";
import { getSpeciesEconomy } from "./game/catalog";
import { normalizeSpeciesRows, type ValidatedSpeciesRow } from "./game/supabase-catalog";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const imagePathOverrides: Record<string, string> = {
  // This existing object predates the standard hero.png naming convention.
  "philodendron-pink-princess": "species/philodendron-pink-princess/7313b09c-ff44-4a9f-8720-840d47117091.png",
};

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

type SpeciesRow = ValidatedSpeciesRow;

function fromSpeciesRow(row: SpeciesRow): Species {
  const local = prototypeSpecies.find((plant) => plant.id === row.id);
  const imagePath = imagePathOverrides[row.id] ?? row.image_path;
  const image = imagePath.trim() ? supabase!.storage.from("plant-images").getPublicUrl(imagePath).data.publicUrl : "";
  const fallback = makeStorageSpecies(row.id, image);
  const economy = getSpeciesEconomy(row.id) ?? getSpeciesEconomy(row.name);

  return {
    ...fallback,
    name: row.name,
    latin: row.scientific_name ?? local?.latin ?? fallback.latin,
    family: row.family ?? local?.family ?? fallback.family,
    difficulty: row.difficulty ?? local?.difficulty ?? fallback.difficulty,
    rarity: economy?.rarity ?? row.rarity ?? local?.rarity ?? fallback.rarity,
    basePrice: economy?.basePrice ?? fallback.basePrice,
    summary: row.summary ?? local?.summary ?? fallback.summary,
    light: row.light ?? local?.light ?? fallback.light,
    humidity: row.humidity ?? local?.humidity ?? fallback.humidity,
    water: row.water ?? local?.water ?? fallback.water,
    traits: row.traits.length ? row.traits : local?.traits ?? fallback.traits,
  };
}

export async function loadSpeciesCatalog(): Promise<{ species: Species[]; source: "supabase-table" | "storage-folders" | "local" }> {
  if (!supabase) return { species: prototypeSpecies, source: "local" };

  const { data: rows, error: tableError } = await supabase
    .from("species")
    .select("id, name, scientific_name, family, difficulty, rarity, image_path, summary, light, humidity, water, traits")
    .order("name");

  if (!tableError && rows?.length) {
    const validatedRows = normalizeSpeciesRows(rows);
    if (validatedRows.length) {
      if (validatedRows.length !== rows.length) console.warn(`Skipped ${rows.length - validatedRows.length} invalid or duplicate Supabase species row(s).`);
      return { species: validatedRows.map(fromSpeciesRow), source: "supabase" };
    }
    console.warn("Supabase returned no valid species rows; falling back to Storage folders.");
  }
  if (tableError) console.warn("Could not load the species table; falling back to Storage folders.", tableError.message);

  const { data, error } = await supabase.storage.from("plant-images").list("species", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    console.warn("Could not load Supabase species; using the local prototype catalogue.", error.message);
    return { species: prototypeSpecies, source: "local" };
  }

  const folders = (data ?? []).filter((entry) => entry.id === null && entry.name && entry.name !== ".folder");
  if (!folders.length) return { species: prototypeSpecies, source: "local" };

  const catalog: Species[] = [];
  // Read folder contents in small batches so non-standard image names work without
  // issuing a burst of nearly 100 simultaneous Storage requests.
  for (let index = 0; index < folders.length; index += 10) {
    const batch = await Promise.all(folders.slice(index, index + 10).map(async ({ name }) => {
      const folderPath = `species/${name}`;
      let imagePath = imagePathOverrides[name] ?? "";
      if (!imagePath) {
        const { data: files, error: listError } = await supabase.storage.from("plant-images").list(folderPath, { limit: 100 });
        if (listError) return makeStorageSpecies(name, "");

        const imageFile = files?.find((file) => file.id !== null && file.name === "hero.png" && /\.(png|jpe?g|webp|avif)$/i.test(file.name))
          ?? files?.find((file) => file.id !== null && /\.(png|jpe?g|webp|avif)$/i.test(file.name));
        imagePath = imageFile ? `${folderPath}/${imageFile.name}` : "";
      }
      const imageUrl = imagePath ? supabase.storage.from("plant-images").getPublicUrl(imagePath).data.publicUrl : "";
      return makeStorageSpecies(name, imageUrl);
    }));
    catalog.push(...batch);
  }

  return { species: catalog, source: "storage-folders" };
}
