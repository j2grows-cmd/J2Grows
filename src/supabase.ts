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

  return {
    source: "supabase",
    species: folders.map(({ name }) => {
      const imagePath = `species/${name}/hero.png`;
      const { data: image } = supabase.storage.from("plant-images").getPublicUrl(imagePath);
      return makeStorageSpecies(name, image.publicUrl);
    }),
  };
}
