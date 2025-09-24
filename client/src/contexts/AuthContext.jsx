import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  // Helper function to fetch user profile
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null)
      return
    }
    
    try {
      // Add timeout to profile fetch to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .abortSignal(controller.signal)
        .single()
      
      clearTimeout(timeoutId)
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile:', error)
      }
      
      setUserProfile(data || null)
    } catch (err) {
      if (err.name === 'AbortError') {
        console.warn('User profile fetch timed out')
      } else {
        console.error('Error fetching user profile:', err)
      }
      setUserProfile(null)
    }
  }

  useEffect(() => {
    let timeoutId
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // Increased timeout and better error handling
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth loading timeout reached - forcing loading to false')
            setLoading(false)
          }
        }, 30000) // Increased to 30 seconds

        // Get initial session with better error handling
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          setSession(session)
          setUser(session?.user ?? null)
          
          // Only fetch profile if user exists and component is still mounted
          if (session?.user?.id) {
            try {
              await fetchUserProfile(session.user.id)
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError)
              // Don't fail auth if profile fetch fails
            }
          }
        }
      } catch (error) {
        console.error('Error during initial session setup:', error)
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setSession(session)
        setUser(session?.user ?? null)
        await fetchUserProfile(session?.user?.id)
      } catch (error) {
        console.error('Error during auth state change:', error)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [])

  const signUp = async (email, password, name = '') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    // If signup successful and we have a user, create their profile
    if (data.user && !error && name.trim()) {
      await createUserProfile(data.user.id, name.trim())
    }
    
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const createUserProfile = async (userId, name) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          user_id: userId,
          name: name
        }])
        .select()
        .single()
      
      if (!error) {
        setUserProfile(data)
      }
      
      return { data, error }
    } catch (err) {
      console.error('Error creating user profile:', err)
      return { data: null, error: err }
    }
  }

  const updateUserProfile = async (name) => {
    if (!user?.id) return { data: null, error: new Error('No user logged in') }
    
    try {
      console.log('Updating user profile for user:', user.id, 'with name:', name)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          name: name
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()
      
      console.log('Update result:', { data, error })
      
      if (!error && data) {
        setUserProfile(data)
      }
      
      return { data, error }
    } catch (err) {
      console.error('Error updating user profile:', err)
      return { data: null, error: err }
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createUserProfile,
    updateUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
