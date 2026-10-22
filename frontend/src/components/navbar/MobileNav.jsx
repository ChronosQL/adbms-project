import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { navLinks } from '../../config/navConfig';
import { Link } from 'react-router-dom';
const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  

  return (
    <div className="lg:hidden">

      {/* Toggle */}
      <button onClick={() => { setOpen(!open); setActiveDropdown(null); } }>
        {open ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Menu */}
      <div className={`absolute top-16 left-0 w-full bg-white shadow-md transition-all duration-500 ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>

        <div className="p-5 space-y-4">

          {navLinks.map((link, index) => (
            <div key={link.label}>

              {/* Main */}
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  link.children
                    ? setActiveDropdown(activeDropdown === index ? null : index)
                    : setOpen(false)
                }
              >
                <Link to={link.path} className="text-[#EF8354] hover:text-[#4F5D75] font-semibold">
                  {link.label}
                </Link>
                {link.children && <span>▼</span>}
              </div>

              {/* Dropdown */}
              {link.children && activeDropdown === index && (
                <div className="ml-4 mt-2 space-y-2 animate-fadeIn">
                  {link.children.map((child) => (
                    <Link
                      key={child.label}
                      to={child.path}
                      onClick={() => setOpen(false)}
                      className="block text-sm text-[#EF8354] hover:text-[#4F5D75]"
                    >
                      {child.label}
                    </Link>
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