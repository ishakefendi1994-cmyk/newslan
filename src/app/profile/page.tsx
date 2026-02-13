'use client'

import { User, Settings, CreditCard, ChevronRight, LogOut, Bell, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            {/* Header */}
            <div className="bg-black text-white p-8 pt-12 rounded-b-[3rem] shadow-2xl">
                <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 rounded-full bg-primary border-4 border-white/20 flex items-center justify-center font-black text-3xl">
                        N
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Newslan Guest</h1>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Member Gold</p>
                    </div>
                </div>
            </div>

            {/* Menu */}
            <div className="p-6 space-y-6 -mt-10">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="p-4 space-y-2">
                        <MenuItem icon={Bell} title="Notifikasi" color="text-blue-500" />
                        <MenuItem icon={CreditCard} title="Langganan Saya" color="text-green-500" />
                        <MenuItem icon={Shield} title="Keamanan Akun" color="text-purple-500" />
                        <MenuItem icon={Settings} title="Pengaturan" color="text-gray-500" />
                    </div>
                </div>

                <button className="w-full bg-white text-red-600 p-6 rounded-3xl font-black uppercase text-sm tracking-widest flex items-center justify-center space-x-3 shadow-lg border border-red-50 hover:bg-red-50 transition-all">
                    <LogOut className="w-5 h-5" />
                    <span>Keluar Akun</span>
                </button>
            </div>
        </div>
    )
}

function MenuItem({ icon: Icon, title, color }: any) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer group">
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-xl bg-gray-50 ${color} group-hover:bg-white border border-transparent group-hover:border-gray-100 transition-all`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="font-black text-gray-700 uppercase tracking-tighter text-sm">{title}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-all" />
        </div>
    )
}
