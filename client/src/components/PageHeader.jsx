import { Link } from 'react-router-dom'

const PageHeader = ({ title, actionText, actionLink, searchField }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
        <div className="flex items-center gap-4">
          {searchField && searchField}
          {actionText && actionLink && (
            <Link 
              to={actionLink} 
              className="text-sm font-medium hover:underline" 
              style={{ color: 'var(--text-secondary)' }}
            >
              {actionText}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default PageHeader
