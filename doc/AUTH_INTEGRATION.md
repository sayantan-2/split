# NextAuth.js Integration with PostgreSQL

This project now includes a complete authentication system using NextAuth.js integrated with your existing PostgreSQL database.

## 🚀 Features

- **Email/Password Authentication**: Users can register and sign in with email and password
- **Google OAuth** (optional): Users can sign in with their Google account
- **PostgreSQL Integration**: Uses your existing `users` table for authentication
- **JWT Sessions**: Secure session management with JSON Web Tokens
- **Password Security**: Bcrypt hashing for password storage
- **Protected Routes**: Middleware to protect pages that require authentication
- **Modern UI**: Beautiful sign-in and sign-up pages with Tailwind CSS

## 📋 Setup Instructions

### 1. Environment Variables

Make sure your `.env.local` file contains the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production

# PostgreSQL Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydatabase

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Database Setup

Your existing `users` table is already compatible:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Google OAuth Setup (Optional)

To enable Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your `.env.local`

## 🔧 Usage

### Authentication Pages

- **Sign In**: `/auth/signin`
- **Sign Up**: `/auth/signup`
- **Demo Page**: `/demo/auth` - Shows authentication status and session data

### Using NextAuth Hooks

```javascript
import { useSession, signIn, signOut } from "next-auth/react"

function Component() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Loading...</p>

  if (session) {
    return (
      <>
        <p>Signed in as {session.user.email}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }

  return (
    <>
      <p>Not signed in</p>
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}
```

### Protecting Pages

To protect pages that require authentication, uncomment the middleware in `src/middleware.js`:

```javascript
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth).*)',
  ]
}
```

### Server-Side Authentication

```javascript
import { getSession } from "next-auth/react"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]"

// In API routes
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    res.status(401).json({ message: "You must be logged in." })
    return
  }

  // Your protected API logic here
}

// In getServerSideProps
export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  return {
    props: { session },
  }
}
```

## 🛡️ Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Tokens**: Secure session management without storing sessions in database
3. **CSRF Protection**: Built-in CSRF protection from NextAuth.js
4. **Secure Cookies**: HTTPOnly and Secure cookies in production
5. **Input Validation**: Email format validation and password length requirements

## 📁 File Structure

```
src/
├── middleware.js                     # Route protection middleware
├── pages/
│   ├── _app.js                      # SessionProvider wrapper
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth].js     # NextAuth configuration
│   │       └── signup.js            # User registration API
│   ├── auth/
│   │   ├── signin.js               # Sign-in page
│   │   └── signup.js               # Sign-up page
│   └── demo/
│       └── auth.js                 # Authentication demo page
```

## 🔄 Authentication Flow

1. **Registration**:
   - User fills out sign-up form
   - Password is hashed and stored in database
   - User is automatically signed in

2. **Sign In**:
   - User enters email/password or uses Google OAuth
   - Credentials are verified against database
   - JWT token is created and stored in secure cookie

3. **Session Management**:
   - Each request includes the JWT token
   - Token is verified and user data is available via `useSession()`
   - Tokens automatically refresh before expiration

## 🚦 Testing the Integration

1. Start your development server: `bun run dev`
2. Start PostgreSQL: `docker-compose up -d`
3. Visit `/demo/auth` to test authentication features
4. Try registering a new account at `/auth/signup`
5. Test sign-in at `/auth/signin`
6. Check your PostgreSQL database to see user records

## 🔧 Customization

- **Styling**: All components use Tailwind CSS classes and can be easily customized
- **Database Schema**: The system works with your existing users table structure
- **Additional Providers**: Add more OAuth providers in the NextAuth configuration
- **Custom Pages**: Modify the sign-in/sign-up pages to match your design
- **Session Strategy**: Switch to database sessions by enabling the PostgreSQL adapter

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [PostgreSQL Adapter](https://next-auth.js.org/adapters/postgresql)
- [Providers Documentation](https://next-auth.js.org/providers/)
- [Session Management](https://next-auth.js.org/getting-started/client#usesession)
