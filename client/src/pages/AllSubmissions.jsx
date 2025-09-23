import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import { Download, Trash2, Eye, FileText, Calendar, Filter } from 'lucide-react'

const AllSubmissions = () => {
  const { session } = useAuth()
  const [forms, setForms] = useState([])
  const [selectedFormId, setSelectedFormId] = useState('all')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchForms()
  }, [])

  useEffect(() => {
    if (forms.length > 0) {
      fetchSubmissions()
    }
  }, [selectedFormId, forms])

  const fetchForms = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error loading forms')
      }

      const data = await response.json()
      setForms(data.forms || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async () => {
    setSubmissionsLoading(true)
    setError('')
    
    try {
      let allSubmissions = []
      
      if (selectedFormId === 'all') {
        // Fetch submissions for all forms
        const submissionPromises = forms.map(async (form) => {
          try {
            const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/submissions/form/${form.id}`, {
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
                'Content-Type': 'application/json'
              }
            })

            if (!response.ok) {
              console.warn(`Failed to fetch submissions for form ${form.id}`)
              return []
            }

            const data = await response.json()
            return (data.submissions || []).map(submission => ({
              ...submission,
              formName: form.name,
              formId: form.id
            }))
          } catch (err) {
            console.warn(`Error fetching submissions for form ${form.id}:`, err)
            return []
          }
        })

        const submissionArrays = await Promise.all(submissionPromises)
        allSubmissions = submissionArrays.flat()
      } else {
        // Fetch submissions for selected form
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/submissions/form/${selectedFormId}`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Error loading submissions')
        }

        const data = await response.json()
        const selectedForm = forms.find(f => f.id === selectedFormId)
        allSubmissions = (data.submissions || []).map(submission => ({
          ...submission,
          formName: selectedForm?.name || 'Unknown Form',
          formId: selectedFormId
        }))
      }

      // Sort by creation date (newest first)
      allSubmissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setSubmissions(allSubmissions)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmissionsLoading(false)
    }
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
    } catch (err) {
      alert(err.message)
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

      // Create blob and download
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
      alert(err.message)
    }
  }

  const getFormOptions = () => {
    return [
      { value: 'all', label: `All Forms (${submissions.length} submissions)` },
      ...forms.map(form => ({
        value: form.id,
        label: `${form.name} (${submissions.filter(s => s.formId === form.id).length} submissions)`
      }))
    ]
  }

  if (loading) {
    return <Loading message="Loading forms..." />
  }

  return (
    <Layout title="All Submissions">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Filter */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-medium text-gray-900">Filter by Form</h2>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
                className="input-field min-w-[200px]"
              >
                <option value="all">All Forms</option>
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray-500">
                {submissionsLoading ? (
                  <span>Loading...</span>
                ) : (
                  <span>{submissions.length} submissions</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Submissions
            </h2>
            {selectedFormId !== 'all' && (
              <Link
                to={`/forms/${selectedFormId}/submissions`}
                className="btn-secondary text-sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                Detailed View
              </Link>
            )}
          </div>

          {submissionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{borderColor: 'var(--primary-color)'}}></div>
              <p style={{color: 'var(--text-secondary)'}}>Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-6">
                {selectedFormId === 'all' 
                  ? "You haven't received any form submissions yet."
                  : "This form hasn't received any submissions yet."
                }
              </p>
              <Link to="/forms/create" className="btn-primary">
                Create New Form
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-color)' }}>
                <thead style={{ backgroundColor: 'var(--secondary-bg)' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Date
                      </div>
                    </th>
                    {selectedFormId === 'all' && (
                      <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Form
                      </th>
                    )}
                    {selectedFormId !== 'all' ? (
                      /* Dynamic columns for specific form fields */
                      <>
                        {forms.find(f => f.id === selectedFormId)?.fields?.filter(field => field.type !== 'file').map((field) => (
                          <th key={field.id} className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            {field.label}
                          </th>
                        ))}
                        {/* Show Files column if form has file fields */}
                        {forms.find(f => f.id === selectedFormId)?.fields?.some(field => field.type === 'file') && (
                          <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                            Files
                          </th>
                        )}
                      </>
                    ) : (
                      /* Default columns for all forms view */
                      <>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Data
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Files
                        </th>
                      </>
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
                      {selectedFormId === 'all' && (
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center">
                            <div className="p-1 rounded mr-2" style={{backgroundColor: 'rgba(106, 0, 51, 0.1)'}}>
                              <FileText className="h-3 w-3" style={{color: 'var(--primary-color)'}} />
                            </div>
                            <div>
                              <div className="font-medium" style={{color: 'var(--text-primary)'}}>{submission.formName}</div>
                              <Link 
                                to={`/forms/${submission.formId}/submissions`}
                                className="text-xs hover:underline transition-colors duration-200"
                                style={{color: 'var(--primary-color)'}}
                                onMouseEnter={(e) => e.target.style.color = 'var(--primary-hover)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
                              >
                                View form details
                              </Link>
                            </div>
                          </div>
                        </td>
                      )}
                      {selectedFormId !== 'all' ? (
                        /* Dynamic cells for specific form fields */
                        <>
                          {forms.find(f => f.id === selectedFormId)?.fields?.filter(field => field.type !== 'file').map((field) => (
                            <td key={field.id} className="px-6 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                              <div className="max-w-xs truncate font-normal" title={submission.data?.[field.name] || submission.data?.[field.label] || ''}>
                                {submission.data?.[field.name] || submission.data?.[field.label] || (
                                  <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>-</span>
                                )}
                              </div>
                            </td>
                          ))}
                          {/* Files column if form has file fields */}
                          {forms.find(f => f.id === selectedFormId)?.fields?.some(field => field.type === 'file') && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {submission.files && submission.files.length > 0 ? (
                                <div className="space-y-1">
                                  {submission.files.slice(0, 2).map((file, index) => (
                                    <button
                                      key={index}
                                      onClick={() => downloadFile(submission.id, file.name)}
                                      className="flex items-center hover:underline text-xs transition-colors duration-200"
                                      style={{color: 'var(--primary-color)'}}
                                      onMouseEnter={(e) => e.target.style.color = 'var(--primary-hover)'}
                                      onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
                                      title="Download file"
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      <span className="truncate max-w-[100px]">
                                        {file.name}
                                      </span>
                                    </button>
                                  ))}
                                  {submission.files.length > 2 && (
                                    <div className="text-xs" style={{color: 'var(--text-secondary)'}}>
                                      +{submission.files.length - 2} more files
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs" style={{color: 'var(--text-secondary)', opacity: 0.6}}>No files</span>
                              )}
                            </td>
                          )}
                        </>
                      ) : (
                        /* Default cells for all forms view */
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-xs">
                              {Object.entries(submission.data || {}).slice(0, 3).map(([key, value]) => (
                                <div key={key} className="mb-1 truncate">
                                  <strong style={{color: 'var(--text-primary)'}}>{key}:</strong> <span style={{color: 'var(--text-secondary)'}}>{value}</span>
                                </div>
                              ))}
                              {Object.keys(submission.data || {}).length > 3 && (
                                <div className="text-xs italic" style={{color: 'var(--text-secondary)'}}>
                                  +{Object.keys(submission.data || {}).length - 3} more fields
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {submission.files && submission.files.length > 0 ? (
                              <div className="space-y-1">
                                {submission.files.slice(0, 2).map((file, index) => (
                                  <button
                                    key={index}
                                    onClick={() => downloadFile(submission.id, file.name)}
                                    className="flex items-center hover:underline text-xs transition-colors duration-200"
                                    style={{color: 'var(--primary-color)'}}
                                    onMouseEnter={(e) => e.target.style.color = 'var(--primary-hover)'}
                                    onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
                                    title="Download file"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    <span className="truncate max-w-[100px]">
                                      {file.name}
                                    </span>
                                  </button>
                                ))}
                                {submission.files.length > 2 && (
                                  <div className="text-xs" style={{color: 'var(--text-secondary)'}}>
                                    +{submission.files.length - 2} more files
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs" style={{color: 'var(--text-secondary)', opacity: 0.6}}>No files</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/forms/${submission.formId}/submissions`}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
                            style={{ color: 'var(--primary-color)' }}
                            title="View in form context"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => deleteSubmission(submission.id)}
                            className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                            title="Delete submission"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {!submissionsLoading && submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 rounded-lg" style={{backgroundColor: 'rgba(106, 0, 51, 0.1)'}}>
                  <FileText className="h-6 w-6" style={{color: 'var(--primary-color)'}} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Total Submissions</p>
                  <p className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>{submissions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 rounded-lg" style={{backgroundColor: 'rgba(106, 0, 51, 0.15)'}}>
                  <Calendar className="h-6 w-6" style={{color: 'var(--primary-color)'}} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>Today</p>
                  <p className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>
                    {submissions.filter(s => 
                      new Date(s.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 rounded-lg" style={{backgroundColor: 'rgba(106, 0, 51, 0.2)'}}>
                  <Download className="h-6 w-6" style={{color: 'var(--primary-color)'}} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium" style={{color: 'var(--text-secondary)'}}>With Files</p>
                  <p className="text-2xl font-bold" style={{color: 'var(--text-primary)'}}>
                    {submissions.filter(s => s.files && s.files.length > 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AllSubmissions
