import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { User, Shield, Trash2, Edit3, Save, X } from 'lucide-react'

const Settings = () => {
  const { user, userProfile, updateUserProfile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [nameUpdateLoading, setNameUpdateLoading] = useState(false)

  useEffect(() => {
    setEditedName(userProfile?.name || '')
  }, [userProfile])

  const handleEditName = () => {
    setEditedName(userProfile?.name || '')
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    if (editedName.trim() === userProfile?.name) {
      setIsEditingName(false)
      return
    }

    setNameUpdateLoading(true)
    
    // Safety timeout to ensure loading state is reset
    const timeoutId = setTimeout(() => {
      console.warn('Name update timeout - forcing loading state reset')
      setNameUpdateLoading(false)
      setMessage('Update timed out. Please try again.')
    }, 10000) // 10 second timeout
    
    try {
      console.log('Saving name:', editedName.trim())
      const { data, error } = await updateUserProfile(editedName.trim())
      console.log('Save result:', { data, error })
      
      clearTimeout(timeoutId) // Clear timeout on successful completion
      
      if (error) {
        console.error('Update error:', error)
        setMessage(`Error updating name: ${error.message || 'Unknown error'}`)
      } else {
        setMessage('Name updated successfully')
        setIsEditingName(false)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      clearTimeout(timeoutId) // Clear timeout on error
      console.error('Caught error:', err)
      setMessage(`Error updating name: ${err.message || 'Unknown error'}`)
    } finally {
      setNameUpdateLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedName(userProfile?.name || '')
    setIsEditingName(false)
    setNameUpdateLoading(false) // Force reset loading state
  }

  const forceResetLoading = () => {
    setNameUpdateLoading(false)
    setIsEditingName(false)
    setMessage('Loading state reset manually')
    setTimeout(() => setMessage(''), 3000)
  }

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
                Full Name
              </label>
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="input-field flex-1"
                      placeholder="Enter your full name"
                      disabled={nameUpdateLoading}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={nameUpdateLoading}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      {nameUpdateLoading ? (
                        <div className="h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={nameUpdateLoading}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {nameUpdateLoading && (
                      <button
                        onClick={forceResetLoading}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-xs"
                        title="Force reset if stuck"
                      >
                        Reset
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={userProfile?.name || 'No name set'}
                      disabled
                      className="input-field bg-gray-50 flex-1"
                    />
                    <button
                      onClick={handleEditName}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit name"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

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
            <h2 className="text-lg font-medium text-gray-900">Privacy & GDPR Compliance</h2>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Processing & Storage</h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>All data is processed and stored exclusively within the European Union</li>
                <li>Database hosting: <strong>Supabase EU</strong> (PostgreSQL in EU region)</li>
                <li>Application hosting: <strong>Hetzner Cloud</strong> (German data centers)</li>
                <li>File storage: <strong>Supabase Storage EU</strong> with automatic encryption</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Email Services</h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>Email notifications: <strong>Mailjet EU</strong> (European infrastructure)</li>
                <li>All email processing remains within EU borders</li>
                <li>No email tracking or analytics beyond delivery confirmation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Data Collection & Retention</h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>We collect only the minimum data necessary to operate the service</li>
                <li>Form submissions: stored until manually deleted by you</li>
                <li>Uploaded files: automatically deleted after 24 hours</li>
                <li>User account data: stored until account deletion</li>
                <li>No tracking cookies, analytics, or third-party scripts</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Your Rights</h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li><strong>Right to access:</strong> View all your stored data anytime</li>
                <li><strong>Right to rectification:</strong> Edit or correct your information</li>
                <li><strong>Right to erasure:</strong> Delete your account and all data permanently</li>
                <li><strong>Right to data portability:</strong> Export your form data</li>
                <li><strong>Right to object:</strong> Contact us to stop data processing</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Security Measures</h3>
              <ul className="space-y-2 ml-4 list-disc">
                <li>End-to-end encryption for all data transmission</li>
                <li>Row-level security policies on all database operations</li>
                <li>Regular security updates and monitoring</li>
                <li>No data sharing with third parties</li>
              </ul>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Data Controller:</strong> Euroform | 
                <strong> Legal Basis:</strong> Legitimate Interest (Art. 6(1)(f) GDPR) | 
                <strong> Contact:</strong> For privacy inquiries, use the account deletion feature or contact support
              </p>
            </div>
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
