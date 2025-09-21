import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import { ArrowLeft, Save, ExternalLink, Copy, Plus, Edit2, X, Download, Trash2, Settings, BarChart3 } from 'lucide-react'

const FormManager = () => {
  const { id } = useParams()
  const { session } = useAuth()
  const [form, setForm] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeTab, setActiveTab] = useState('submissions')
  
  // Form editing states
  const [editingBasic, setEditingBasic] = useState(false)
  const [editingFields, setEditingFields] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notificationEmails: '',
    is_active: true
  })
  const [fields, setFields] = useState([])

  useEffect(() => {
    fetchFormAndSubmissions()
  }, [id])

  const fetchFormAndSubmissions = async () => {
    try {
      // Fetch form details
      const formResponse = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms/${id}`, {
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
      setFormData({
        name: formData.form.name || '',
        description: formData.form.description || '',
        notificationEmails: formData.form.settings?.notificationEmails || '',
        is_active: formData.form.is_active ?? true
      })
      setFields(formData.form.fields || [])

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
            notificationEmails: updates.notificationEmails || formData.notificationEmails
          },
          is_active: updates.is_active !== undefined ? updates.is_active : formData.is_active
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update form')
      }

      const data = await response.json()
      setForm(data.form)
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

  const addField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
      options: []
    }
    setFields([...fields, newField])
  }

  const updateField = (fieldId, updates) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
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
              href={`/form/${id}`}
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
              Form Settings
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Files
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-primary)' }}>
                        {new Date(submission.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                        <div className="max-w-xs">
                          {Object.entries(submission.data || {}).map(([key, value]) => (
                            <div key={key} className="mb-1">
                              <strong>{key}:</strong> {value}
                            </div>
                          ))}
                        </div>
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteSubmission(submission.id)}
                          className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50 text-red-600"
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
      ) : (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Basic Information
              </h3>
              <button
                onClick={() => setEditingBasic(!editingBasic)}
                className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>

            {editingBasic ? (
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
                    Form is active
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button 
                    onClick={saveBasicInfo} 
                    disabled={saving}
                    className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingBasic(false)
                      setFormData({
                        name: form?.name || '',
                        description: form?.description || '',
                        notificationEmails: form?.settings?.notificationEmails || '',
                        is_active: form?.is_active ?? true
                      })
                    }} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                  <p style={{ color: 'var(--text-primary)' }}>{form?.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Description:</span>
                  <p style={{ color: 'var(--text-primary)' }}>{form?.description || 'No description'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Notification Emails:</span>
                  <p style={{ color: 'var(--text-primary)' }}>{form?.settings?.notificationEmails || 'Not configured'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    form?.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {form?.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Form Fields ({fields.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingFields(!editingFields)}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {editingFields && (
                  <button
                    onClick={addField}
                    className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {editingFields ? (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        Field {index + 1}
                      </h4>
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-1 rounded hover:bg-red-50 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value })}
                          className="input-field"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="textarea">Textarea</option>
                          <option value="select">Select</option>
                          <option value="radio">Radio</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="file">File</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="input-field"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`required_${field.id}`}
                          checked={field.required || false}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="mr-2"
                        />
                        <label htmlFor={`required_${field.id}`} className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          Required
                        </label>
                      </div>
                    </div>
                    {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                          Options (one per line)
                        </label>
                        <textarea
                          value={(field.options || []).join('\n')}
                          onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(opt => opt.trim()) })}
                          className="input-field"
                          rows="3"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                        />
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex space-x-3">
                  <button 
                    onClick={saveFields} 
                    disabled={saving}
                    className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saving ? 'Saving...' : 'Save Fields'}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingFields(false)
                      setFields(form?.fields || [])
                    }} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {fields.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No fields configured</p>
                ) : (
                  fields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-color)' }}>
                      <div>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{field.label}</span>
                        <span className="ml-2 text-sm px-2 py-1 bg-gray-100 rounded" style={{ color: 'var(--text-secondary)' }}>
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="ml-2 text-xs text-red-600">Required</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
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
