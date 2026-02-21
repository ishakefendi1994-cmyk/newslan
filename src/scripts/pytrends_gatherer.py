import sys
import json
from pytrends.request import TrendReq

def get_trending_keywords(geo='ID', category=0, hl='id-ID'):
    """
    Fetch trending search keywords from Google Trends.
    """
    try:
        pytrends = TrendReq(hl=hl, tz=420)
        
        # Mapping common geo codes to TrendReq expected strings
        pn_map = {
            'ID': 'indonesia',
            'US': 'united_states',
            'MY': 'malaysia',
            'SG': 'singapore',
            'GB': 'united_kingdom',
            'AU': 'australia'
        }
        
        pn = pn_map.get(geo.upper(), geo.lower())
        
        # 1. Try Daily Trending Searches
        try:
            df = pytrends.trending_searches(pn=pn)
            if not df.empty:
                return df[0].tolist()[:5]
        except:
            pass

        # 2. Try Real-time Trending if Daily fails
        try:
            df_rt = pytrends.realtime_trending_searches(pn=geo.upper())
            if not df_rt.empty:
                return df_rt['title'].tolist()[:5]
        except:
            pass

        # 3. Last Resort Fallback: Direct Google News RSS Headlines
        try:
            import urllib.request
            import re
            
            # Use specific region/language for headlines
            hl_param = hl.split('-')[0]
            gl_param = geo.upper()
            rss_url = f"https://news.google.com/rss?hl={hl_param}&gl={gl_param}&ceid={gl_param}:{hl_param}"
            
            with urllib.request.urlopen(rss_url, timeout=10) as response:
                html = response.read().decode('utf-8')
                # Extract titles using regex
                titles = re.findall(r'<title>(.*?)</title>', html)
                
                # Blacklist of generic titles
                blacklist = ['Google News', 'Google Berita', 'Berita Google']
                
                keywords = []
                for t in titles:
                    # Clean title: strip source suffix
                    clean = re.sub(r' - .*?$', '', t)
                    # Skip generic ones
                    if any(b.lower() in clean.lower() for b in blacklist):
                        continue
                    if clean and len(clean) > 15:
                        keywords.append(clean)
                    if len(keywords) >= 5: break
                return keywords
        except Exception as rss_err:
            print(f"RSS Fallback Error: {str(rss_err)}", file=sys.stderr)

        return []
    except Exception as e:
        print(f"Top Level Error: {str(e)}", file=sys.stderr)
        return []

if __name__ == "__main__":
    # Default parameters
    geo = sys.argv[1] if len(sys.argv) > 1 else 'ID'
    niche_str = sys.argv[2] if len(sys.argv) > 2 else 'any'
    
    # Map niche to category IDs
    # 0: all, 16: tech, 12: business, 17: sports, 18: entertainment, 15: science, 7: health
    niche_map = {
        'any': 0,
        'technology': 16,
        'business': 12,
        'sports': 17,
        'entertainment': 18,
        'science': 15,
        'health': 7,
        'products': 0 # Products often falls under general trends or multiple categories
    }
    
    category = niche_map.get(niche_str.lower(), 0)
    
    trends = get_trending_keywords(geo=geo, category=category)
    print(json.dumps(trends))
