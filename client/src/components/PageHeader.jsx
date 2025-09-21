import { Link } from 'react-router-dom'

const PageHeader = ({ title, actionText, actionLink }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h1>
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
  )
}

export default PageHeader
