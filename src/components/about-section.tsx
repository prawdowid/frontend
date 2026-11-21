export function AboutSection() {
  return (
    <section
      id="o-nas"
      aria-labelledby="about-heading"
      className="scroll-mt-16 bg-mist py-16 sm:py-20"
    >
      <div className="shell grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <div>
          <h2
            id="about-heading"
            className="text-3xl font-bold text-navy sm:text-4xl"
          >
            O nas
          </h2>
          <span className="accent-rule" aria-hidden="true" />
        </div>

        <div className="max-w-2xl">
          <p className="text-base leading-relaxed text-navy">
            [Krótki opis zespołu, celu projektu i kontaktu. Do podmiany.]
          </p>
          <p className="mt-4 text-sm text-muted">
            PRAWDOWID, Hackathon 2026.
          </p>
        </div>
      </div>
    </section>
  );
}
