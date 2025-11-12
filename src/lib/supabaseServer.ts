import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';

interface CreateServerSupabaseOptions {
  shouldSetCookies?: boolean;
}

export const createServerSupabase = async (
  { shouldSetCookies = false }: CreateServerSupabaseOptions = {}
) => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          cookieStore
            .getAll()
            .map(({ name, value }) => ({ name, value })),
        setAll: (cookiesToSet) => {
          if (!shouldSetCookies) {
            return;
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options as CookieOptions | undefined);
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('[Supabase] Failed to set cookie', { name, error });
              }
            }
          });
        },
      },
    }
  );
};


