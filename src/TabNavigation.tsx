export type TabType = 'private' | 'public'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  isAuthenticated?: boolean
}

export function TabNavigation({ activeTab, onTabChange, isAuthenticated = false }: TabNavigationProps) {
  const allTabs = [
    { id: 'private' as TabType, label: 'My Recipes', description: 'Your private recipes' },
    { id: 'public' as TabType, label: 'Public Recipes', description: 'Shared community recipes' }
  ]

  // Only show private tab if authenticated, always show public tab
  const tabs = isAuthenticated ? allTabs : allTabs.filter(tab => tab.id === 'public')

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === tab.id
                ? 'border-saucier-blue text-saucier-blue'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="font-medium">{tab.label}</div>
              <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
            </div>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default TabNavigation