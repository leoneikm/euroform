import { Link } from 'react-router-dom'
import { FileText, Plus } from 'lucide-react'

const EmptyState = () => {
  return (
    <div className="card text-center py-16">
      <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
        <FileText className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        No forms yet
      </h3>
      <p className="mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
        Create your first GDPR-compliant form and start collecting data
      </p>
      <Link
        to="/forms/create"
        className="btn-primary inline-flex items-center"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create First Form
      </Link>
    </div>
  )
}

export default EmptyState
