export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<{ data: any; ok: boolean; message: string }> {
  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return { data, ok: res.ok, message: data.message ?? '' };
  } catch {
    return { data: null, ok: false, message: 'Error de conexión con el servidor' };
  }
}