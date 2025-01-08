import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
export type DbError = {
  code: string;
  details: string;
  hint: string;
  message: string;
};

export async function handleError<T>(promise: Promise<{ data: T | null; error: DbError | null }>) {
  const { data, error } = await promise;
  if (error) {
    console.error('Database error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(error.message);
  }
  return data;
}
