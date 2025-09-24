import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

const CreateForm = () => {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.name.trim()) {
      setError('Form name is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          fields: [], // Start with empty fields
          settings: {
            submitButtonText: 'Submit',
            successMessage: 'Thank you for your message!',
            allowFileUpload: true,
            notificationEmails: '', // Will be configured in FormManager
            primaryColor: '#601033',
            // Default design options
            inputBorderRadius: '6',
            inputBorderColor: '#d1d5db',
            inputHeight: '40',
            inputBorderWidth: '1',
            buttonBorderRadius: '6',
            buttonBorderColor: '#601033',
            buttonHeight: '44',
            buttonBorderWidth: '0'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Error creating form')
      }

      const data = await response.json()
      navigate(`/forms/${data.form.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Create New Form">
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Create New Form</h1>
          <p className="text-gray-600">
            Start by giving your form a name and description. You'll be able to add fields, configure settings, and customize the design in the next step.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="card mb-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Form Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g. Contact Form, Newsletter Signup, Event Registration"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be used as the form title and for your reference
                </p>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Brief description of what this form is for..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Help yourself remember what this form is used for
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating form...' : 'Create Form & Continue'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}

export default CreateForm
