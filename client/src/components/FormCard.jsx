import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Trash2, ExternalLink, Copy, MessageSquare, Hash, MoreHorizontal } from 'lucide-react'

const FormCard = ({ form, onDelete, onCopyEmbed }) => {
  const [showDropdown, setShowDropdown] = useState(false)

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="p-2 bg-gray-100 rounded-lg mr-4 flex-shrink-0">
            <FileText className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
          </div>
          
          <div className="flex-1 min-w-0">
            <Link 
              to={`/forms/${form.id}`}
              className="text-base font-semibold hover:underline transition-all duration-200 truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {form.name}
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-4 flex-shrink-0">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            form.is_active 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {form.is_active ? 'Active' : 'Inactive'}
          </span>
          
          <span className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Hash className="h-3.5 w-3.5 mr-1" />
            {form.fields?.length || 0} Fields
          </span>
          
          <span className="flex items-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            {form.submission_count || 0} Submissions
          </span>


          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-50"
              style={{ color: 'var(--text-secondary)' }}
              title="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  onClick={() => {
                    onCopyEmbed(form.id)
                    setShowDropdown(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Copy className="h-4 w-4 mr-3" />
                  Copy Embed Code
                </button>
                <a
                  href={`/form/${form.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50"
                  style={{ color: 'var(--text-primary)' }}
                  onClick={() => setShowDropdown(false)}
                >
                  <ExternalLink className="h-4 w-4 mr-3" />
                  Preview Form
                </a>
                <button
                  onClick={() => {
                    onDelete(form.id)
                    setShowDropdown(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm hover:bg-red-50 text-red-600 rounded-b-lg"
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  Delete Form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default FormCard
