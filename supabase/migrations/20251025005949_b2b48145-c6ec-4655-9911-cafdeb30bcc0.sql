-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'parent');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create swim levels table
CREATE TABLE public.swim_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sequence INTEGER NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swim_levels ENABLE ROW LEVEL SECURITY;

-- Create skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID REFERENCES public.swim_levels(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Create swimmers table
CREATE TABLE public.swimmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  current_level_id UUID REFERENCES public.swim_levels(id),
  photo_url TEXT,
  strengths_interests TEXT,
  goals TEXT,
  waitlist BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.swimmers ENABLE ROW LEVEL SECURITY;

-- Create swimmer_skills table for progress tracking
CREATE TABLE public.swimmer_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE NOT NULL,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'introduced', 'in_progress', 'mastered')),
  date_mastered DATE,
  instructor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(swimmer_id, skill_id)
);

ALTER TABLE public.swimmer_skills ENABLE ROW LEVEL SECURITY;

-- Create sessions table
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL CHECK (session_type IN ('initial_assessment', 'weekly_session')),
  instructor_id UUID REFERENCES auth.users(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'canceled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'canceled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, swimmer_id)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create floating_sessions table
CREATE TABLE public.floating_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  available_until TIMESTAMPTZ NOT NULL,
  claimed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.floating_sessions ENABLE ROW LEVEL SECURITY;

-- Create progress videos table
CREATE TABLE public.progress_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swimmer_id UUID REFERENCES public.swimmers(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  video_url TEXT NOT NULL,
  skill_focus TEXT,
  instructor_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Instructors can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for swim_levels (public read)
CREATE POLICY "Anyone can view swim levels"
  ON public.swim_levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage swim levels"
  ON public.swim_levels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for skills (public read)
CREATE POLICY "Anyone can view skills"
  ON public.skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage skills"
  ON public.skills FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for swimmers
CREATE POLICY "Parents can view their own swimmers"
  ON public.swimmers FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create swimmers"
  ON public.swimmers FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own swimmers"
  ON public.swimmers FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Instructors can view all swimmers"
  ON public.swimmers FOR SELECT
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can update swimmers"
  ON public.swimmers FOR UPDATE
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for swimmer_skills
CREATE POLICY "Parents can view their swimmers' skills"
  ON public.swimmer_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.swimmers
      WHERE swimmers.id = swimmer_skills.swimmer_id
      AND swimmers.parent_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view all swimmer skills"
  ON public.swimmer_skills FOR SELECT
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can manage swimmer skills"
  ON public.swimmer_skills FOR ALL
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for sessions
CREATE POLICY "Anyone can view available sessions"
  ON public.sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Instructors can manage sessions"
  ON public.sessions FOR ALL
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bookings
CREATE POLICY "Parents can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Instructors can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for floating_sessions
CREATE POLICY "Anyone can view floating sessions"
  ON public.floating_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Parents can claim floating sessions"
  ON public.floating_sessions FOR UPDATE
  TO authenticated
  USING (claimed_by IS NULL OR claimed_by = auth.uid());

CREATE POLICY "Instructors can manage floating sessions"
  ON public.floating_sessions FOR ALL
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for progress_videos
CREATE POLICY "Parents can view their swimmers' videos"
  ON public.progress_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.swimmers
      WHERE swimmers.id = progress_videos.swimmer_id
      AND swimmers.parent_id = auth.uid()
    )
  );

CREATE POLICY "Parents can upload videos"
  ON public.progress_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.swimmers
      WHERE swimmers.id = progress_videos.swimmer_id
      AND swimmers.parent_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can view all videos"
  ON public.progress_videos FOR SELECT
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Instructors can update videos"
  ON public.progress_videos FOR UPDATE
  USING (public.has_role(auth.uid(), 'instructor') OR public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swimmers_updated_at
  BEFORE UPDATE ON public.swimmers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_swimmer_skills_updated_at
  BEFORE UPDATE ON public.swimmer_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- Default role is parent
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert swim levels
INSERT INTO public.swim_levels (name, display_name, sequence, description) VALUES
  ('tadpole', 'Tadpole', 1, 'Water Introduction'),
  ('minnow', 'Minnow', 2, 'Basic Skills'),
  ('starfish', 'Starfish', 3, 'Floating & Balance'),
  ('dolphin', 'Dolphin', 4, 'Swim Strokes'),
  ('shark', 'Shark', 5, 'Advanced Skills');