import { createClient } from "@supabase/supabase-js";
import { makeStorageSpecies, species as prototypeSpecies, type Species } from "./data";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function loadSpeciesCatalog(): Promise<{ species: Species[]; source: "supabase" | "local" }> {
  if (!supabase) return { species: prototypeSpecies, source: "local" };

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
      const { data: files, error: listError } = await supabase.storage.from("plant-images").list(folderPath, { limit: 100 });
      if (listError) return makeStorageSpecies(name, "");

      const imageFile = files?.find((file) => file.name === "hero.png")
        ?? files?.find((file) => /\.(png|jpe?g|webp|avif)$/i.test(file.name));
      const imagePath = imageFile ? `${folderPath}/${imageFile.name}` : "";
      const imageUrl = imagePath ? supabase.storage.from("plant-images").getPublicUrl(imagePath).data.publicUrl : "";
      return makeStorageSpecies(name, imageUrl);
    }));
    catalog.push(...batch);
  }

  return { species: catalog, source: "supabase" };
}
