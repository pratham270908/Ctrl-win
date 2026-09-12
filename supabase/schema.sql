-- ==============================================================================
-- SPECFINDER DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) FOR SUPABASE
-- ==============================================================================

-- 1. Create Profiles Table (Linked to auth.users via unique UUID)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    travel_mode TEXT DEFAULT 'DRIVE' CHECK (travel_mode IN ('DRIVE', 'WALK', 'BICYCLE', 'TRANSIT')),
    distance_units TEXT DEFAULT 'km' CHECK (distance_units IN ('km', 'miles')),
    voice_guidance BOOLEAN DEFAULT TRUE,
    notifications BOOLEAN DEFAULT TRUE,
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    route_preference TEXT DEFAULT 'FASTEST' CHECK (route_preference IN ('FASTEST', 'SHORTEST', 'USEFUL_STOPS')),
    saved_places_count INTEGER DEFAULT 0,
    reports_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies: Authenticated users can ONLY access & mutate their own record
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 4. Trigger Function: Automatically create profile upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        display_name,
        email,
        avatar_url,
        travel_mode,
        distance_units,
        voice_guidance,
        notifications,
        wheelchair_accessible,
        route_preference
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
        'DRIVE',
        'km',
        TRUE,
        TRUE,
        FALSE,
        'FASTEST'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
