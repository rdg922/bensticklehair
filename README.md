# benjaminstick.hair

A fun, 90s-themed web application for drawing and sharing "Ben" artwork with a retro aesthetic! 

## Features

- 🎨 **Canvas Drawing Editor**: Draw directly in your browser with a pixel art style
- 🔐 **Google OAuth Authentication**: Secure sign-in with Google
- 👤 **User Profiles**: Manage your account and view your creations
- ❤️ **Social Features**: Like and comment on artwork
- 📱 **Responsive Design**: Works on desktop and mobile
- ⚡ **Server Actions**: Modern Next.js 15 with server-side form handling
- 🌈 **90s Aesthetic**: Retro styling with rainbow text and classic web vibes

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS with custom 90s-themed components
- **State Management**: React Server Components + Server Actions
- **Deployment**: Vercel-ready

## Setup Instructions

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd benjaminstick-hair
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
# or
npm install
# or
yarn install
\`\`\`

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings** → **API** and copy your project URL and anon key
3. Go to **Authentication** → **Providers** → **Google** and enable it:
   - Add your Google OAuth client ID and secret
   - Set the redirect URL to: \`{your-domain}/auth/callback\`
   - For local development: \`http://localhost:3000/auth/callback\`

### 4. Database Setup

Run the following SQL in your Supabase SQL Editor:

\`\`\`sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bens table
CREATE TABLE bens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_data TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ben_likes table
CREATE TABLE ben_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ben_id UUID REFERENCES bens(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ben_id, user_id)
);

-- Create ben_comments table
CREATE TABLE ben_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- RLS Policies
-- Users can read all profiles, but only update their own
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Bens are publicly readable, but users can only create their own
CREATE POLICY "Bens are publicly readable" ON bens FOR SELECT USING (true);
CREATE POLICY "Users can create own bens" ON bens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bens" ON bens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bens" ON bens FOR DELETE USING (auth.uid() = user_id);

-- Likes are publicly readable, users can like any ben but only manage their own likes
CREATE POLICY "Likes are publicly readable" ON ben_likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON ben_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON ben_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments are publicly readable, users can comment on any ben but only manage their own comments
CREATE POLICY "Comments are publicly readable" ON ben_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON ben_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON ben_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON ben_comments FOR DELETE USING (auth.uid() = user_id);
\`\`\`

### 5. Environment Variables

Copy \`.env.example\` to \`.env.local\`:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit \`.env.local\` with your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### 6. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add authorized redirect URIs:
   - \`http://localhost:3000/auth/callback\` (for development)
   - \`https://yourdomain.com/auth/callback\` (for production)
7. Copy the Client ID and Client Secret to your Supabase Google OAuth settings

### 7. Run the Development Server

\`\`\`bash
pnpm dev
# or
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Update \`NEXT_PUBLIC_SITE_URL\` to your production domain
5. Update Google OAuth redirect URIs to include your production domain

### Environment Variables for Production

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
\`\`\`

## Key Improvements Made

### 🚀 **Server Actions Integration**
- Replaced client-side form submissions with Next.js Server Actions
- Better performance and SEO with server-side processing
- Improved error handling and validation

### 🔐 **Fixed OAuth Authentication**
- Corrected Google OAuth redirect URL generation
- Proper environment variable handling for different environments
- Better error handling for authentication failures

### ⚡ **Modern React Patterns**
- Using \`useActionState\` for form state management
- \`useOptimistic\` for instant UI updates
- Server Components where possible for better performance

### 🎨 **Enhanced User Experience**
- Optimistic updates for likes and comments
- Proper loading states and error messages
- Form validation and user feedback

### 🔧 **Better Development Experience**
- Comprehensive environment setup instructions
- Database schema and RLS policies included
- Clear deployment guidelines

## Troubleshooting

### Common Issues

1. **OAuth Redirect Error**: Make sure your redirect URLs match exactly between Google Console and Supabase
2. **Database Errors**: Ensure RLS policies are set up correctly
3. **Environment Variables**: Double-check all environment variables are set correctly
4. **Build Errors**: Make sure you're using Node.js 18+ and the latest dependencies

### Getting Help

If you encounter issues:
1. Check the browser console for client-side errors
2. Check server logs for server-side errors
3. Verify your Supabase setup and RLS policies
4. Ensure all environment variables are correctly set

## License

This project is open source and available under the [MIT License](LICENSE).
