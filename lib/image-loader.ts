// Used only by the static GitHub Pages build (see next.config.ts). Local images get the
// site's basePath; remote ones (coach photos on Supabase Storage) are used as they are.
export default function imageLoader({ src }: { src: string }) {
  return src.startsWith("/") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}` : src;
}
