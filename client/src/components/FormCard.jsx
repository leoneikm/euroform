import { Link } from 'react-router-dom'
import { FileText, Eye, Edit, Trash2, ExternalLink, Copy, MessageSquare, Users } from 'lucide-react'

const FormCard = ({ form, onDelete, onCopyEmbed }) => {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <div className="p-2 bg-gray-100 rounded-lg mr-3">
              <FileText className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <Link 
              to={`/forms/${form.id}`}
              className="text-lg font-semibold hover:underline transition-all duration-200"
              style={{ color: 'var(--text-primary)' }}
            >
              {form.name}
            </Link>
          </div>
          {form.description && (
            <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              {form.description}
            </p>
          )}
          <div className="flex items-center text-sm flex-wrap gap-2">
            <span className="flex items-center px-2 py-1 rounded-full bg-gray-100" style={{ color: 'var(--text-secondary)' }}>
              <Users className="h-3.5 w-3.5 mr-1" />
              {form.fields?.length || 0} Fields
            </span>
            <span className="flex items-center px-2 py-1 rounded-full bg-gray-100" style={{ color: 'var(--text-secondary)' }}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              {form.submission_count || 0} Submissions
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              form.is_active 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {form.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="flex space-x-1">
          <Link
            to={`/forms/${form.id}`}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
            style={{ color: 'var(--text-secondary)' }}
            title="Manage Form"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={() => onCopyEmbed(form.id)}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
            style={{ color: 'var(--text-secondary)' }}
            title="Copy Embed Code"
          >
            <Copy className="h-4 w-4" />
          </button>
          <a
            href={`/form/${form.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
            style={{ color: 'var(--text-secondary)' }}
            title="Preview Form"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <button
          onClick={() => onDelete(form.id)}
          className="p-2 rounded-lg transition-all duration-200 hover:bg-red-50"
          style={{ color: 'var(--text-secondary)' }}
          title="Delete Form"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default FormCard
