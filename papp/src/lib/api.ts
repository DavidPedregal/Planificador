import i18n from "@/i18n/i18n";

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<{ data: any; ok: boolean; message: string }> {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    const key = data.message ?? '';
    return { data: data.data, ok: res.ok, message: key ? i18n.t(key, { defaultValue: key }) : '' };
  } catch {
    return { data: null, ok: false, message: i18n.t("api.error.connectionFailed") };
  }
}