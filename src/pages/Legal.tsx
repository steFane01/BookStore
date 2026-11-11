import type { ReactNode } from 'react'
import { useSettings } from '../context/SettingsContext'
import { usePageMeta } from '../hooks/usePageMeta'
import { AnimatedSection } from '../components/AnimatedSection'
import { shippingFeeFor } from '../utils/shipping'

export type LegalKind = 'terms' | 'privacy' | 'cookies'

const TITLES: Record<LegalKind, string> = {
  terms: 'Termeni și condiții',
  privacy: 'Politica de confidențialitate',
  cookies: 'Politica de cookies',
}

/** Real legal pages, driven by the company data the owner fills in Settings. */
export default function Legal({ kind }: { kind: LegalKind }) {
  const { settings } = useSettings()
  usePageMeta(`${TITLES[kind]} — ${settings.brandName}`)

  const operator = settings.legalCompany || settings.brandName
  const email = settings.legalEmail || settings.contactEmail
  const address = settings.legalAddress

  return (
    <div className="pt-20 md:pt-24">
      <AnimatedSection className="container-page max-w-3xl py-16">
        <p className="eyebrow">Informații legale</p>
        <h1 className="serif-display mt-4 text-4xl text-ink sm:text-5xl">{TITLES[kind]}</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Ultima actualizare: {new Date().toLocaleDateString('ro-RO')}
        </p>

        {!settings.legalCompany && (
          <div className="mt-8 border border-brass/40 bg-brass/5 px-5 py-4 text-sm text-ink">
            Datele complete ale operatorului (denumire, CUI, număr de înregistrare, sediu)
            se publică aici imediat ce sunt completate în <strong>Admin → Setări</strong>.
          </div>
        )}

        <div className="mt-10 flex flex-col gap-8 leading-relaxed text-ink-light">
          {kind === 'terms' && (
            <>
              <Section title="1. Cine suntem">
                <p>
                  Site-ul este operat de <strong>{operator}</strong>
                  {settings.legalCui ? `, CUI ${settings.legalCui}` : ''}
                  {settings.legalRegCom ? `, ${settings.legalRegCom}` : ''}
                  {address ? `, cu sediul în ${address}` : ''}. Ne poți contacta la{' '}
                  {email ? <a className="underline underline-offset-2" href={`mailto:${email}`}>{email}</a> : 'adresa de email afișată în pagina Contact'}.
                </p>
                <p>
                  Prin plasarea unei comenzi pe acest site confirmi că ai citit și accepți
                  prezentele condiții.
                </p>
              </Section>

              <Section title="2. Produse și prețuri">
                <p>
                  Prețurile sunt afișate în lei (RON) și sunt cele valabile în momentul
                  plasării comenzii. Fotografiile au caracter ilustrativ; pot exista mici
                  diferențe de nuanță între ecran și produsul tipărit.
                </p>
                <p>
                  Disponibilitatea produselor este actualizată în timp real. Dacă un produs
                  se epuizează între timp, comanda nu este înregistrată și primești un mesaj
                  explicativ.
                </p>
              </Section>

              <Section title="3. Comenzi și plată">
                <p>
                  Nu se efectuează nicio plată online pe acest site. După plasarea comenzii,
                  primești un email de confirmare, iar noi te contactăm pentru a stabili
                  livrarea. {settings.paymentInfo}
                </p>
              </Section>

              <Section title="4. Livrare">
                <p>
                  {settings.deliveryInfo} Taxa de livrare este de{' '}
                  {shippingFeeFor(settings, 'courier').toFixed(2)} RON pentru curier la adresă,{' '}
                  {shippingFeeFor(settings, 'easybox').toFixed(2)} RON pentru ridicare din EasyBox și{' '}
                  {shippingFeeFor(settings, 'fanbox').toFixed(2)} RON pentru ridicare din FANbox.
                  Produsele digitale nu au cost de livrare. Pentru livrarea la locker, plata se face
                  cu cardul la ridicarea coletului (la EasyBox este disponibilă și plata ramburs).
                </p>
              </Section>

              <Section title="5. Dreptul de retragere">
                <p>{settings.returnsInfo}</p>
                <p>
                  Pentru a exercita acest drept, ne poți scrie la adresa de email de mai sus,
                  indicând numărul comenzii. Rambursarea se face în cel mult 14 zile de la
                  primirea returului. Produsele trebuie returnate în starea în care au fost
                  livrate. Nu se aplică produselor digitale deja descărcate și nici
                  produselor personalizate la cerere.
                </p>
              </Section>

              <Section title="6. Garanții și reclamații">
                <p>
                  Produsele beneficiază de garanțiile legale prevăzute de Legea nr. 449/2003.
                  Dacă un produs prezintă defecte, scrie-ne cu numărul comenzii și o descriere
                  a problemei, iar noi îți vom răspunde în cel mult 15 zile lucrătoare.
                </p>
              </Section>

              <Section title="7. Soluționarea litigiilor">
                <p>
                  Îți poți adresa o reclamație Autorității Naționale pentru Protecția
                  Consumatorilor (<a className="underline underline-offset-2" href="https://anpc.ro" target="_blank" rel="noreferrer">anpc.ro</a>) sau poți folosi platforma europeană de
                  soluționare online a litigiilor (
                  <a className="underline underline-offset-2" href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">ec.europa.eu/consumers/odr</a>).
                </p>
              </Section>
            </>
          )}

          {kind === 'privacy' && (
            <>
              <Section title="1. Operatorul de date">
                <p>
                  Datele tale sunt prelucrate de <strong>{operator}</strong>
                  {settings.legalCui ? `, CUI ${settings.legalCui}` : ''}
                  {address ? `, ${address}` : ''}. Ne poți scrie oricând la{' '}
                  {email ? <a className="underline underline-offset-2" href={`mailto:${email}`}>{email}</a> : 'adresa de email din pagina Contact'}.
                </p>
              </Section>

              <Section title="2. Ce date colectăm">
                <p>
                  Pentru comenzi: nume, adresă de email, telefon, adresa de livrare și
                  conținutul comenzii. Pentru cont: nume, email și parola (stocată doar ca
                  hash, nu poate fi citită de nimeni). Pentru newsletter: adresa de email.
                  Pentru mesajele din formularul de contact: nume, email și mesajul tău.
                </p>
              </Section>

              <Section title="3. Scopuri și temeiuri legale">
                <p>
                  Prelucrăm datele pentru a executa comanda (temei: executarea
                  contractului), pentru a-ți trimite newsletterul dacă te-ai abonat (temei:
                  consimțământul), pentru securitatea site-ului și prevenirea fraudei
                  (temei: interesul legitim) și pentru obligațiile contabile (temei:
                  obligație legală).
                </p>
              </Section>

              <Section title="4. Cui divulgăm datele">
                <p>
                  Doar cui este necesar: firma de curierat (pentru livrare), furnizorul de
                  email (pentru confirmări și notificări) și furnizorul de găzduire. Nu vindem
                  și nu închiriem datele tale către terți.
                </p>
              </Section>

              <Section title="5. Cât timp păstrăm datele">
                <p>
                  Datele comenzilor se păstrează pe durata necesară soluționării și a
                  garanțiilor, iar documentele contabile conform termenelor legale. Adresa de
                  newsletter este păstrată până când te dezabonezi. Poți cere ștergerea
                  contului oricând.
                </p>
              </Section>

              <Section title="6. Drepturile tale">
                <p>
                  Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate
                  și opoziție, precum și dreptul de a retrage consimțământul pentru
                  newsletter. Pentru orice solicitare, scrie-ne la adresa de email de mai sus
                  și îți răspundem în cel mult 30 de zile.
                </p>
                <p>
                  Poți depune plângere la Autoritatea Națională de Supraveghere a Prelucrării
                  Datelor cu Caracter Personal (
                  <a className="underline underline-offset-2" href="https://www.dataprotection.ro" target="_blank" rel="noreferrer">dataprotection.ro</a>).
                </p>
              </Section>

              <Section title="7. Securitate">
                <p>
                  Parolele sunt stocate criptografic (hash bcrypt), accesul la datele de
                  administrare este restricționat, iar comunicațiile sunt protejate prin
                  conexiune securizată. Vezi și <a className="underline underline-offset-2" href="/cookies">politica de cookies</a>.
                </p>
              </Section>
            </>
          )}

          {kind === 'cookies' && (
            <>
              <Section title="1. Ce folosim">
                <p>
                  Acest site <strong>nu folosește cookie-uri de publicitate sau de urmărire</strong>.
                  Folosim doar stocarea locală din browser (localStorage), strict necesară
                  pentru funcționarea magazinului.
                </p>
              </Section>

              <Section title="2. Ce salvăm în browser">
                <ul className="list-disc space-y-2 pl-5">
                  <li><code>libraria.session-token</code> și <code>libraria.session-user</code> — sesiunea ta de cont;</li>
                  <li><code>libraria.cart</code> — coșul de cumpărături;</li>
                  <li><code>libraria.intro-seen</code> — reține că ai văzut ecranul de intro în această sesiune.</li>
                </ul>
                <p>Aceste date rămân pe dispozitivul tău și nu sunt folosite pentru profilare.</p>
              </Section>

              <Section title="3. Cum le poți șterge">
                <p>
                  Le poți șterge oricând din setările browserului („Site data” /
                  „Șterge datele site-urilor”). Te poți deconecta din cont, ceea ce elimină
                  imediat tokenul de sesiune.
                </p>
              </Section>

              <Section title="4. Întrebări">
                <p>
                  Pentru orice întrebare despre datele tale, scrie-ne la{' '}
                  {email ? <a className="underline underline-offset-2" href={`mailto:${email}`}>{email}</a> : 'adresa de email din pagina Contact'}.
                </p>
              </Section>
            </>
          )}
        </div>
      </AnimatedSection>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  )
}
