import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import { ArrowLeft, Download, Trash2 } from 'lucide-react'

const FormSubmissions = () => {
  const { id } = useParams()
  const { session } = useAuth()
  const [form, setForm] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubmissions()
  }, [id])

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/submissions/form/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error loading submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  if (loading) {
    return <Loading message="Loading submissions..." />
  }

  return (
    <Layout title="Form Submissions">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center transition-colors duration-200"
          style={{color: 'var(--text-secondary)'}}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium" style={{color: 'var(--text-primary)'}}>
            Submissions ({submissions.length})
          </h2>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <p style={{color: 'var(--text-secondary)'}}>No submissions for this form yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>
                    Files
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{color: 'var(--text-secondary)'}}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{color: 'var(--text-primary)'}}>
                      {new Date(submission.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="max-w-xs">
                        {Object.entries(submission.data || {}).map(([key, value]) => (
                          <div key={key} className="mb-1">
                            <strong style={{color: 'var(--text-primary)'}}>{key}:</strong> <span style={{color: 'var(--text-secondary)'}}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.files && submission.files.length > 0 ? (
                        <div>
                          {submission.files.map((file, index) => (
                            <div key={index} className="flex items-center mb-1">
                              <button
                                onClick={() => downloadFile(submission.id, file.name)}
                                className="flex items-center hover:underline transition-colors duration-200"
                                style={{color: 'var(--primary-color)'}}
                                onMouseEnter={(e) => e.target.style.color = 'var(--primary-hover)'}
                                onMouseLeave={(e) => e.target.style.color = 'var(--primary-color)'}
                                title="Download file"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                <div className="text-xs text-left">
                                  <div className="font-medium" style={{color: 'var(--text-primary)'}}>{file.fieldName || 'File'}</div>
                                  <div style={{color: 'var(--text-secondary)'}}>{file.name}</div>
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{color: 'var(--text-secondary)', opacity: 0.6}}>No files</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteSubmission(submission.id)}
                        className="transition-colors duration-200"
                        style={{color: '#dc2626'}}
                        onMouseEnter={(e) => e.target.style.color = '#991b1b'}
                        onMouseLeave={(e) => e.target.style.color = '#dc2626'}
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
    </Layout>
  )
}

export default FormSubmissions
