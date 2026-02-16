'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AdminProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [email, setEmail] = useState('')
    const [newEmail, setNewEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Loading states
    const [loadingUser, setLoadingUser] = useState(true)
    const [updatingEmail, setUpdatingEmail] = useState(false)
    const [updatingPassword, setUpdatingPassword] = useState(false)

    // Status messages
    const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                setEmail(user.email || '')
            } else {
                router.push('/auth/login')
            }
            setLoadingUser(false)
        }
        getUser()
    }, [router, supabase])

    const handleUpdateEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail) return

        setUpdatingEmail(true)
        setEmailMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail })
            if (error) throw error

            setEmailMessage({
                type: 'success',
                text: 'Confirmation link sent to your new email address. Please check your inbox.'
            })
            setNewEmail('')
        } catch (error: any) {
            setEmailMessage({
                type: 'error',
                text: error.message
            })
        } finally {
            setUpdatingEmail(false)
        }
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password || !confirmPassword) return

        if (password !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' })
            return
        }

        if (password.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
            return
        }

        setUpdatingPassword(true)
        setPasswordMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({ password: password })
            if (error) throw error

            setPasswordMessage({
                type: 'success',
                text: 'Password updated successfully!'
            })
            setPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            setPasswordMessage({
                type: 'error',
                text: error.message
            })
        } finally {
            setUpdatingPassword(false)
        }
    }

    if (loadingUser) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
                <p className="text-gray-500">Manage your account settings and credentials.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Email Settings */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Email Address</h2>
                            <p className="text-xs text-gray-500">Update your email address</p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Current Email</p>
                        <p className="text-sm font-medium text-gray-900">{email}</p>
                    </div>

                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">New Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="Enter new email..."
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all outline-none"
                            />
                        </div>

                        {emailMessage && (
                            <div className={`p-4 rounded-xl flex items-start space-x-3 text-sm ${emailMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {emailMessage.type === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                )}
                                <span>{emailMessage.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={updatingEmail || !newEmail}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {updatingEmail ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>Update Email</span>
                        </button>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Password</h2>
                            <p className="text-xs text-gray-500">Change your account password</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all outline-none"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all outline-none"
                            />
                        </div>

                        {passwordMessage && (
                            <div className={`p-4 rounded-xl flex items-start space-x-3 text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {passwordMessage.type === 'success' ? (
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                )}
                                <span>{passwordMessage.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={updatingPassword || !password || !confirmPassword}
                            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {updatingPassword ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span>Update Password</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
