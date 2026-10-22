const AdminPackageHero = ({ total, onAddNew, dark = false }) => (
  <div className="max-w-[1320px] mx-auto px-6 pt-6">
    <div
      className={[
        'rounded-2xl border p-6 md:p-7',
        dark ? 'bg-slate-800/60 border-white/8' : 'bg-white border-slate-100 shadow-sm',
      ].join(' ')}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          {/* <p className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            Admin Dashboard
          </p> */}
          <h1 className={`font-extrabold text-[28px] leading-tight ${dark ? 'text-slate-100' : 'text-slate-800'}`}>
            Package Management
          </h1>
          <p className={`text-[13px] mt-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border',
                  dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200',
                ].join(' ')}
              >
                <span className="text-[14px] font-extrabold text-[#00b0a5] leading-none">{n}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {l}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl bg-[#00b0a5] text-white px-5 py-3 text-[12px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-[#009e94] hover:-translate-y-0.5"
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