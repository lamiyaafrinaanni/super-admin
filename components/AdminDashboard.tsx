
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Megaphone, Banknote, LayoutDashboard, Bot } from './Icons';

const MOCK_CHART_DATA = [
  { name: 'Mon', ads: 4, spend: 240 },
  { name: 'Tue', ads: 3, spend: 139 },
  { name: 'Wed', ads: 2, spend: 980 },
  { name: 'Thu', ads: 7, spend: 390 },
  { name: 'Fri', ads: 5, spend: 480 },
  { name: 'Sat', ads: 9, spend: 380 },
  { name: 'Sun', ads: 6, spend: 430 },
];

const ActivityChart = () => <LayoutDashboard className="w-6 h-6" />;

export const AdminDashboard: React.FC<{ clientCount: number, onOpenChat?: () => void }> = React.memo(({ clientCount, onOpenChat }) => {
  return (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 xl:gap-4">
                    <div className="p-2 md:p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <Users className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Total Clients</p>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{clientCount}</h3>
                    </div>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 xl:gap-4">
                    <div className="p-2 md:p-3 bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl">
                        <Megaphone className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Active Ads</p>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">12</h3>
                    </div>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 xl:gap-4">
                    <div className="p-2 md:p-3 bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl">
                        <Banknote className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Total Revenue</p>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">$12,450</h3>
                    </div>
                </div>
            </div>
             <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition-all duration-200">
                <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 xl:gap-4">
                    <div className="p-2 md:p-3 bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-xl">
                        <ActivityChart />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">Growth</p>
                        <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">+24%</h3>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-indigo-600 rounded-xl p-6 shadow-md text-white flex justify-between items-center relative overflow-hidden">
             <div className="relative z-10">
                 <h2 className="text-xl font-bold flex items-center gap-2"><Bot className="w-6 h-6"/> Admin AI Assistant</h2>
                 <p className="text-indigo-100 mt-1 max-w-lg text-sm">Generate client reports, draft ad copies, or analyze revenue trends.</p>
             </div>
             <button 
                onClick={onOpenChat}
                className="bg-white text-indigo-600 px-5 py-2.5 rounded-lg font-bold shadow hover:bg-gray-100 transition-colors z-10 flex items-center gap-2"
             >
                 <Bot className="w-5 h-5"/> Launch AI
             </button>
        </div>
        
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Revenue Overview</h3>
                 <div className="h-80 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_CHART_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(value) => `$${value}`}/>
                            <Tooltip 
                                cursor={{fill: 'rgba(128,128,128,0.1)'}} 
                                contentStyle={{borderRadius: '8px', border: 'none', background: '#1e293b', color: 'white'}}
                            />
                            <Bar dataKey="spend" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
             </div>
             
             <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Ad Performance</h3>
                 <div className="h-80 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_CHART_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}}/>
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', background: '#1e293b', color: 'white'}}/>
                            <Line type="monotone" dataKey="ads" stroke="#d946ef" strokeWidth={3} dot={{r: 4, fill: '#d946ef', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                        </LineChart>
                     </ResponsiveContainer>
                 </div>
             </div>
         </div>
    </div>
  );
});
