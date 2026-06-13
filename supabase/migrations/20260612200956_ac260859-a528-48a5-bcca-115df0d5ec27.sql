
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'executive', 'member');
CREATE TYPE public.employment_status AS ENUM ('employed', 'self_employed', 'unemployed', 'student', 'other');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.suggestion_status AS ENUM ('new', 'reviewing', 'responded', 'closed');
CREATE TYPE public.poll_status AS ENUM ('draft', 'active', 'closed');
CREATE TYPE public.event_category AS ENUM ('job', 'training', 'bursary', 'showcase', 'meeting', 'other');
CREATE TYPE public.fund_source AS ENUM ('uwezo_fund', 'youth_enterprise_fund', 'bursary', 'ngaaf', 'other');
CREATE TYPE public.fund_status AS ENUM ('received', 'allocated', 'disbursed');
CREATE TYPE public.report_category AS ENUM ('financial', 'minutes', 'decision', 'other');
CREATE TYPE public.talent_type AS ENUM ('individual', 'group');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  ward TEXT,
  employment_status public.employment_status DEFAULT 'unemployed',
  skills TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_url TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- security-definer role checker
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','executive'))
$$;

-- ============ SIGNUP TRIGGER ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROFILES policies
CREATE POLICY "Anyone can view verified profiles" ON public.profiles
  FOR SELECT USING (verification_status = 'verified' OR auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Staff update any profile" ON public.profiles
  FOR UPDATE USING (public.is_staff(auth.uid()));
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- USER_ROLES policies
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- ============ SUGGESTIONS ============
CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  status public.suggestion_status NOT NULL DEFAULT 'new',
  response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.suggestions TO authenticated;
GRANT ALL ON public.suggestions TO service_role;
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_suggestions_updated BEFORE UPDATE ON public.suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members view suggestions" ON public.suggestions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members create suggestions" ON public.suggestions
  FOR INSERT TO authenticated WITH CHECK (
    (is_anonymous = true AND user_id IS NULL) OR (auth.uid() = user_id)
  );
CREATE POLICY "Authors edit own suggestions" ON public.suggestions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff manage suggestions" ON public.suggestions
  FOR UPDATE USING (public.is_staff(auth.uid()));

-- ============ POLLS ============
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status public.poll_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.polls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT ALL ON public.polls TO service_role;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_polls_updated BEFORE UPDATE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone view active or closed polls" ON public.polls
  FOR SELECT USING (status IN ('active','closed') OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage polls" ON public.polls
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.poll_options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_options TO authenticated;
GRANT ALL ON public.poll_options TO service_role;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view poll options" ON public.poll_options
  FOR SELECT USING (true);
CREATE POLICY "Staff manage poll options" ON public.poll_options
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);
GRANT SELECT, INSERT ON public.poll_votes TO authenticated;
GRANT SELECT ON public.poll_votes TO anon;
GRANT ALL ON public.poll_votes TO service_role;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vote tallies" ON public.poll_votes
  FOR SELECT USING (true);
CREATE POLICY "Verified members cast vote" ON public.poll_votes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND verification_status = 'verified')
  );

-- ============ EVENTS ============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category public.event_category NOT NULL DEFAULT 'other',
  location TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  link_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone view events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Staff manage events" ON public.events
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ TALENTS ============
CREATE TABLE public.talents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  talent_type public.talent_type NOT NULL DEFAULT 'individual',
  category TEXT,
  ward TEXT,
  description TEXT,
  contact TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.talents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talents TO authenticated;
GRANT ALL ON public.talents TO service_role;
ALTER TABLE public.talents ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_talents_updated BEFORE UPDATE ON public.talents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone view talents" ON public.talents FOR SELECT USING (true);
CREATE POLICY "Members create talents" ON public.talents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own talents" ON public.talents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners delete own talents" ON public.talents
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Staff manage talents" ON public.talents
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ FUNDING ============
CREATE TABLE public.funding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source public.fund_source NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  status public.fund_status NOT NULL DEFAULT 'received',
  beneficiary TEXT,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.funding TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funding TO authenticated;
GRANT ALL ON public.funding TO service_role;
ALTER TABLE public.funding ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_funding_updated BEFORE UPDATE ON public.funding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone view funding" ON public.funding FOR SELECT USING (true);
CREATE POLICY "Staff manage funding" ON public.funding
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.report_category NOT NULL DEFAULT 'other',
  summary TEXT,
  file_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Anyone view published reports" ON public.reports
  FOR SELECT USING (is_published = true OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage reports" ON public.reports
  FOR ALL USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
