import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const cache: Record<string, string> = {};

export function useBusinessUnit(unit: 'tek' | 'strategies'): string {
  const name = unit === 'tek' ? 'Solvix Tek' : 'Solvix Strategies';
  const [id, setId] = useState<string>(cache[name] ?? '');

  useEffect(() => {
    if (cache[name]) { setId(cache[name]); return; }
    supabase.from('business_units').select('id').eq('name', name).single().then(({ data }) => {
      if (data?.id) { cache[name] = data.id; setId(data.id); }
    });
  }, [name]);

  return id;
}