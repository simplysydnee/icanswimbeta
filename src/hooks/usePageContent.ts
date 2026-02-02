import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function usePageContent(pageSlug: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['page-content', pageSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_slug', pageSlug)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      // Convert array to object keyed by section_key for easy lookup
      return data.reduce((acc, item) => {
        acc[item.section_key] = item.content;
        return acc;
      }, {} as Record<string, string>);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled,
    retry: false, // Don't retry on error (e.g., 404)
  });
}

// Helper to get content with fallback
export function getContent(
  content: Record<string, string> | undefined,
  key: string,
  fallback: string
): string {
  return content?.[key] || fallback;
}