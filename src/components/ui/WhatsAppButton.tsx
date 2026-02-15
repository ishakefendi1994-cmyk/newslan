'use client'

import { MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function WhatsAppButton() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Show button after a short delay or scroll
        const timer = setTimeout(() => setIsVisible(true), 1000)
        return () => clearTimeout(timer)
    }, [])

    const phoneNumber = '6282378865775'
    const message = encodeURIComponent('Halo Newslan, saya mau pesan tiket bus')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

    if (!isVisible) return null

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 lg:bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 group animate-in slide-in-from-bottom-4"
            aria-label="Chat via WhatsApp"
        >
            <MessageCircle className="w-6 h-6 fill-white" />
            <span className="font-bold whitespace-nowrap hidden group-hover:block transition-all duration-300 max-w-0 group-hover:max-w-xs overflow-hidden">
                Pesan Tiket Bus
            </span>
            <span className="font-bold whitespace-nowrap block group-hover:hidden">
                Tiket Bus
            </span>
        </a>
    )
}
