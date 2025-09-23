const FormCardSkeleton = () => {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4 flex-shrink-0"></div>
          
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-4 flex-shrink-0">
          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default FormCardSkeleton
