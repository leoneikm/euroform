import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { User, Shield, Trash2 } from 'lucide-react'

const Settings = () => {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE'
    const userInput = prompt(
      `Are you sure you want to delete your account? This action cannot be undone.\n\nType "${confirmText}" to confirm:`
    )

    if (userInput !== confirmText) {
      return
    }

    setLoading(true)
    try {
      // In a real app, you would call an API to delete the account
      alert('Account deletion would be implemented here')
    } catch (error) {
      setMessage('Error deleting account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Settings">
      <div className="max-w-2xl">
        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-700">{message}</p>
          </div>
        )}

        {/* Account Info */}
        <div className="card mb-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={user?.id || ''}
                disabled
                className="input-field bg-gray-50 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered since
              </label>
              <input
                type="text"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : ''}
                disabled
                className="input-field bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Privacy & GDPR */}
        <div className="card mb-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Privacy & GDPR</h2>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <p>
              Your data is processed and stored exclusively in the EU (Supabase EU).
            </p>
            <p>
              We only collect the necessary data to operate the service.
            </p>
            <p>
              Uploaded files are automatically deleted after 24 hours.
            </p>
            <p>
              You can delete your account and all associated data at any time.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-200">
          <div className="flex items-center mb-4">
            <Trash2 className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Deleting your account is irreversible. All your forms, 
              submissions and data will be permanently deleted.
            </p>
            
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Settings
