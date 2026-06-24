// ============================================================
//  WhatsApp = the conversion engine.
//  Every "order" / "enquiry" CTA on the site routes through these helpers,
//  so the business number lives in exactly ONE place.
//
//  Number: 071 622 3423  →  international (digits only, no +): 94716223423
// ============================================================

export const WHATSAPP_NUMBER = '94716223423';
export const WHATSAPP_DISPLAY = '071 622 3423';

/** Low-level builder: wraps any message into a wa.me deep link. */
export function waLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Per-book order link with a pre-filled Sinhala message, e.g. for Rudraksha:
 *   "ආයුබෝවන්! මට 'රුද්‍රාක්ෂ' පොත ඇණවුම් කරන්න කැමතියි."
 * Uses the Sinhala title when available, otherwise the romanized title.
 */
export function bookOrderLink(book) {
  const title = book?.titleSi || book?.title || '';
  const message = `ආයුබෝවන්! මට '${title}' පොත ඇණවුම් කරන්න කැමතියි.`;
  return waLink(message);
}

/** Generic enquiry link (no specific book). */
export function genericContactLink() {
  return waLink('ආයුබෝවන්! නේජා ප්‍රකාශන ගැන විමසීමක්.');
}
