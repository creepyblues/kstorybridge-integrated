-- Express Interest: buyers signal licensing interest in a title.
-- Additive migration (no destructive operations).

CREATE TABLE IF NOT EXISTS public.title_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  buyer_email text NOT NULL,
  buyer_name text,
  buyer_company text,
  note text,
  status text NOT NULL DEFAULT 'new', -- new | contacted | in_discussion | closed
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (title_id, buyer_email)
);

CREATE INDEX IF NOT EXISTS idx_title_interests_title_id ON public.title_interests(title_id);
CREATE INDEX IF NOT EXISTS idx_title_interests_buyer_email ON public.title_interests(buyer_email);

ALTER TABLE public.title_interests ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own interest rows (writes go through the
-- express-interest edge function with the service role).
CREATE POLICY "Buyers can view own interests"
  ON public.title_interests
  FOR SELECT
  TO authenticated
  USING (buyer_email = lower(auth.jwt() ->> 'email'));
