import type { BusinessProfile } from "@/lib/business-profile";

export type PixPayment = {
  key: string;
  name: string;
  city: string;
  amountCents: number;
  payload: string;
};

export function pixText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase().replace(/[^A-Z0-9 .,'-]/g, " ").replace(/\s+/g, " ").trim();
}

function field(id: string, value: string) {
  const length = new TextEncoder().encode(value).length;
  if (length > 99) throw new Error("Campo Pix excede o limite do BR Code.");
  return `${id}${String(length).padStart(2, "0")}${value}`;
}

function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createStaticPixPayment(profile: BusinessProfile, amountCents: number): PixPayment | null {
  const key = profile.pixKey.trim().toLowerCase();
  const name = pixText(profile.pixName);
  const city = pixText(profile.pixCity);
  if (!key || !name || !city || name.length > 25 || city.length > 15 || !Number.isSafeInteger(amountCents) || amountCents <= 0) return null;

  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", key);
  const additionalData = field("05", "***");
  const body = field("00", "01")
    + field("26", merchantAccount)
    + field("52", "0000")
    + field("53", "986")
    + field("54", (amountCents / 100).toFixed(2))
    + field("58", "BR")
    + field("59", name)
    + field("60", city)
    + field("62", additionalData)
    + "6304";

  return { key, name, city, amountCents, payload: body + crc16Ccitt(body) };
}
