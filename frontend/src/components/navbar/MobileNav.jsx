import { useState } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navLinks } from '../../config/navConfig';

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const closeMenu = () => {
    setOpen(false);
    setActiveDropdown(null);
  };

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        onClick={() => { setOpen(!open); setActiveDropdown(null); }}
        className="rounded-lg p-2 text-[#2D3142] transition-colors hover:bg-[#EF8354]/10 hover:text-[#EF8354] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF8354]"
      >
        {open ? <X size={26} /> : <Menu size={26} />}
      </button>

      <div className={`absolute left-0 top-16 w-full overflow-hidden border-t border-[#BFC0C0]/30 bg-white shadow-lg transition-all duration-300 ${open ? 'max-h-[80vh] overflow-y-auto opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="space-y-1 p-4">
          {navLinks.map((link, index) => (
            <div key={link.label}>
              <div className="flex items-center gap-2">
                <NavLink
                  to={link.path}
                  end={link.path === '/'}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex-1 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-[#EF8354] bg-[#EF8354]/10 text-[#2D3142]'
                        : 'border-transparent text-[#4F5D75] hover:bg-[#EF8354]/5 hover:text-[#EF8354]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
                {link.children && (
                  <button
                    type="button"
                    aria-label={`${activeDropdown === index ? 'Collapse' : 'Expand'} ${link.label} links`}
                    aria-expanded={activeDropdown === index}
                    onClick={() => setActiveDropdown(activeDropdown === index ? null : index)}
                    className="rounded-lg p-2 text-[#4F5D75] transition-colors hover:bg-[#EF8354]/10 hover:text-[#EF8354]"
                  >
                    <ChevronDown size={16} className={`transition-transform ${activeDropdown === index ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {link.children && activeDropdown === index && (
                <div className="ml-4 mt-1 space-y-1 border-l border-[#BFC0C0]/50 pl-3">
                  {link.children.map((child) => (
                    <NavLink
                      key={child.label}
                      to={child.path}
                      onClick={closeMenu}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-[#EF8354]/10 font-semibold text-[#2D3142]'
                            : 'text-[#4F5D75] hover:bg-[#EF8354]/5 hover:text-[#EF8354]'
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
      </div>
    </div>
  );
};

export default MobileNav;
