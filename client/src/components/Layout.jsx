import Header from './Header'

const Layout = ({ children }) => {

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--secondary-bg)' }}>
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <main>{children}</main>
      </div>
    </div>
  )
}

export default Layout
