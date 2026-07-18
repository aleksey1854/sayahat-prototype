import { waLink } from "@/lib/site";

export function CallBar({ phone, whatsapp }: { phone?: string | null; whatsapp?: string | null }) {
  if (!phone && !whatsapp) return null;
  const tel = phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : undefined;
  return (
    <>
      <div className="callbar__spacer" aria-hidden="true" />
      <div className="callbar">
      {tel && (
        <a className="btn btn--primary" href={tel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
          </svg>
          Позвонить
        </a>
      )}
      {whatsapp && (
        <a className="btn btn--accent" href={waLink(whatsapp)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 18, height: 18 }}>
            <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5z" />
          </svg>
          WhatsApp
        </a>
      )}
      </div>
    </>
  );
}
