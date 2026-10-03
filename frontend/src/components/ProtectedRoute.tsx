"use client"

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children, requiredRoles = ['admin', 'superadmin'] }: {
  children: React.ReactNode
  requiredRoles?: string[]
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  // Ref, not state: it only guards against a double redirect and never affects rendering
  const hasRedirected = useRef(false)

  const hasRequiredRole = user?.role && requiredRoles.includes(user.role)

  useEffect(() => {
    // If still loading, don't do anything yet
    if (isLoading) return

    // If not authenticated or doesn't have required role, redirect to login
    if (!isAuthenticated || !hasRequiredRole) {
      if (!hasRedirected.current) {
        hasRedirected.current = true
        router.push('/auth/admin/login')
      }
      return
    }
  }, [isAuthenticated, isLoading, hasRequiredRole, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // If not authenticated or no required role, show nothing (redirect is happening)
  if (!isAuthenticated || !hasRequiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Only render children if authenticated and has required role
  return <>{children}</>
}