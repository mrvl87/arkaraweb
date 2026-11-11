import 'server-only'

interface AuthenticatedUser {
  id: string
}

interface AuthenticatedSupabaseClient {
  auth: {
    getUser: () => Promise<{
      data: { user: AuthenticatedUser | null }
      error: { message?: string } | null
    }>
  }
}

/**
 * Server-only authentication boundary for Server Actions and route handlers.
 * Call this before constructing service-role/R2 clients or invoking paid APIs.
 */
export async function requireAuthenticatedUser<TUser extends AuthenticatedUser = AuthenticatedUser>(
  supabase: AuthenticatedSupabaseClient
): Promise<TUser> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return user as TUser
}

export async function authenticateUserForRoute(
  supabase: AuthenticatedSupabaseClient
): Promise<{ user: AuthenticatedUser; response?: never } | { user?: never; response: Response }> {
  try {
    return { user: await requireAuthenticatedUser(supabase) }
  } catch {
    return {
      response: Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }
}
