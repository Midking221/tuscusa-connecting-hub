
-- 1. PROFILES: restrict full row SELECT, expose safe public view
DROP POLICY IF EXISTS "Anyone can view verified profiles" ON public.profiles;
CREATE POLICY "Owners and staff view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_staff(auth.uid()));

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name, ward, employment_status, skills, bio, avatar_url,
       verification_status, created_at
FROM public.profiles
WHERE verification_status = 'verified';

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. PROFILES: prevent self-escalation of verification status via trigger
CREATE OR REPLACE FUNCTION public.protect_profile_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    NEW.verification_status := OLD.verification_status;
    NEW.verified_at := OLD.verified_at;
    NEW.verified_by := OLD.verified_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_verification ON public.profiles;
CREATE TRIGGER profiles_protect_verification
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_verification();

-- 3. SUGGESTIONS: limit visibility
DROP POLICY IF EXISTS "Members view suggestions" ON public.suggestions;
CREATE POLICY "View own anonymous or staff suggestions"
  ON public.suggestions FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR is_anonymous = true
    OR public.is_staff(auth.uid())
  );

-- 4. POLL VOTES: hide who voted for what; expose aggregates via view
DROP POLICY IF EXISTS "Anyone can view vote tallies" ON public.poll_votes;
CREATE POLICY "Users view own votes"
  ON public.poll_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE OR REPLACE VIEW public.poll_vote_tallies AS
SELECT poll_id, option_id, COUNT(*)::int AS vote_count
FROM public.poll_votes
GROUP BY poll_id, option_id;

GRANT SELECT ON public.poll_vote_tallies TO anon, authenticated;

-- 5. TALENTS: hide contact column from anonymous via view; require auth for full row
DROP POLICY IF EXISTS "Anyone view talents" ON public.talents;
CREATE POLICY "Authenticated view talents"
  ON public.talents FOR SELECT
  TO authenticated
  USING (true);

CREATE OR REPLACE VIEW public.public_talents AS
SELECT id, name, category, talent_type, image_url, description, ward,
       user_id, created_at, updated_at
FROM public.talents;

GRANT SELECT ON public.public_talents TO anon, authenticated;
