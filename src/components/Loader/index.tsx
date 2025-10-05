import { LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Loader = ({ loading, className = '' }) => {
  if (!loading) return null;

  return (
    <div
      className={`flex items-center justify-center bg-slate-100 z-50 ${className} absolute inset-0`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <LoaderCircle className="w-10 h-10 text-black animate-spin" />
      </motion.div>
    </div>
  );
};

export default Loader;
