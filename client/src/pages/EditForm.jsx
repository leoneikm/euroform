import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import { Save, Eye, ExternalLink, Copy, Trash2, Plus, Edit2, X } from 'lucide-react'

// Utility function to generate field name from label
const generateFieldName = (label) => {
  if (!label) return ''
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
}

const EditForm = () => {
  const { id } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Form editing states
  const [editingBasic, setEditingBasic] = useState(false)
  const [editingFields, setEditingFields] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notificationEmails: '',
    primaryColor: '#6366f1',
    is_active: true
  })
  const [fields, setFields] = useState([])

  useEffect(() => {
    fetchForm()
  }, [id])

  const fetchForm = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms/${id}?manage=true`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Form not found')
      }

      const data = await response.json()
      setForm(data.form)
      console.log('Form settings loaded:', data.form.settings) // Debug log
      setFormData({
        name: data.form.name || '',
        description: data.form.description || '',
        notificationEmails: data.form.settings?.notificationEmails || '',
        primaryColor: data.form.settings?.primaryColor || '#6366f1',
        is_active: data.form.is_active ?? true,
        // Input field design options with defaults
        inputBorderRadius: data.form.settings?.inputBorderRadius || '6',
        inputBorderColor: data.form.settings?.inputBorderColor || '#d1d5db',
        inputHeight: data.form.settings?.inputHeight || '40',
        inputBorderWidth: data.form.settings?.inputBorderWidth || '1',
        // Button design options with defaults
        buttonBorderRadius: data.form.settings?.buttonBorderRadius || '6',
        buttonBorderColor: data.form.settings?.buttonBorderColor || (data.form.settings?.primaryColor || '#6366f1'),
        buttonHeight: data.form.settings?.buttonHeight || '44',
        buttonBorderWidth: data.form.settings?.buttonBorderWidth || '0'
      })
      setFields(data.form.fields || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateForm = async (updates) => {
    setSaving(true)
    
    // Validate color format if provided
    const colorRegex = /^#[0-9A-Fa-f]{6}$/
    const colorToValidate = updates.primaryColor || formData.primaryColor
    if (colorToValidate && !colorRegex.test(colorToValidate)) {
      setError('Primary color must be a valid hex color (e.g., #6366f1)')
      setSaving(false)
      return
    }
    
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
      label: '',
      name: '',
      placeholder: '',
      required: false,
      options: []
    }
    setFields([...fields, newField])
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
      <Layout title="Edit Form">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageHeader 
        title={`Edit Form: ${form?.name}`}
        actionText="Back to Dashboard"
        actionLink="/dashboard"
      />

      {/* Action Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveBasicInfo}
            disabled={saving || !editingBasic}
            className={`btn-primary flex items-center ${(!editingBasic || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href={`/form/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Test Form
          </a>
          <a
            href={`/forms/${id}/submissions`}
            className="btn-secondary flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Submissions
          </a>
          <button
            onClick={copyEmbedCode}
            className="btn-secondary flex items-center"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Embed Code
          </button>
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
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <input
                      type="color"
                      id="primaryColorPicker"
                      value={formData.primaryColor || '#6366f1'}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      style={{ minWidth: '48px', minHeight: '40px' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={formData.primaryColor || '#6366f1'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="input-field flex-1"
                    placeholder="#6366f1"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Used for buttons, focus states, and accents in the embedded form
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
                  Form is active
                </label>
              </div>

              {/* Design Customization */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="text-md font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Design Customization</h4>
                
                {/* Input Field Design */}
                <div className="mb-6">
                  <h5 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Input Field Styling</h5>
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
                  <h5 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Button Styling</h5>
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
                          placeholder="#6366f1"
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
                <div>
                  <h5 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Preview</h5>
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
                          {form?.settings?.submitButtonText || 'Submit'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button onClick={saveBasicInfo} className="btn-primary">
                  Save Changes
                </button>
                <button 
                  onClick={() => {
                    setEditingBasic(false)
                    setFormData({
                      name: form?.name || '',
                      description: form?.description || '',
                      notificationEmails: form?.settings?.notificationEmails || '',
                      primaryColor: form?.settings?.primaryColor || '#6366f1',
                      is_active: form?.is_active ?? true,
                      // Reset design options
                      inputBorderRadius: form?.settings?.inputBorderRadius || '6',
                      inputBorderColor: form?.settings?.inputBorderColor || '#d1d5db',
                      inputHeight: form?.settings?.inputHeight || '40',
                      inputBorderWidth: form?.settings?.inputBorderWidth || '1',
                      buttonBorderRadius: form?.settings?.buttonBorderRadius || '6',
                      buttonBorderColor: form?.settings?.buttonBorderColor || (form?.settings?.primaryColor || '#6366f1'),
                      buttonHeight: form?.settings?.buttonHeight || '44',
                      buttonBorderWidth: form?.settings?.buttonBorderWidth || '0'
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
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Primary Color:</span>
                <div className="flex items-center space-x-2 mt-1">
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: form?.settings?.primaryColor || '#6366f1' }}
                    title={form?.settings?.primaryColor || '#6366f1'}
                  ></div>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {form?.settings?.primaryColor || '#6366f1'}
                  </span>
                </div>
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
                        Label *
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="input-field"
                        placeholder="e.g. Your Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                        Field Name (internal)
                      </label>
                      <input
                        type="text"
                        value={field.name || ''}
                        onChange={(e) => updateField(field.id, { name: e.target.value })}
                        className="input-field"
                        placeholder="Auto-generated from label"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Used for data storage. Auto-syncs with label unless manually changed.
                      </p>
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
                        placeholder="e.g. John Doe"
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
                <button onClick={saveFields} className="btn-primary">
                  Save Fields
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
    </Layout>
  )
}

export default EditForm
