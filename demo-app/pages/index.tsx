import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home({ user, setUser }: any) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Mock users
    const mockUsers: any = {
      'admin@company.com': {
        id: 1,
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'SUPER_ADMIN',
        password: 'Admin@123456'
      },
      'coordinator@company.com': {
        id: 2,
        email: 'coordinator@company.com',
        name: 'Coordinator',
        role: 'ADMIN',
        password: 'Admin@123456'
      },
      'pic@company.com': {
        id: 3,
        email: 'pic@company.com',
        name: 'PIC Department',
        role: 'PIC',
        password: 'Admin@123456'
      },
      'user@company.com': {
        id: 4,
        email: 'user@company.com',
        name: 'Regular User',
        role: 'USER',
        password: 'User@123456'
      }
    }

    const mockUser = mockUsers[email]
    if (mockUser && mockUser.password === password) {
      const userData = { ...mockUser }
      delete userData.password
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      router.push('/dashboard')
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Digital PDF Signoff</h1>
          <p className="text-gray-600 mt-2">Document Distribution & Tracking System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Test Accounts:</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-semibold">Super Admin:</span> admin@company.com / Admin@123456</p>
            <p><span className="font-semibold">Admin:</span> coordinator@company.com / Admin@123456</p>
            <p><span className="font-semibold">PIC:</span> pic@company.com / Admin@123456</p>
            <p><span className="font-semibold">User:</span> user@company.com / User@123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}
