export function PageHero({
  title,
  intro,
  eyebrow,
}: {
  title: string;
  intro?: string;
  eyebrow?: string;
}) {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-14 sm:px-6 sm:pt-20">
        {eyebrow && <p className="eyebrow animate-fade-up">{eyebrow}</p>}
        <h1 className="text-gradient animate-fade-up mt-4 pb-1 text-4xl font-black tracking-tight sm:text-6xl">
          {title}
        </h1>
        {intro && (
          <p className="animate-fade-up mt-4 max-w-2xl text-lg text-muted [animation-delay:80ms]">
            {intro}
          </p>
        )}
      </div>
    </section>
  );
}
