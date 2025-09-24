import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Upload, Send, CheckCircle, AlertCircle } from 'lucide-react'

// Helper function to apply custom CSS variables for theming and design options
const applyCustomStyles = (settings) => {
  if (typeof document !== 'undefined' && settings) {
    const {
      primaryColor,
      inputBorderRadius = '6',
      inputBorderColor = '#d1d5db',
      inputHeight = '40',
      inputBorderWidth = '1',
      buttonBorderRadius = '6',
      buttonBorderColor,
      buttonHeight = '44',
      buttonBorderWidth = '0'
    } = settings
    
    const root = document.documentElement
    
    if (primaryColor) {
      root.style.setProperty('--form-primary-color', primaryColor)
      
      // Generate lighter and darker variants
      const hex = primaryColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      // Create hover color (slightly darker)
      const hoverR = Math.max(0, r - 20)
      const hoverG = Math.max(0, g - 20)
      const hoverB = Math.max(0, b - 20)
      const hoverColor = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`
      
      // Create focus color (with transparency)
      const focusColor = `rgba(${r}, ${g}, ${b}, 0.1)`
      
      root.style.setProperty('--form-primary-hover', hoverColor)
      root.style.setProperty('--form-primary-focus', focusColor)
    }
    
    // Inject custom styles for inputs and buttons
    let styleElement = document.getElementById('euroform-preview-styles')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'euroform-preview-styles'
      document.head.appendChild(styleElement)
    }
    
    const finalButtonBorderColor = buttonBorderColor || primaryColor || '#6366f1'
    
    styleElement.textContent = `
      .preview-input {
        border-radius: ${inputBorderRadius}px !important;
        border-color: ${inputBorderColor} !important;
        height: ${inputHeight}px !important;
        border-width: ${inputBorderWidth}px !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      .preview-input:focus {
        outline: none !important;
        border-color: ${primaryColor || '#6366f1'} !important;
        box-shadow: 0 0 0 2px ${primaryColor ? `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.1)` : 'rgba(99, 102, 241, 0.1)'} !important;
      }
      .preview-textarea {
        border-radius: ${inputBorderRadius}px !important;
        border-color: ${inputBorderColor} !important;
        border-width: ${inputBorderWidth}px !important;
        padding: 12px !important;
      }
      .preview-textarea:focus {
        outline: none !important;
        border-color: ${primaryColor || '#6366f1'} !important;
        box-shadow: 0 0 0 2px ${primaryColor ? `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.1)` : 'rgba(99, 102, 241, 0.1)'} !important;
      }
      .preview-button {
        background-color: ${primaryColor || '#6366f1'} !important;
        border-radius: ${buttonBorderRadius}px !important;
        border-color: ${finalButtonBorderColor} !important;
        height: ${buttonHeight}px !important;
        border-width: ${buttonBorderWidth}px !important;
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .preview-button:hover:not(:disabled) {
        background-color: ${primaryColor ? `#${Math.max(0, parseInt(primaryColor.slice(1, 3), 16) - 20).toString(16).padStart(2, '0')}${Math.max(0, parseInt(primaryColor.slice(3, 5), 16) - 20).toString(16).padStart(2, '0')}${Math.max(0, parseInt(primaryColor.slice(5, 7), 16) - 20).toString(16).padStart(2, '0')}` : '#4f46e5'} !important;
      }
    `
  }
}

const FormPreview = () => {
  const { formId } = useParams()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({})
  const [files, setFiles] = useState({})

  // Memoize the server URL to avoid recreating it
  const serverUrl = useMemo(() => import.meta.env.VITE_SERVER_URL || 'http://localhost:3001', [])

  // Memoize the fetch function to avoid recreating it
  const fetchForm = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`${serverUrl}/api/forms/${formId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Form not found')
      }

      const data = await response.json()
      
      // Optimize initial form data creation
      const initialData = data.form.fields.reduce((acc, field) => {
        acc[field.name] = ''
        return acc
      }, {})
      
      // Batch all state updates together to avoid multiple re-renders
      setForm(data.form)
      setFormData(initialData)
      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }, [serverUrl, formId])

  // Start fetching immediately when component mounts
  useEffect(() => {
    if (formId) {
      fetchForm()
    }
  }, [formId, fetchForm])

  // Apply custom styles when form loads
  useEffect(() => {
    if (form?.settings) {
      applyCustomStyles(form.settings)
    }
  }, [form])

  // Memoize input change handler to prevent unnecessary re-renders
  const handleInputChange = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }, [])

  // Memoize file change handler
  const handleFileChange = useCallback((fieldName, fileList) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: Array.from(fileList)
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validate required fields
    for (const field of form.fields) {
      if (field.required) {
        if (field.type === 'file') {
          // Check if files were uploaded for required file fields
          if (!files[field.name] || files[field.name].length === 0) {
            setError(`The field "${field.label}" is required`)
            setSubmitting(false)
            return
          }
        } else {
          // Check regular form fields
          if (!formData[field.name] || formData[field.name].toString().trim() === '') {
            setError(`The field "${field.label}" is required`)
            setSubmitting(false)
            return
          }
        }
      }
    }

    try {
      const submitData = new FormData()
      
      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value)
      })

      // Add files with field names
      Object.entries(files).forEach(([fieldName, fileList]) => {
        fileList.forEach(file => {
          submitData.append(fieldName, file)
        })
      })

      const response = await fetch(`${serverUrl}/api/submissions/submit/${formId}`, {
        method: 'POST',
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error submitting form')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Memoize field renderer to prevent unnecessary re-renders
  const renderField = useCallback((field) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      placeholder: field.placeholder || '',
      className: "preview-input w-full border border-gray-300 transition-colors duration-200"
    }

    switch (field.type) {
      case 'email':
        return (
          <input
            {...commonProps}
            type="email"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        )
      
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows="4"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="preview-textarea w-full border border-gray-300 transition-colors duration-200"
          />
        )
      
      case 'file':
        return (
          <div>
            <input
              {...commonProps}
              type="file"
              multiple
              onChange={(e) => handleFileChange(field.name, e.target.files)}
              className="preview-input w-full border border-gray-300 transition-colors duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum file size: 10MB
            </p>
          </div>
        )
      
      default: // text
        return (
          <input
            {...commonProps}
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        )
    }
  }, [formData, handleInputChange, handleFileChange])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
              <div className="h-12 bg-blue-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-900 mb-2">Form not available</h2>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                {form.settings?.successMessage || 'Thank you for your message!'}
              </h2>
              <p className="text-green-700">
                Your message was submitted successfully.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.name}</h1>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <label 
                  htmlFor={field.name}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="preview-button w-full text-white font-medium border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {form.settings?.submitButtonText || 'Submit'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                Powered by <span className="font-medium">euroform</span> - GDPR-compliant forms
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FormPreview
