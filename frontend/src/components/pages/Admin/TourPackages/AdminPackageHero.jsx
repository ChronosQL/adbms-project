const AdminPackageHero = ({ total, onAddNew, dark = false }) => (
  <div className="max-w-[1320px] mx-auto px-6 pt-6">
    <div
      className={[
        'rounded-2xl border p-6 md:p-7',
        dark ? 'bg-[#383C4E] border-white/10' : 'bg-white border-[#E8E8EA] shadow-sm',
      ].join(' ')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className={`font-extrabold text-[28px] leading-tight ${dark ? 'text-[#F5F5F6]' : 'text-[#2D3142]'}`}>
            Package Management
          </h1>
          <p className={`text-[13px] mt-2 ${dark ? 'text-[#B7BAC7]' : 'text-[#4F5D75]'}`}>
            Create, edit and delete tour packages. Changes reflect instantly on the user site.
          </p>

          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { n: total, l: 'Total Packages' },
              { n: '6', l: 'Types' },
              { n: '4', l: 'Durations' },
            ].map(({ n, l }) => (
              <div
                key={l}
                className={[
                  'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border',
                  dark ? 'bg-white/5 border-white/10' : 'bg-[#F7F7F8] border-[#EEEEF0]',
                ].join(' ')}
              >
                <span className="text-[14px] font-extrabold text-[#EF8354] leading-none">{n}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-[#B7BAC7]' : 'text-[#4F5D75]'}`}>
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl bg-[#EF8354] text-white px-5 py-3 text-[12px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-[#d96e41] hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer shadow-sm"
          onClick={onAddNew}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add New Package
        </button>
      </div>
    </div>
  </div>
);

export default AdminPackageHero;