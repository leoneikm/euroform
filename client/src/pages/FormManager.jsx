import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import { ArrowLeft, Save, ExternalLink, Copy, Plus, Edit2, X, Download, Trash2, Settings, BarChart3, Type, Mail, FileText, Upload, GripVertical } from 'lucide-react'

// Utility function to generate field name from label
const generateFieldName = (label) => {
  if (!label) return ''
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
}

const fieldTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'textarea', label: 'Textarea', icon: FileText },
  { value: 'file', label: 'File Upload', icon: Upload }
]

const FormManager = () => {
  const { id } = useParams()
  const { session } = useAuth()
  const [form, setForm] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState('builder')
  
  // Form editing states
  const [editingFields, setEditingFields] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notificationEmails: '',
    primaryColor: '#601033',
    is_active: true,
    // Form text settings
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your message!',
    // Input field design options
    inputBorderRadius: '6',
    inputBorderColor: '#d1d5db',
    inputHeight: '40',
    inputBorderWidth: '1',
    // Button design options
    buttonBorderRadius: '6',
    buttonBorderColor: '#601033',
    buttonHeight: '44',
    buttonBorderWidth: '0'
  })
  const [fields, setFields] = useState([])
  const [originalFormData, setOriginalFormData] = useState({})
  const [originalFields, setOriginalFields] = useState([])

  useEffect(() => {
    fetchFormAndSubmissions()
  }, [id])

  const fetchFormAndSubmissions = async () => {
    try {
      // Fetch form details using authenticated endpoint with manage query parameter
      const formResponse = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms/${id}?manage=true`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!formResponse.ok) {
        throw new Error('Form not found')
      }

      const formData = await formResponse.json()
      setForm(formData.form)
      
      const currentFormData = {
        name: formData.form.name || '',
        description: formData.form.description || '',
        notificationEmails: formData.form.settings?.notificationEmails || '',
        primaryColor: formData.form.settings?.primaryColor || '#601033',
        is_active: formData.form.is_active ?? true,
        // Form text settings with defaults
        submitButtonText: formData.form.settings?.submitButtonText || 'Submit',
        successMessage: formData.form.settings?.successMessage || 'Thank you for your message!',
        // Input field design options with defaults
        inputBorderRadius: formData.form.settings?.inputBorderRadius || '6',
        inputBorderColor: formData.form.settings?.inputBorderColor || '#d1d5db',
        inputHeight: formData.form.settings?.inputHeight || '40',
        inputBorderWidth: formData.form.settings?.inputBorderWidth || '1',
        // Button design options with defaults
        buttonBorderRadius: formData.form.settings?.buttonBorderRadius || '6',
        buttonBorderColor: formData.form.settings?.buttonBorderColor || (formData.form.settings?.primaryColor || '#601033'),
        buttonHeight: formData.form.settings?.buttonHeight || '44',
        buttonBorderWidth: formData.form.settings?.buttonBorderWidth || '0'
      }
      
      const currentFields = formData.form.fields || []
      
      setFormData(currentFormData)
      setOriginalFormData({ ...currentFormData })
      setFields(currentFields)
      setOriginalFields([...currentFields])

      // Fetch submissions
      const submissionsResponse = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/submissions/form/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json()
        setSubmissions(submissionsData.submissions || [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateForm = async (updates) => {
    setSaving(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updates.name || formData.name,
          description: updates.description || formData.description,
          fields: updates.fields !== undefined ? updates.fields : fields,
          settings: {
            ...form.settings,
            notificationEmails: updates.notificationEmails || formData.notificationEmails,
            primaryColor: updates.primaryColor || formData.primaryColor,
            // Include form text settings
            submitButtonText: updates.submitButtonText || formData.submitButtonText,
            successMessage: updates.successMessage || formData.successMessage,
            // Include design options
            inputBorderRadius: updates.inputBorderRadius || formData.inputBorderRadius,
            inputBorderColor: updates.inputBorderColor || formData.inputBorderColor,
            inputHeight: updates.inputHeight || formData.inputHeight,
            inputBorderWidth: updates.inputBorderWidth || formData.inputBorderWidth,
            buttonBorderRadius: updates.buttonBorderRadius || formData.buttonBorderRadius,
            buttonBorderColor: updates.buttonBorderColor || formData.buttonBorderColor,
            buttonHeight: updates.buttonHeight || formData.buttonHeight,
            buttonBorderWidth: updates.buttonBorderWidth || formData.buttonBorderWidth
          },
          is_active: updates.is_active !== undefined ? updates.is_active : formData.is_active
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update form')
      }

      const data = await response.json()
      setForm(data.form)
      updateOriginalData()
      setSuccessMessage('Form updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  const saveBasicInfo = async () => {
    await updateForm(formData)
    setEditingBasic(false)
  }

  const saveFields = async () => {
    await updateForm({ fields })
    setEditingFields(false)
  }

  const addField = (type = 'text') => {
    const newField = {
      id: `field_${Date.now()}`,
      type,
      label: '',
      name: '',
      placeholder: '',
      required: false,
      options: type === 'select' ? [] : undefined
    }
    setFields([...fields, newField])
  }

  const moveField = (fieldId, direction) => {
    const currentIndex = fields.findIndex(field => field.id === fieldId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= fields.length) return

    const newFields = [...fields]
    const [movedField] = newFields.splice(currentIndex, 1)
    newFields.splice(newIndex, 0, movedField)

    setFields(newFields)
  }

  const updateField = (fieldId, updates) => {
    setFields(fields.map(field => {
      if (field.id === fieldId) {
        const updatedField = { ...field, ...updates }
        
        // If label is being updated and field name is empty or matches generated name from old label
        if (updates.label !== undefined) {
          const oldGeneratedName = generateFieldName(field.label)
          const shouldAutoSync = !field.name || field.name === oldGeneratedName
          
          if (shouldAutoSync) {
            updatedField.name = generateFieldName(updates.label)
          }
        }
        
        return updatedField
      }
      return field
    }))
  }

  const removeField = (fieldId) => {
    setFields(fields.filter(field => field.id !== fieldId))
  }

  const deleteSubmission = async (submissionId) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error deleting submission')
      }

      setSubmissions(submissions.filter(sub => sub.id !== submissionId))
      setSuccessMessage('Submission deleted successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  const downloadFile = async (submissionId, fileName) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/submissions/file/${submissionId}/${encodeURIComponent(fileName)}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Error downloading file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  const copyEmbedCode = () => {
    const embedCode = `<iframe id="euroform-${id}" src="${window.location.origin}/form/${id}" width="100%" style="border:none;background:transparent;" frameborder="0" scrolling="no" allowtransparency="true"></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data.type === 'euroform-resize') {
    document.getElementById('euroform-${id}').style.height = e.data.height + 'px';
  }
});
</script>`
    navigator.clipboard.writeText(embedCode)
    setSuccessMessage('Embed code copied to clipboard!')
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // Helper functions to detect changes
  const hasFormDataChanged = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalFormData)
  }

  const hasFieldsChanged = () => {
    return JSON.stringify(fields) !== JSON.stringify(originalFields)
  }

  // Update original data after successful save
  const updateOriginalData = () => {
    setOriginalFormData({ ...formData })
    setOriginalFields([...fields])
  }

  if (loading) {
    return <Loading message="Loading form..." />
  }

  if (error && !form) {
    return (
      <Layout>
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {form?.name}
          </h1>
          <div className="flex items-center space-x-3">
            <a
              href={`/preview/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </a>
            <button
              onClick={copyEmbedCode}
              className="btn-secondary flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Embed
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b" style={{ borderColor: 'var(--border-color)' }}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'submissions'
                  ? 'border-current'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ 
                color: activeTab === 'submissions' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderColor: activeTab === 'submissions' ? 'var(--primary-color)' : 'transparent'
              }}
            >
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'builder'
                  ? 'border-current'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ 
                color: activeTab === 'builder' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderColor: activeTab === 'builder' ? 'var(--primary-color)' : 'transparent'
              }}
            >
              <Edit2 className="h-4 w-4 inline mr-2" />
              Form Builder
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-current'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ 
                color: activeTab === 'settings' ? 'var(--primary-color)' : 'var(--text-secondary)',
                borderColor: activeTab === 'settings' ? 'var(--primary-color)' : 'transparent'
              }}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'submissions' ? (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              Form Submissions
            </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No submissions yet</p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Share your form to start collecting responses
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
                <thead style={{ backgroundColor: 'var(--secondary-bg)' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Date
                    </th>
                    {/* Dynamic columns for each form field */}
                    {form?.fields?.filter(field => field.type !== 'file').map((field) => (
                      <th key={field.id} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        {field.label}
                      </th>
                    ))}
                    {/* Show Files column if form has file fields */}
                    {form?.fields?.some(field => field.type === 'file') && (
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Files
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: 'var(--primary-bg)', borderColor: 'var(--border-color)' }}>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {new Date(submission.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      {/* Dynamic cells for each form field */}
                      {form?.fields?.filter(field => field.type !== 'file').map((field) => (
                        <td key={field.id} className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                          <div className="max-w-xs truncate font-normal" title={submission.data?.[field.name] || submission.data?.[field.label] || ''}>
                            {submission.data?.[field.name] || submission.data?.[field.label] || (
                              <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>-</span>
                            )}
                          </div>
                        </td>
                      ))}
                      {/* Files column if form has file fields */}
                      {form?.fields?.some(field => field.type === 'file') && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                          {submission.files && submission.files.length > 0 ? (
                            <div>
                              {submission.files.map((file, index) => (
                                <div key={index} className="flex items-center mb-1">
                                  <button
                                    onClick={() => downloadFile(submission.id, file.name)}
                                    className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                                    title="Download file"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    <div className="text-xs text-left">
                                      <div className="font-medium">{file.fieldName || 'File'}</div>
                                      <div className="text-gray-500">{file.name}</div>
                                    </div>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">No files</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteSubmission(submission.id)}
                          className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                          title="Delete submission"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'builder' ? (
        <div className="space-y-6">
          <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
              Form Builder
            </h2>
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

          {fields.length === 0 ? (
            <div className="text-center py-12">
              <Edit2 className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No fields added yet</p>
              <p style={{ color: 'var(--text-secondary)' }}>
                Click one of the buttons above to add a field
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
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
                          disabled={index === fields.length - 1}
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
                          Field Name (internal)
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="input-field"
                          placeholder="Auto-generated from label"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Used for data storage. Auto-syncs with label unless manually changed.
                        </p>
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

          <div className="flex justify-end mt-6">
            <button
              onClick={saveFields}
              disabled={saving || !hasFieldsChanged()}
              className={`btn-primary ${(saving || !hasFieldsChanged()) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving...' : 'Save Fields'}
            </button>
          </div>

        </div>

        {/* Design Customization Card - Separate from Form Builder */}
        <div className="card mt-6">
          <h2 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Design Customization</h2>
          
          {/* Primary Color */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Primary Color</h3>
            <div className="max-w-md">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Brand Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="input-field flex-1"
                  placeholder="#601033"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Main color used for buttons and focus states in the form
              </p>
            </div>
          </div>

          {/* Input Field Design */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Input Field Styling</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Border Radius (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.inputBorderRadius}
                  onChange={(e) => setFormData({ ...formData, inputBorderRadius: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Border Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.inputBorderColor}
                    onChange={(e) => setFormData({ ...formData, inputBorderColor: e.target.value })}
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.inputBorderColor}
                    onChange={(e) => setFormData({ ...formData, inputBorderColor: e.target.value })}
                    className="input-field flex-1"
                    placeholder="#d1d5db"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Height (px)
                </label>
                <input
                  type="number"
                  min="30"
                  max="80"
                  value={formData.inputHeight}
                  onChange={(e) => setFormData({ ...formData, inputHeight: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Border Width (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.inputBorderWidth}
                  onChange={(e) => setFormData({ ...formData, inputBorderWidth: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Button Design */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Button Styling</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Border Radius (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.buttonBorderRadius}
                  onChange={(e) => setFormData({ ...formData, buttonBorderRadius: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Border Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.buttonBorderColor}
                    onChange={(e) => setFormData({ ...formData, buttonBorderColor: e.target.value })}
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.buttonBorderColor}
                    onChange={(e) => setFormData({ ...formData, buttonBorderColor: e.target.value })}
                    className="input-field flex-1"
                    placeholder="#601033"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Height (px)
                </label>
                <input
                  type="number"
                  min="30"
                  max="80"
                  value={formData.buttonHeight}
                  onChange={(e) => setFormData({ ...formData, buttonHeight: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                  Border Width (px)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.buttonBorderWidth}
                  onChange={(e) => setFormData({ ...formData, buttonBorderWidth: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Sample Input</label>
                  <input
                    type="text"
                    placeholder="This is how your input will look"
                    readOnly
                    style={{
                      borderRadius: `${formData.inputBorderRadius}px`,
                      borderColor: formData.inputBorderColor,
                      height: `${formData.inputHeight}px`,
                      borderWidth: `${formData.inputBorderWidth}px`,
                      padding: '0 12px'
                    }}
                    className="w-full border focus:outline-none"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    style={{
                      borderRadius: `${formData.buttonBorderRadius}px`,
                      borderColor: formData.buttonBorderColor,
                      height: `${formData.buttonHeight}px`,
                      borderWidth: `${formData.buttonBorderWidth}px`,
                      backgroundColor: formData.primaryColor,
                      color: 'white',
                      padding: '0 16px',
                      fontWeight: '500'
                    }}
                    className="border transition-colors duration-200"
                  >
                    {formData.submitButtonText || 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveBasicInfo}
              disabled={saving || !hasFormDataChanged()}
              className={`btn-primary ${(saving || !hasFormDataChanged()) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving Design...' : 'Save Design'}
            </button>
          </div>
        </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Form Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Form Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter form name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Enter form description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Notification Emails (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.notificationEmails}
                  onChange={(e) => setFormData({ ...formData, notificationEmails: e.target.value })}
                  className="input-field"
                  placeholder="email1@example.com, email2@example.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email addresses that receive notifications when someone submits the form
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Submit Button Text
                </label>
                <input
                  type="text"
                  value={formData.submitButtonText}
                  onChange={(e) => setFormData({ ...formData, submitButtonText: e.target.value })}
                  className="input-field"
                  placeholder="Submit"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Text displayed on the form's submit button
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Thank You Message
                </label>
                <input
                  type="text"
                  value={formData.successMessage}
                  onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                  className="input-field"
                  placeholder="Thank you for your message!"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Message shown after successful form submission
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Form is active and accepting submissions
                </label>
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  onClick={saveBasicInfo} 
                  disabled={saving || !hasFormDataChanged()}
                  className={`btn-primary ${(saving || !hasFormDataChanged()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>


          {/* Embed Code */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Embed Code</h3>
            <div className="bg-gray-50 border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
              <code className="text-sm break-all" style={{ color: 'var(--text-secondary)' }}>
                {`<iframe id="euroform-${id}" src="${window.location.origin}/form/${id}" width="100%" style="border:none;background:transparent;" frameborder="0" scrolling="no" allowtransparency="true"></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data.type === 'euroform-resize') {
    document.getElementById('euroform-${id}').style.height = e.data.height + 'px';
  }
});
</script>`}
              </code>
            </div>
            <button
              onClick={copyEmbedCode}
              className="btn-secondary mt-3 flex items-center"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default FormManager
