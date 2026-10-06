export function verificationRequired() {
  return process.env.EMAIL_VERIFICATION_REQUIRED === "true";
}
