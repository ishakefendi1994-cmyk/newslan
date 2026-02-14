-- Update advertisements table to support new placements
ALTER TABLE public.advertisements DROP CONSTRAINT IF EXISTS advertisements_placement_check;
ALTER TABLE public.advertisements ADD CONSTRAINT advertisements_placement_check CHECK (placement IN ('header_bottom', 'article_before', 'article_middle', 'article_after', 'sidebar', 'section_sidebar', 'feed_between', 'skin_left', 'skin_right'));
