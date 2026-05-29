import React, { useState } from 'react'
import '../styles/globals.css'

function MyApp({ Component, pageProps }: any) {
  const [user, setUser] = useState<any>(null)

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return <Component {...pageProps} user={user} setUser={setUser} />
}

export default MyApp
