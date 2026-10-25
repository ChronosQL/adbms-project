import { NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { navLinks } from '../../config/navConfig';

const DesktopNav = () => (
  <div className="hidden lg:flex items-center gap-10">
    {navLinks.map((link) => (
      <div key={link.label} className="relative group">
        <NavLink
          to={link.path}
          end={link.path === '/'}
          className={({ isActive }) =>
            `relative flex items-center gap-1.5 py-2 font-bold text-base transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF8354]/50 focus-visible:ring-offset-4 rounded-sm ${
              isActive ? 'text-[#EF8354]' : 'text-[#4F5D75] hover:text-[#EF8354]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {link.label}
              {link.children && (
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isActive ? 'text-[#EF8354]' : ''} group-hover:rotate-180`}
                />
              )}
              <span
                aria-hidden="true"
                className={`absolute -bottom-0.5 left-0 h-0.5 rounded-full bg-[#EF8354] transition-all duration-200 ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </>
          )}
        </NavLink>

        {link.children && (
          <div className="absolute left-0 top-[140%] z-50 w-56 translate-y-2 scale-95 rounded-2xl border border-[#BFC0C0]/30 bg-white py-2 opacity-0 invisible shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:scale-100 group-focus-within:opacity-100">
            {link.children.map((child) => (
              <NavLink
                key={child.label}
                to={child.path}
                className={({ isActive }) =>
                  `block border-l-2 px-5 py-3 text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'border-[#EF8354] bg-[#EF8354]/10 text-[#2D3142]'
                      : 'border-transparent text-[#4F5D75] hover:bg-[#EF8354]/5 hover:text-[#EF8354]'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
);

export default DesktopNav;
