import React, { useState } from 'react'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: any) {
  const [user, setUser] = useState<any>(null)
  const [authLoaded, setAuthLoaded] = useState(false)

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser && typeof parsedUser === 'object' && 'email' in parsedUser && 'role' in parsedUser) {
          setUser(parsedUser)
        } else {
          localStorage.removeItem('user')
        }
      } catch {
        localStorage.removeItem('user')
      }
    }
    setAuthLoaded(true)
  }, [])

  return <Component {...pageProps} user={user} setUser={setUser} authLoaded={authLoaded} />
}

export default MyApp
