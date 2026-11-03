ALTER TABLE public.store_products
  ADD COLUMN audience text,
  ADD COLUMN audience_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN audience_verified_at timestamptz,
  ADD COLUMN season_tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN season_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN season_verified_at timestamptz,
  ADD COLUMN size_options text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN color_options text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN sku text,
  ADD COLUMN stock_quantity integer,
  ADD COLUMN stock_checked_at timestamptz,
  ADD COLUMN material text,
  ADD COLUMN fit text,
  ADD COLUMN pattern text,
  ADD COLUMN search_keywords text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN attributes_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN attributes_verified_at timestamptz,
  ADD COLUMN price_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN price_verified_at timestamptz;

ALTER TABLE public.store_products
  ADD CONSTRAINT store_products_audience_check
    CHECK (audience IS NULL OR audience = ANY (ARRAY['men','women','teens','kids','unisex']::text[])),
  ADD CONSTRAINT store_products_audience_verification_check
    CHECK (
      (audience_verified = false AND audience_verified_at IS NULL)
      OR (audience_verified = true AND audience IS NOT NULL AND audience_verified_at IS NOT NULL)
    ),
  ADD CONSTRAINT store_products_season_tags_check
    CHECK (
      season_tags <@ ARRAY['spring','summer','autumn','winter','all_season']::text[]
      AND (NOT ('all_season' = ANY(season_tags)) OR cardinality(season_tags) = 1)
    ),
  ADD CONSTRAINT store_products_season_verification_check
    CHECK (
      (season_verified = false AND season_verified_at IS NULL)
      OR (season_verified = true AND cardinality(season_tags) > 0 AND season_verified_at IS NOT NULL)
    ),
  ADD CONSTRAINT store_products_size_options_check
    CHECK (cardinality(size_options) <= 40 AND array_position(size_options, '') IS NULL),
  ADD CONSTRAINT store_products_color_options_check
    CHECK (cardinality(color_options) <= 40 AND array_position(color_options, '') IS NULL),
  ADD CONSTRAINT store_products_search_keywords_check
    CHECK (cardinality(search_keywords) <= 40 AND array_position(search_keywords, '') IS NULL),
  ADD CONSTRAINT store_products_stock_quantity_check
    CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  ADD CONSTRAINT store_products_sku_check
    CHECK (sku IS NULL OR (sku = btrim(sku) AND length(sku) BETWEEN 1 AND 80)),
  ADD CONSTRAINT store_products_attributes_verification_check
    CHECK (
      (attributes_verified = false AND attributes_verified_at IS NULL)
      OR (attributes_verified = true AND attributes_verified_at IS NOT NULL)
    ),
  ADD CONSTRAINT store_products_price_verification_check
    CHECK (
      (price_verified = false AND price_verified_at IS NULL)
      OR (price_verified = true AND price_bdt > 0 AND price_verified_at IS NOT NULL)
    );

CREATE UNIQUE INDEX store_products_sku_unique_idx
  ON public.store_products (sku)
  WHERE sku IS NOT NULL;

CREATE INDEX store_products_verified_audience_idx
  ON public.store_products (audience)
  WHERE is_active = true AND audience_verified = true;

CREATE INDEX store_products_verified_season_tags_idx
  ON public.store_products USING gin (season_tags)
  WHERE is_active = true AND season_verified = true;

-- Only source groups whose provenance explicitly identifies the Men's catalogue
-- are pre-classified. Editorial featured products are classified only where their
-- department category explicitly says Men or Women. No season, stock, size or colour
-- data is inferred from names or category labels.
UPDATE public.store_products
SET audience = 'men',
    audience_verified = true,
    audience_verified_at = now(),
    updated_at = now()
WHERE is_active = true
  AND source IN ('men_directory', 'homepage_men');

UPDATE public.store_products
SET audience = lower(category),
    audience_verified = true,
    audience_verified_at = now(),
    updated_at = now()
WHERE is_active = true
  AND source = 'homepage_featured'
  AND category IN ('Men', 'Women');
