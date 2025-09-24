/**
 * Format a date for display in the UI
 * @param {string|Date} date - The date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'Never'
  
  const dateObj = new Date(date)
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  const now = new Date()
  const diffInMs = now - dateObj
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  // Show relative time for recent dates
  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }

  // For older dates, show formatted date
  const formatOptions = {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    ...options
  }

  return dateObj.toLocaleDateString('en-US', formatOptions)
}

/**
 * Format a date for display in form cards
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string optimized for cards
 */
export const formatCardDate = (date) => {
  return formatDate(date, { month: 'short', day: 'numeric' })
}
