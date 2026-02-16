-- Add views_count column to articles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'articles' 
        AND column_name = 'views_count'
    ) THEN
        ALTER TABLE public.articles 
        ADD COLUMN views_count INTEGER NOT NULL DEFAULT 0;
        
        -- Create index for better performance when sorting by views
        CREATE INDEX IF NOT EXISTS idx_articles_views_count 
        ON public.articles(views_count DESC);
    END IF;
END $$;
