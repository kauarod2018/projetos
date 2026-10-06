export function whatsappLink(phone: string, message = "") {
  const raw = phone.trim();
  let digits = raw.replace(/\D/g, "");
  // Local Brazilian numbers include DDD; explicit international numbers keep their code.
  if (!raw.startsWith("+") && /^[1-9]\d{9,10}$/.test(digits)) {
    digits = "55" + digits;
  }
  if (!/^[1-9]\d{9,14}$/.test(digits)) digits = "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
