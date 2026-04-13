import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  logout,
  setAuthenticated,
  setOdooAdmin,
  updateUserData,
} from '@/redux/slices/AuthSlice';
import {
  setColorScheme,
  setLogo,
  setOdooCred,
  setProjectDetails,
} from '@/redux/slices/ProjectSlice';
import {
  setAppState,
  setNotificationCount,
  setModules,
} from '@/redux/slices/AppStateSlice';
import { selectUser } from '@/redux/slices/AuthSlice';
import { useNavigate } from 'react-router-dom';
import { callApi, callServerAPI } from '@/api';
import { toast } from 'sonner';
import { homeTiles } from '@/data';
import { Loader2, Target, Award, Grid3x3 } from 'lucide-react';
import { useMotionValue, useTransform, animate } from 'framer-motion';

// Removed useTargetAchievement mock hook as it is now being passed from Home component state

const fmt = (v: number) => {
  if (v >= 1_000_000) {
    return `PKR ${(v / 1_000_000).toFixed(2)}M`;
  }
  if (v >= 1_000) {
    return `PKR ${(v / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(v);
};

const AnimatedNumber = ({
  value,
  formatter = (v: number) => v.toFixed(1),
}: {
  value: number;
  formatter?: (v: number) => string;
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => formatter(latest));

  useEffect(() => {
    const animation = animate(count, value, {
      duration: 2,
      ease: [0.34, 1.56, 0.64, 1],
    });
    return animation.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};

// Minimal Neumorphic Arced Progress
const ArcGauge = ({ pct }: { pct: number }) => {
  const r = 80;
  const circ = Math.PI * r;

  // High-end gradient based on percentage
  const gradientId = 'arcGradient';
  const startColor = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#fb7185';
  const endColor = pct >= 80 ? '#059669' : pct >= 50 ? '#d97706' : '#e11d48';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width="220"
        height="120"
        viewBox="0 0 220 120"
        className="drop-shadow-lg overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track */}
        <path
          d={`M 30,110 A 80,80 0 0,1 190,110`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Glow */}
        <motion.path
          d={`M 30,110 A 80,80 0 0,1 190,110`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{
            strokeDashoffset: circ - (circ * Math.min(pct, 100)) / 100,
          }}
          transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
          filter="url(#softGlow)"
          className="opacity-60"
        />
        {/* Fill */}
        <motion.path
          d={`M 30,110 A 80,80 0 0,1 190,110`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{
            strokeDashoffset: circ - (circ * Math.min(pct, 100)) / 100,
          }}
          transition={{ duration: 2, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </svg>
      <div className="absolute -bottom-2 flex flex-col items-center">
        <span className="text-3xl font-extrabold text-slate-700">
          <AnimatedNumber value={pct} />%
        </span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Achieved
        </span>
      </div>
    </div>
  );
};

const TargetWidgetV4 = ({
  data,
  loading,
  user,
}: {
  data: {
    m_target: number;
    m_achievement: number;
    y_target: number;
    y_achievement: number;
  };
  loading: boolean;
  user: {
    is_territory_manager: boolean;
    territory_ids: number[];
    territories: {
      id: number;
      name: string;
    }[];
    region: {
      name: string;
    };
  };
}) => {
  const [view, setView] = useState<'monthly' | 'yearly'>('yearly');

  if (loading)
    return (
      <div className="w-full h-80 rounded-[3rem] bg-white flex items-center justify-center shadow-[15px_15px_30px_#d1d5db,_-15px_-15px_30px_#ffffff]">
        <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
      </div>
    );

  const target = view === 'monthly' ? data.m_target : data.y_target;
  const achievement =
    view === 'monthly' ? data.m_achievement : data.y_achievement;

  const pct = target > 0 ? (achievement / target) * 100 : 0;
  const colorClass =
    pct >= 80
      ? 'text-emerald-500'
      : pct >= 50
        ? 'text-amber-500'
        : 'text-rose-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full p-8 sm:p-12 rounded-[3rem] bg-white shadow-[15px_15px_35px_#cbd5e1,_-15px_-15px_35px_#ffffff] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 group hover:shadow-[20px_20px_40px_#cbd5e1,_-20px_-20px_40px_#ffffff] transition-shadow duration-500"
    >
      {/* Soft Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/60 blur-3xl rounded-full pointer-events-none"></div>

      <div className="flex-1 w-full space-y-8 z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Target vs Achievement
            </h2>
          </div>

          {/* Premium Toggle */}
          <div className="p-1.5 bg-slate-100/50 rounded-2xl flex items-center gap-1 shadow-inner border border-slate-200/50">
            <button
              onClick={() => setView('monthly')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                view === 'monthly'
                  ? 'bg-white text-slate-800 shadow-sm scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setView('yearly')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                view === 'yearly'
                  ? 'bg-white text-slate-800 shadow-sm scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div>
          <p className="text-slate-500 mt-3 font-medium text-base">
            Your {user?.is_territory_manager ? 'territory' : 'region'}{' '}
            {user?.is_territory_manager
              ? `${
                  user?.territories?.find(
                    (t: { id: number; name: string }) =>
                      t.id === user.territory_ids[0],
                  )?.name
                } `
              : `${user?.region?.name} `}
            is currently at{' '}
            <span className={`font-bold ${colorClass}`}>
              <AnimatedNumber value={pct} />%
            </span>{' '}
            of its <span className="lowercase">{view}</span> goal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Neumorphic Metric Card */}
          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="p-6 rounded-[2rem] bg-white shadow-[8px_8px_16px_#cbd5e1,_-8px_-8px_16px_#ffffff] hover:shadow-[inset_6px_6px_12px_#cbd5e1,inset_-6px_-6px_12px_#ffffff] transition-shadow duration-300 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white shadow-[4px_4px_8px_#cbd5e1,_-4px_-4px_8px_#ffffff] flex items-center justify-center">
                <Target className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Target
              </p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-4 tabular-nums tracking-tight">
              <AnimatedNumber value={target} formatter={fmt} />
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            className="p-6 rounded-[2rem] bg-white shadow-[8px_8px_16px_#cbd5e1,_-8px_-8px_16px_#ffffff] hover:shadow-[inset_6px_6px_12px_#cbd5e1,inset_-6px_-6px_12px_#ffffff] transition-shadow duration-300 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white shadow-[4px_4px_8px_#cbd5e1,_-4px_-4px_8px_#ffffff] flex items-center justify-center">
                <Award className={`w-5 h-5 ${colorClass}`} />
              </div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                Achieved
              </p>
            </div>
            <p
              className={`text-2xl font-extrabold mt-4 tabular-nums tracking-tight ${colorClass}`}
            >
              <AnimatedNumber value={achievement} formatter={fmt} />
            </p>
          </motion.div>
        </div>
      </div>

      <motion.div
        whileHover={{ scale: 1.05, rotate: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        className="w-full lg:w-96 shrink-0 flex items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-[inset_8px_8px_16px_#cbd5e1,inset_-8px_-8px_16px_#ffffff] z-10 h-64 relative"
      >
        <ArcGauge pct={pct} />
      </motion.div>
    </motion.div>
  );
};

const Home = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [modList, setModList] = useState<
    {
      code: string;
      name: string;
      icon: string;
      path: string;
      is_region_manager: boolean;
      title: string;
      is_territory_manager: boolean;
    }[]
  >([]);
  const navigate = useNavigate();
  const [targetData, setTargetData] = useState<{
    m_target: number;
    m_achievement: number;
    y_target: number;
    y_achievement: number;
  }>({
    m_target: 0,
    m_achievement: 0,
    y_target: 0,
    y_achievement: 0,
  });
  const [targetLoading, setTargetLoading] = useState(false);

  // console.log({ user });

  useEffect(() => {
    if (!user) return;
    setTargetLoading(true);

    // First fetch the current target configuration (month and year)
    callApi(
      'GET',
      '/others/target-months-and-years',
      null,
      (configResp) => {
        const { year_id, month_ids } = configResp.data || configResp;

        const data: {
          company_id: number;
          region_id?: number;
          territory_id?: number;
          year_id: number;
          month_ids: number[];
        } = {
          company_id: user.company_id,
          region_id: user.region_id,
          territory_id: user.territory_ids[0],
          year_id: year_id,
          month_ids: month_ids,
        };

        if (user.is_region_manager) {
          delete data.territory_id;
        }
        if (user.is_territory_manager) {
          delete data.region_id;
        }

        console.log({ data });

        // Then fetch the actual target vs achievement report
        callServerAPI(
          'POST',
          '/bm/target-vs-achievement-dashboard/report',
          {
            data,
          },
          (r: {
            data: {
              m_target: number;
              m_achievement: number;
              y_target: number;
              y_achievement: number;
            };
          }) => {
            setTargetLoading(false);
            setTargetData({
              m_target: r.data.m_target,
              m_achievement: r.data.m_achievement,
              y_target: r.data.y_target,
              y_achievement: r.data.y_achievement,
            });
          },
          (e) => {
            setTargetLoading(false);
            console.log({ e });
          },
          false,
          true,
        );
      },
      (err) => {
        setTargetLoading(false);
        console.log('Failed to fetch target config:', err);
      },
      false,
    );
  }, [user]);

  useEffect(() => {
    const onSuccess = (r) => {
      setLoading(false);
      dispatch(updateUserData(r.data));
      dispatch(setColorScheme(r.data.project.color_scheme));
      dispatch(
        setProjectDetails({
          title: r.data.project.heading,
          description: r.data.project.sub_heading,
        }),
      );
      dispatch(setOdooCred(r.data.project.odoo_configuration));
      dispatch(setOdooAdmin(r.data.odooAdmin));
      dispatch(setLogo(r.data.project.logo));
      dispatch(setAuthenticated(true));
    };
    const onError = () => {
      setLoading(false);
      toast.error('Failed to fetch user data.');
      dispatch(logout());
    };
    setLoading(true);
    callApi('GET', '/employee/' + user.id, null, onSuccess, onError);
    callApi(
      'GET',
      '/notifications/unread-count',
      null,
      (r) => dispatch(setNotificationCount(r.data)),
      () => {},
    );
    dispatch(setAppState(true));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const d =
      user?.permissions
        ?.filter((i) => i.permissions.includes('view'))
        ?.map((i) =>
          homeTiles.find(
            (t) => t?.code?.toLowerCase() === i?.module?.code?.toLowerCase(),
          ),
        )
        .filter(Boolean) || [];
    setModList(d);
    dispatch(setModules(d));
    // eslint-disable-next-line
  }, [user?.permissions]);

  console.log({ user });

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 lg:p-12 font-sans selection:bg-blue-100">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header - Soft */}
        <motion.header
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4"
        >
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
              Welcome,{' '}
              <span className="text-slate-400">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            </h1>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-white shadow-[6px_6px_12px_#cbd5e1,_-6px_-6px_12px_#ffffff]"
          >
            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></div>
            <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">
              System Active
            </span>
          </motion.div>
        </motion.header>

        {/* Big Widget */}
        <section>
          <TargetWidgetV4
            data={targetData}
            loading={targetLoading}
            user={user}
          />
        </section>

        {/* Modules */}
        <section>
          <div className="flex items-center justify-between mb-8 px-4">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              Applications
            </h3>
            <span className="px-4 py-2 rounded-full bg-white shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] text-slate-500 font-bold text-sm">
              {modList.length} Connected
            </span>
          </div>

          {loading ? (
            <div className="w-full h-64 rounded-[3rem] bg-white flex items-center justify-center shadow-[inset_15px_15px_30px_#cbd5e1,inset_-15px_-15px_30px_#ffffff]">
              <Loader2 className="w-12 h-12 text-slate-400 animate-spin" />
            </div>
          ) : modList.length === 0 ? (
            <div className="w-full h-64 rounded-[3rem] bg-white flex flex-col items-center justify-center shadow-[inset_15px_15px_30px_#cbd5e1,inset_-15px_-15px_30px_#ffffff]">
              <Grid3x3 className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold text-base">
                No Applications Configured
              </p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
              {modList.map((item, idx) => (
                <motion.button
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => item.path && navigate(item.path)}
                  className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] bg-white shadow-[10px_10px_20px_#cbd5e1,_-10px_-10px_20px_#ffffff] hover:shadow-[inset_8px_8px_16px_#cbd5e1,inset_-8px_-8px_16px_#ffffff] transition-all duration-300"
                >
                  <div className="w-20 h-20 mb-6 flex items-center justify-center rounded-3xl bg-white shadow-[8px_8px_16px_#cbd5e1,_-8px_-8px_16px_#ffffff] group-hover:shadow-[inset_4px_4px_8px_#cbd5e1,inset_-4px_-4px_8px_#ffffff] transition-all duration-300">
                    <img
                      src={item.icon}
                      alt={item.title}
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-base font-bold text-slate-600 uppercase tracking-widest">
                    {item.title}
                  </p>
                </motion.button>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
