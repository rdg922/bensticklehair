-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Anonymous',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bens table
CREATE TABLE IF NOT EXISTS bens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_data TEXT NOT NULL,
  birthday_message TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ben_likes table
CREATE TABLE IF NOT EXISTS ben_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ben_id UUID REFERENCES bens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ben_id, user_id)
);

-- Create ben_comments table
CREATE TABLE IF NOT EXISTS ben_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ben_id UUID REFERENCES bens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ben_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ben_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view bens" ON bens FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create bens" ON bens FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own bens" ON bens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bens" ON bens FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view likes" ON ben_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like bens" ON ben_likes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own likes" ON ben_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments" ON ben_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON ben_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can delete own comments" ON ben_comments FOR DELETE USING (auth.uid() = user_id);
