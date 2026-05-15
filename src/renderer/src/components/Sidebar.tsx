import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from './utils'
import { useState } from 'react'
import { useAppStore } from '../store/appStore'

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio', exact: true },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/ejercicios', icon: Dumbbell, label: 'Ejercicios' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const config = useAppStore((s) => s.config)

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-gray-900 dark:bg-gray-950 text-gray-100 transition-all duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center h-14 px-3 border-b border-gray-700', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Entrenamiento</p>
            {config?.trainerName && (
              <p className="text-xs text-gray-400 truncate">{config.trainerName}</p>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100',
                collapsed && 'justify-center px-2',
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center h-10 border-t border-gray-700 text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
