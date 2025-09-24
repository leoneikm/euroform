import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import Loading from '../components/Loading'
import PageHeader from '../components/PageHeader'
import FormCard from '../components/FormCard'
import FormCardSkeleton from '../components/FormCardSkeleton'
import EmptyState from '../components/EmptyState'

const Dashboard = () => {
  const { user, session, loading: authLoading } = useAuth()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [initialLoad, setInitialLoad] = useState(true)
  const [lastFetchTime, setLastFetchTime] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter forms based on search query
  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) {
      return forms
    }
    
    const query = searchQuery.toLowerCase().trim()
    return forms.filter(form => 
      form.name.toLowerCase().includes(query) ||
      (form.description && form.description.toLowerCase().includes(query))
    )
  }, [forms, searchQuery])

  useEffect(() => {
    // Only fetch forms when we have a session and auth is not loading
    if (session && !authLoading) {
      const now = Date.now()
      const cacheTimeout = 5 * 60 * 1000 // 5 minutes
      
      // Only fetch if we haven't fetched recently or if forms are empty
      if (now - lastFetchTime > cacheTimeout || forms.length === 0) {
        fetchForms()
      } else {
        setLoading(false)
        setInitialLoad(false)
      }
    } else if (!authLoading && !session) {
      // Auth is complete but no session - redirect will happen in AuthContext
      setLoading(false)
    }
  }, [session, authLoading, lastFetchTime, forms.length])

  const fetchForms = async () => {
    if (!session?.access_token) return
    
    try {
      setError('') // Clear any previous errors
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Error loading forms (${response.status})`)
      }

      const data = await response.json()
      setForms(data.forms || [])
      setLastFetchTime(Date.now())
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please check your connection and try again.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const deleteForm = async (formId) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'}/api/forms/${formId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Error deleting form')
      }

      setForms(forms.filter(form => form.id !== formId))
    } catch (err) {
      alert(err.message)
    }
  }

  const copyEmbedCode = (formId) => {
    const embedCode = `<iframe id="euroform-${formId}" src="${window.location.origin}/form/${formId}" width="100%" style="border:none;" frameborder="0" scrolling="no"></iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data.type === 'euroform-resize') {
    document.getElementById('euroform-${formId}').style.height = e.data.height + 'px';
  }
});
</script>`
    navigator.clipboard.writeText(embedCode)
    alert('Embed code copied to clipboard!')
  }

  // Show loading only on initial load or when auth is loading
  if ((loading && initialLoad) || authLoading) {
    return <Loading message="Loading dashboard..." />
  }

  return (
    <Layout>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => {
                setError('')
                setLoading(true)
                fetchForms()
              }}
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <PageHeader 
        title="Dashboard"
        searchField={
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
              style={{ 
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        }
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <FormCardSkeleton key={index} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState />
      ) : filteredForms.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No forms found
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            No forms match your search query "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredForms.map((form) => (
            <FormCard
              key={form.id}
              form={form}
              onDelete={deleteForm}
              onCopyEmbed={copyEmbedCode}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}

export default Dashboard
