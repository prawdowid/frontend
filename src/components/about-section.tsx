const TEAM_MEMBERS = [
  "Jakub Sowiński",
  "Piotr Gołębiowski",
  "Jakub Stodolny",
  "Krystian Trunowicz",
  "Jakub Starostecki",
];

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
          <h3 className="text-lg font-semibold text-navy">
            KN Neuron Prawdowid
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-crimson">
            UMG - Wydział Informatyczny
          </p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Członkowie
          </p>

          <ul className="mt-3 space-y-2">
            {TEAM_MEMBERS.map((member) => (
              <li
                key={member}
                className="flex items-center gap-2.5 text-sm text-navy"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 bg-crimson"
                  aria-hidden="true"
                />
                {member}
              </li>
            ))}
          </ul>

          <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
            PRAWDOWID, Hackathon 2026.
          </p>
        </div>
      </div>
    </section>
  );
}
