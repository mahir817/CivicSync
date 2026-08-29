import { Link } from 'react-router-dom';
import indexImg from '../assets/index.png';

export default function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-transparent">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 w-full">
        <div className="flex-1 space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800">CivicSync</h1>
          <p className="text-xl text-slate-600 max-w-lg">
            Your all-in-one verified community platform where blood, pet care, charity, and disaster relief requests gets public attention 
          </p>
          <div className="flex gap-4 pt-4">
            <Link 
              to="/register" 
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold transition-colors shadow-lg shadow-emerald-600/30">
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="px-6 py-3 bg-white hover:bg-slate-50 text-emerald-700 border-2 border-emerald-600 rounded-full font-semibold transition-colors">
              Login
            </Link>
          </div>
        </div>
        <div className="flex-1">
          <img 
            src={indexImg} 
            alt="Students jumping joyfully" 
            className="w-full max-w-2xl mx-auto drop-shadow-2xl mix-blend-multiply" 
          />
        </div>
      </div>
    </div>
  );
}
