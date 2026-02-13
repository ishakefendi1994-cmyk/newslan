'use client'

import { useState } from 'react'
import { Check, Zap, Shield, Rocket } from 'lucide-react'

export default function SubscribePage() {
    const [loading, setLoading] = useState(false)

    const plans = [
        {
            name: "Monthly",
            price: "Rp 49.000",
            amount: 49000,
            description: "Akses penuh selama 30 hari.",
            features: ["Akses semua artikel premium", "Tanpa iklan", "Konten video eksklusif", "Badge member khusus"]
        },
        {
            name: "Yearly",
            price: "Rp 450.000",
            amount: 450000,
            description: "Lebih hemat 25% setiap tahun.",
            features: ["Semua fitur Monthly", "Prioritas dukungan", "Undangan webinar", "Early access produk terbaru"],
            isPopular: true
        }
    ]

    const handleSubscribe = async (amount: number, planName: string) => {
        setLoading(true)
        // Perform checkout logic via API route
        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, planName }),
            })
            const data = await res.json()
            if (data.paymentUrl) {
                window.location.href = data.paymentUrl
            } else {
                alert("Gagal membuat transaksi. Cek konfigurasi Duitku.")
            }
        } catch (err) {
            console.error(err)
            alert("Terjadi kesalahan teknis.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="text-center space-y-4 mb-16">
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter">Pilih Paket <span className="text-primary italic">Kebebasanmu</span></h1>
                <p className="text-gray-500 max-w-2xl mx-auto">Dukung jurnalisme berkualitas dan dapatkan akses penuh ke seluruh ekosistem NEWSLAN.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative p-8 rounded-3xl border-2 transition-all hover:scale-[1.02] ${plan.isPopular ? 'border-primary shadow-2xl shadow-primary/10' : 'border-gray-100'
                            }`}
                    >
                        {plan.isPopular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                Paling Populer
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black italic">{plan.name}</h2>
                                <div className="flex items-baseline space-x-1">
                                    <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                                    <span className="text-gray-400 text-sm font-medium">/{plan.name === 'Yearly' ? 'tahun' : 'bulan'}</span>
                                </div>
                                <p className="text-gray-500 text-sm">{plan.description}</p>
                            </div>

                            <div className="space-y-4">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center space-x-3">
                                        <div className="bg-primary/10 p-1 rounded-full">
                                            <Check className="w-3 h-3 text-primary stroke-[3px]" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                disabled={loading}
                                onClick={() => handleSubscribe(plan.amount, plan.name)}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-tighter transition-all ${plan.isPopular
                                        ? 'bg-primary text-white hover:bg-primary/90'
                                        : 'bg-black text-white hover:bg-black/90'
                                    } disabled:opacity-50`}
                            >
                                {loading ? 'Processing...' : 'Subscribe Sekarang'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: Zap, title: "Instan", desc: "Akses terbuka segera setelah pembayaran berhasil." },
                    { icon: Shield, title: "Aman", desc: "Didukung oleh Duitku.com dengan enkripsi standar industri." },
                    { icon: Rocket, title: "Update Terus", desc: "Dapatkan info breaking news & produk viral paling awal." },
                ].map((item, i) => (
                    <div key={i} className="flex space-x-4 items-start bg-gray-50 p-6 rounded-2xl">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <item.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold">{item.title}</h4>
                            <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
