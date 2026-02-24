import { getPageBySlug } from '@/lib/data'
import RedaksiFallback from '@/components/static-pages/RedaksiFallback'

export default async function RedaksiPage() {
    const dbPage = await getPageBySlug('redaksi')

    // If page exists in database, render dynamic content
    if (dbPage && dbPage.content) {
        return (
            <div className="bg-white min-h-screen py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-10">
                        {dbPage.title}
                    </h1>
                    <article
                        className="prose prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:italic prose-p:text-gray-600"
                        dangerouslySetInnerHTML={{ __html: dbPage.content }}
                    />
                </div>
            </div>
        )
    }

    return <RedaksiFallback />
}

function RoleGroup({ title, names, variant = 'default' }: { title: string, names: string[], variant?: 'default' | 'highlight' }) {
    return (
        <div className={`p-4 rounded-2xl transition-all ${variant === 'highlight' ? 'bg-primary/5 border border-primary/20 scale-105' : 'bg-gray-50'}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
            <div className="space-y-1">
                {names.map((name, i) => (
                    <p key={i} className={`text-sm font-black ${variant === 'highlight' ? 'text-black' : 'text-gray-800'}`}>{name}</p>
                ))}
            </div>
        </div>
    )
}

function RegionGroup({ title, list }: { title: string, list: string[] }) {
    return (
        <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary">{title}</h4>
            <ul className="space-y-2">
                {list.map((item, i) => (
                    <li key={i} className="text-[11px] font-medium text-gray-400 leading-tight pb-2 border-b border-white/5 last:border-none">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}
