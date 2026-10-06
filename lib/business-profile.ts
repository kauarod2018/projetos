export type BusinessProfile = {
  pixKey: string;
  pixName: string;
  pixCity: string;
};

export const emptyBusinessProfile: BusinessProfile = {
  pixKey: "",
  pixName: "",
  pixCity: "",
};

export function parseBusinessProfile(value: string | null | undefined): BusinessProfile {
  if (!value) return emptyBusinessProfile;
  try {
    const parsed = JSON.parse(value) as Partial<BusinessProfile>;
    return {
      pixKey: typeof parsed.pixKey === "string" ? parsed.pixKey : "",
      pixName: typeof parsed.pixName === "string" ? parsed.pixName : "",
      pixCity: typeof parsed.pixCity === "string" ? parsed.pixCity : "",
    };
  } catch {
    return emptyBusinessProfile;
  }
}
