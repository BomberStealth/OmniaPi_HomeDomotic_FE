import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { Card } from '@/components/common/Card';

// ============================================
// PRIVACY POLICY PAGE
// Template base da personalizzare
// ============================================

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Torna indietro
        </Link>

        <Card variant="glass" className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/20">
              <Shield className="text-primary" size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-copy">
              Privacy Policy
            </h1>
          </div>

          <div className="space-y-6 text-copy-light">
            <p className="text-sm text-copy-lighter">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">1. Introduzione</h2>
              <p className="text-sm leading-relaxed">
                La presente Privacy Policy descrive come [NOME AZIENDA] ("noi", "nostro") raccoglie,
                utilizza e protegge le informazioni personali degli utenti del sistema OmniaPi HomeDomotic.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">2. Dati Raccolti</h2>
              <p className="text-sm leading-relaxed mb-2">Raccogliamo le seguenti categorie di dati:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li><strong>Dati di registrazione:</strong> email, nome, cognome</li>
                <li><strong>Dati di utilizzo:</strong> log di accesso, azioni sui dispositivi</li>
                <li><strong>Dati tecnici:</strong> indirizzi IP, tipo di browser, sistema operativo</li>
                <li><strong>Dati domotici:</strong> stati dei dispositivi, configurazioni scene</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">3. Finalit&agrave; del Trattamento</h2>
              <p className="text-sm leading-relaxed mb-2">I dati sono trattati per:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Fornire e gestire il servizio di domotica</li>
                <li>Autenticare gli utenti e garantire la sicurezza</li>
                <li>Migliorare il servizio e risolvere problemi tecnici</li>
                <li>Inviare comunicazioni di servizio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">4. Base Giuridica</h2>
              <p className="text-sm leading-relaxed">
                Il trattamento dei dati si basa su: esecuzione del contratto di servizio,
                legittimo interesse per la sicurezza, e consenso dell'utente ove richiesto.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">5. Conservazione dei Dati</h2>
              <p className="text-sm leading-relaxed">
                I dati personali sono conservati per la durata del rapporto contrattuale
                e successivamente per il periodo richiesto dalla legge (10 anni per dati fiscali).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">6. Condivisione dei Dati</h2>
              <p className="text-sm leading-relaxed">
                I dati non vengono venduti a terzi. Possono essere condivisi con:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Fornitori di servizi tecnici (hosting, database)</li>
                <li>Autorit&agrave; competenti se richiesto per legge</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">7. Diritti dell'Utente</h2>
              <p className="text-sm leading-relaxed mb-2">
                Ai sensi del GDPR, hai diritto a:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Accedere ai tuoi dati personali</li>
                <li>Rettificare dati inesatti</li>
                <li>Cancellare i tuoi dati ("diritto all'oblio")</li>
                <li>Limitare o opporti al trattamento</li>
                <li>Portabilit&agrave; dei dati</li>
                <li>Revocare il consenso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">8. Sicurezza</h2>
              <p className="text-sm leading-relaxed">
                Adottiamo misure tecniche e organizzative per proteggere i dati,
                inclusa la crittografia delle password e l'accesso controllato ai sistemi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">9. Contatti</h2>
              <p className="text-sm leading-relaxed">
                Per esercitare i tuoi diritti o per domande sulla privacy, contattaci a:
              </p>
              <p className="text-sm mt-2">
                <strong>Email:</strong> [EMAIL PRIVACY]<br />
                <strong>Indirizzo:</strong> [INDIRIZZO AZIENDA]
              </p>
            </section>

            <div className="pt-6 border-t border-border">
              <p className="text-xs text-copy-lighter">
                Questo documento &egrave; un template e deve essere personalizzato con i dati aziendali
                e revisionato da un professionista legale prima della pubblicazione.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
