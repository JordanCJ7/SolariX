import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'amber', subtitle, badge }) => {
  const colorMap = {
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      glow: 'group-hover:shadow-amber-500/10',
    },
    green: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    blue: {
      border: 'hover:border-sky-500/40',
      iconBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      glow: 'group-hover:shadow-sky-500/10',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'group-hover:shadow-purple-500/10',
    },
  };

  const current = colorMap[color] || colorMap.amber;

  return (
    <div
      className={`group glass-panel rounded-2xl p-6 transition-all duration-300 shadow-lg ${current.border} ${current.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${current.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-3xl font-extrabold text-white tracking-tight">
          {value !== undefined && value !== null ? value : '--'}
        </div>
        {badge && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
