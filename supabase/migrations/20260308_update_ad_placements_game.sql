-- Update the advertisements constraint to include the new game portal placements
ALTER TABLE public.advertisements DROP CONSTRAINT IF EXISTS advertisements_placement_check;
ALTER TABLE public.advertisements ADD CONSTRAINT advertisements_placement_check CHECK (placement IN ('header_bottom', 'article_before', 'article_middle', 'article_after', 'sidebar', 'section_sidebar', 'feed_between', 'skin_left', 'skin_right', 'game_bottom', 'game_sidebar_left', 'game_sidebar_right'));
