import { Link } from 'react-router-dom';
import { RiArrowLeftLine, RiFileTextLine } from 'react-icons/ri';
import { Card } from '@/components/common/Card';

// ============================================
// TERMS OF SERVICE PAGE
// Template base da personalizzare
// ============================================

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-light transition-colors mb-6"
        >
          <RiArrowLeftLine size={20} />
          Torna indietro
        </Link>

        <Card variant="glass" className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/20">
              <RiFileTextLine className="text-primary" size={24} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-copy">
              Termini di Servizio
            </h1>
          </div>

          <div className="space-y-6 text-copy-light">
            <p className="text-sm text-copy-lighter">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">1. Accettazione dei Termini</h2>
              <p className="text-sm leading-relaxed">
                Utilizzando il sistema OmniaPi HomeDomotic, l'utente accetta integralmente
                i presenti Termini di Servizio. Se non si accettano questi termini,
                non &egrave; consentito utilizzare il servizio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">2. Descrizione del Servizio</h2>
              <p className="text-sm leading-relaxed">
                OmniaPi HomeDomotic &egrave; un sistema di domotica che permette il controllo
                e la gestione di dispositivi smart home. Il servizio include:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4 mt-2">
                <li>Controllo remoto di dispositivi (luci, tapparelle, termostati)</li>
                <li>Creazione e gestione di scene automatizzate</li>
                <li>Monitoraggio dello stato dei dispositivi</li>
                <li>Gestione multi-utente con ruoli differenziati</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">3. Registrazione e Account</h2>
              <p className="text-sm leading-relaxed mb-2">L'utente si impegna a:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Fornire informazioni accurate durante la registrazione</li>
                <li>Mantenere riservate le proprie credenziali di accesso</li>
                <li>Notificare immediatamente eventuali accessi non autorizzati</li>
                <li>Non condividere l'account con terzi non autorizzati</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">4. Uso Consentito</h2>
              <p className="text-sm leading-relaxed mb-2">&Egrave; vietato:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Utilizzare il servizio per scopi illegali</li>
                <li>Tentare di accedere a dati di altri utenti</li>
                <li>Interferire con il funzionamento del sistema</li>
                <li>Reverse engineering del software</li>
                <li>Rivendere o sublicenziare il servizio</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">5. Ruoli Utente</h2>
              <p className="text-sm leading-relaxed mb-2">Il sistema prevede tre ruoli:</p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li><strong>Proprietario:</strong> Pu&ograve; controllare dispositivi e scene dell'impianto assegnato</li>
                <li><strong>Installatore:</strong> Pu&ograve; creare e configurare impianti per i propri clienti</li>
                <li><strong>Admin:</strong> Accesso completo a tutte le funzionalit&agrave; del sistema</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">6. Disponibilit&agrave; del Servizio</h2>
              <p className="text-sm leading-relaxed">
                Ci impegniamo a mantenere il servizio operativo, ma non garantiamo
                un uptime del 100%. Potrebbero verificarsi interruzioni per manutenzione
                o cause di forza maggiore.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">7. Limitazione di Responsabilit&agrave;</h2>
              <p className="text-sm leading-relaxed">
                Il fornitore non &egrave; responsabile per danni diretti o indiretti derivanti da:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4 mt-2">
                <li>Malfunzionamento dei dispositivi controllati</li>
                <li>Interruzioni del servizio</li>
                <li>Problemi di connettivit&agrave; dell'utente</li>
                <li>Uso improprio del sistema</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">8. Propriet&agrave; Intellettuale</h2>
              <p className="text-sm leading-relaxed">
                Il software, il design e tutti i contenuti del sistema sono di propriet&agrave;
                esclusiva di [NOME AZIENDA]. All'utente viene concessa una licenza d'uso
                limitata e non esclusiva.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">9. Modifiche ai Termini</h2>
              <p className="text-sm leading-relaxed">
                Ci riserviamo il diritto di modificare questi termini. Le modifiche
                saranno comunicate agli utenti e l'uso continuato del servizio
                costituisce accettazione dei nuovi termini.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">10. Legge Applicabile</h2>
              <p className="text-sm leading-relaxed">
                I presenti termini sono regolati dalla legge italiana.
                Per qualsiasi controversia sar&agrave; competente il Foro di [CITT&Agrave;].
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-copy mb-3">11. Contatti</h2>
              <p className="text-sm leading-relaxed">
                Per domande sui Termini di Servizio, contattaci a:
              </p>
              <p className="text-sm mt-2">
                <strong>Email:</strong> [EMAIL SUPPORTO]<br />
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
