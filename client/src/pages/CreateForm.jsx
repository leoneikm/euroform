import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { Plus, Trash2, Type, Mail, FileText, Upload, GripVertical } from 'lucide-react'

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'textarea', label: 'Textarea', icon: FileText },
  { value: 'file', label: 'File Upload', icon: Upload }
]

const CreateForm = () => {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [],
    settings: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your message!',
      allowFileUpload: true,
      notificationEmails: '',
      primaryColor: '#6366f1' // Default indigo color
    }
  })

  const addField = (type) => {
    const newField = {
      id: Date.now().toString(),
      type,
      name: `field_${formData.fields.length + 1}`,
      label: '',
      placeholder: '',
      required: false,
      options: type === 'select' ? [] : undefined
    }
    setFormData({
      ...formData,
      fields: [...formData.fields, newField]
    })
  }

  const updateField = (fieldId, updates) => {
    setFormData({
      ...formData,
      fields: formData.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    })
  }

  const removeField = (fieldId) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(field => field.id !== fieldId)
    })
  }

  const moveField = (fieldId, direction) => {
    const currentIndex = formData.fields.findIndex(field => field.id === fieldId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= formData.fields.length) return

    const newFields = [...formData.fields]
    const [movedField] = newFields.splice(currentIndex, 1)
    newFields.splice(newIndex, 0, movedField)

    setFormData({
      ...formData,
      fields: newFields
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.name.trim()) {
      setError('Form name is required')
      setLoading(false)
      return
    }

    if (formData.fields.length === 0) {
      setError('At least one field is required')
      setLoading(false)
      return
    }

    if (!formData.settings.notificationEmails.trim()) {
      setError('Notification email is required')
      setLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const emails = formData.settings.notificationEmails.split(',').map(email => email.trim())
    for (const email of emails) {
      if (email && !emailRegex.test(email)) {
        setError(`Invalid email address: "${email}"`)
        setLoading(false)
        return
      }
    }

    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    if (formData.settings.primaryColor && !colorRegex.test(formData.settings.primaryColor)) {
      setError('Primary color must be a valid hex color (e.g., #6366f1)')
      setLoading(false)
      return
    }

    // Validate fields
    for (const field of formData.fields) {
      if (!field.label.trim()) {
        setError(`Label for field "${field.name}" is required`)
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Error creating form')
      }

      const data = await response.json()
      navigate(`/forms/${data.form.id}/edit`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Create New Form">
      <form onSubmit={handleSubmit} className="max-w-4xl">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Basic Form Info */}
        <div className="card mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Form Details</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Form Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Contact Form"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field"
                rows="3"
                placeholder="Brief description of the form"
              />
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Form Fields</h2>
            <div className="flex space-x-2">
              {fieldTypes.map((fieldType) => {
                const Icon = fieldType.icon
                return (
                  <button
                    key={fieldType.value}
                    type="button"
                    onClick={() => addField(fieldType.value)}
                    className="btn-secondary text-xs flex items-center"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {fieldType.label}
                  </button>
                )
              })}
            </div>
          </div>

          {formData.fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No fields added yet</p>
              <p className="text-sm">Click one of the buttons above to add a field</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.fields.map((field, index) => {
                const fieldType = fieldTypes.find(t => t.value === field.type)
                const Icon = fieldType?.icon || Type
                
                return (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <GripVertical className="h-4 w-4 text-gray-400 mr-2" />
                        <Icon className="h-4 w-4 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {fieldType?.label || field.type}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          type="button"
                          onClick={() => moveField(field.id, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(field.id, 'down')}
                          disabled={index === formData.fields.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(field.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Label *
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="input-field"
                          placeholder="e.g. Your Name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="input-field"
                          placeholder="e.g. John Doe"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Name (internal)
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="input-field"
                          placeholder="field_name"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required_${field.id}`}
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`required_${field.id}`} className="ml-2 text-sm text-gray-700">
                          Required Field
                        </label>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Form Settings */}
        <div className="card mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="notificationEmails" className="block text-sm font-medium text-gray-700 mb-1">
                Notification Emails *
              </label>
              <input
                type="text"
                id="notificationEmails"
                value={formData.settings.notificationEmails}
                onChange={(e) => setFormData({
                  ...formData,
                  settings: { ...formData.settings, notificationEmails: e.target.value }
                })}
                className="input-field"
                placeholder="info@example.com, admin@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Email addresses that receive notifications (separate multiple with commas)
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="submitButtonText" className="block text-sm font-medium text-gray-700 mb-1">
                  Submit Button Text
                </label>
                <input
                  type="text"
                  id="submitButtonText"
                  value={formData.settings.submitButtonText}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, submitButtonText: e.target.value }
                  })}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="successMessage" className="block text-sm font-medium text-gray-700 mb-1">
                  Success Message
                </label>
                <input
                  type="text"
                  id="successMessage"
                  value={formData.settings.successMessage}
                  onChange={(e) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, successMessage: e.target.value }
                  })}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={formData.settings.primaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, primaryColor: e.target.value }
                    })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.settings.primaryColor}
                    onChange={(e) => setFormData({
                      ...formData,
                      settings: { ...formData.settings, primaryColor: e.target.value }
                    })}
                    className="input-field flex-1"
                    placeholder="#6366f1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Used for buttons, focus states, and accents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
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
            {loading ? 'Creating form...' : 'Create Form'}
          </button>
        </div>
      </form>
    </Layout>
  )
}

export default CreateForm
