import { NavLink } from 'react-router-dom';
import { USER_NAV_ITEMS } from './navItems';

/** Mobile bottom navigation (in normal document flow, so it never covers the composer). */
export default function BottomNavigation({ badges = {} }) {
  return (
    <nav aria-label="Main" className="border-t border-slate-200 bg-white pb-safe lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {USER_NAV_ITEMS.map(({ to, label, icon: Icon, badgeKey }) => {
          const count = badgeKey ? badges[badgeKey] : 0;
          return (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition ${isActive ? 'text-navy-900' : 'text-slate-400 hover:text-slate-600'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`relative flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? 'bg-navy-50' : ''}`}>
                      <Icon className="size-5" aria-hidden="true" />
                      {count > 0 && (
                        <span className="absolute -top-0.5 right-1 flex min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] leading-4 text-white">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
