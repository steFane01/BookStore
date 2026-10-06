import { Link } from 'react-router-dom'
import { siteConfig } from '../config/site'
import { AnimatedSection } from '../components/AnimatedSection'
import { SectionHeading } from '../components/SectionHeading'
import { IconFeather, IconArrowRight } from '../components/icons'

export default function About() {
  return (
    <div className="pt-20 md:pt-24">
      {/* Intro */}
      <AnimatedSection className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Despre noi</p>
          <h1 className="serif-display mt-4 text-4xl text-balance text-ink sm:text-5xl md:text-6xl">
            O librărie pentru cei care citesc încet
          </h1>
          <p className="mt-8 font-serif text-xl leading-relaxed text-ink-light">
            {siteConfig.tagline}
          </p>
        </div>
      </AnimatedSection>

      {/* Story */}
      <AnimatedSection className="border-y border-ink/10 bg-paper-200/50 py-20">
        <div className="container-page grid gap-10 md:grid-cols-2">
          <SectionHeading
            eyebrow="Povestea noastră"
            title="Am deschis o librărie mică, cu gust mare"
          />
          <div className="flex flex-col gap-5 leading-relaxed text-ink-light">
            <p>
              {siteConfig.brandNameLong} s-a născut dintr-o convingere simplă: că
              o carte este mai mult decât un text. Este un obiect care cere să
              fie ținut în mână, deschis cu grijă, subliniat, împrumutat, iubit.
            </p>
            <p>
              Alegem titluri cu răbdare, lucrăm cu tipografii care încă mai știu
              să facă lucruri frumoase și ne asumăm să publicăm cărți pe care să
              le recomandăm necondiționat unui prieten.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Values */}
      <AnimatedSection className="container-page py-20">
        <SectionHeading eyebrow="Ce ne ghidează" title="Principiile noastre" align="center" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <ValueCard
            title="Răbdarea"
            text="Nu publicăm grăbit. Fiecare carte trece prin mâini atente, de la text până la grosimea hârtiei."
          />
          <ValueCard
            title="Gustul"
            text="Preferăm puține titluri, bune, în locul unei vitrine pline de lucruri gălăgioase."
          />
          <ValueCard
            title="Comunitatea"
            text="Credem în cititorii noștri: în recomandări făcute om către om, în lecturi care rămân."
          />
        </div>
      </AnimatedSection>

      {/* What we do */}
      <AnimatedSection className="border-t border-ink/10 bg-paper-200/50 py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Ce facem" title="Librărie & editura" />
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div className="border border-ink/10 bg-paper-50 p-8">
              <IconFeather className="mb-4 h-8 w-8 text-brass-dark" />
              <h3 className="font-serif text-2xl text-ink">Librărie</h3>
              <p className="mt-3 leading-relaxed text-ink-muted">
                Un stoc atent selectat de ficțiune, eseuri și cărți care merită
                spațiu în biblioteca ta. Căutăm titluri care ies din val și le
                punem în față.
              </p>
            </div>
            <div className="border border-ink/10 bg-paper-50 p-8">
              <IconFeather className="mb-4 h-8 w-8 text-brass-dark" />
              <h3 className="font-serif text-2xl text-ink">Editura</h3>
              <p className="mt-3 leading-relaxed text-ink-muted">
                Publicăm puține cărți, dar cu grijă: traduceri atente, design
                editorial atent și o prezență de hârtie care să stea bine pe
                raftul tău.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection className="container-page py-20 text-center">
        <p className="font-serif text-2xl italic text-ink-light">
          Vrei să ne cunoști? Vino să ne vizitezi.
        </p>
        <Link to="/contact" className="btn btn-primary mt-6 inline-flex items-center gap-2 px-7 py-3">
          Contactează-ne
          <IconArrowRight className="h-4 w-4" />
        </Link>
      </AnimatedSection>
    </div>
  )
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-ink/10 bg-paper-50 p-8 text-center">
      <div className="mx-auto mb-4 h-px w-10 bg-brass" aria-hidden="true" />
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      <p className="mt-3 leading-relaxed text-ink-muted">{text}</p>
    </div>
  )
}
