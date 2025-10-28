# Cardinal News - SEO & Google News Setup Guide

## 🎯 Overview
This guide will help you get Cardinal News fully indexed by Google and approved for Google News.

## 📊 Current SEO Implementation Status

### ✅ Completed SEO Features

1. **Comprehensive Schema.org Markup**
   - NewsArticle schema on all articles
   - Organization schema (NewsMediaOrganization)
   - Website schema with SearchAction
   - BreadcrumbList for navigation
   - CollectionPage schema for categories

2. **Meta Tags Implementation**
   - Primary meta tags (title, description, keywords)
   - Open Graph tags for social sharing
   - Twitter Card tags
   - Google News-specific tags (news_keywords, standout)
   - Article-specific tags (published_time, modified_time)
   - Mobile optimization tags

3. **Sitemap Generation**
   - Main sitemap: `https://www.cardinal-news.com/functions/v1/generate-sitemap`
   - Google News sitemap: `https://www.cardinal-news.com/functions/v1/generate-sitemap?type=news`
   - Dynamic generation from database
   - Optimized priority and changefreq based on article age
   - News sitemap includes only articles from last 48 hours (Google News requirement)

4. **Robots.txt Configuration**
   - Located at `/public/robots.txt`
   - Optimized for Google News crawler
   - Proper sitemap references
   - Social media crawlers allowed

## 🚀 Setup Steps

### Step 1: Submit Sitemaps to Google Search Console

1. **Access Google Search Console**
   - Go to [Google Search Console](https://search.google.com/search-console)
   - Add property: `https://www.cardinal-news.com`
   - Verify ownership using one of these methods:
     - HTML file upload
     - HTML meta tag (add verification code to `index.html`)
     - Google Analytics
     - Google Tag Manager

2. **Submit Main Sitemap**
   - Navigate to Sitemaps section
   - Add: `https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/generate-sitemap`
   - Wait for Google to crawl (usually 24-48 hours)

3. **Submit Google News Sitemap**
   - Add: `https://uxmrmiuwpofulgfjckzy.supabase.co/functions/v1/generate-sitemap?type=news`
   - This sitemap updates every 5 minutes and includes only recent articles

### Step 2: Apply for Google News Publisher Center

1. **Prerequisites**
   - At least 50+ quality articles published
   - Consistent publishing schedule (automated via your system)
   - Clear authorship attribution (already implemented)
   - Original content (your AI-generated articles)
   - Contact information and about page

2. **Application Process**
   - Go to [Google News Publisher Center](https://publishercenter.google.com/)
   - Add your publication
   - Provide required information:
     - Publication name: Cardinal News
     - Website: https://www.cardinal-news.com
     - RSS feed (if available)
     - Description and topics covered
   - Submit for review (can take 2-4 weeks)

### Step 3: Verify Technical Requirements

1. **Page Speed**
   - Run [PageSpeed Insights](https://pagespeed.web.dev/)
   - Aim for 90+ score on mobile
   - Already optimized with lazy loading and proper asset management

2. **Mobile Friendliness**
   - Test at [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
   - Already responsive and mobile-optimized

3. **Rich Results Test**
   - Use [Rich Results Test](https://search.google.com/test/rich-results)
   - Verify NewsArticle schema is valid
   - Should show "NewsArticle" and "Organization" schemas

### Step 4: Monitoring & Maintenance

1. **Google Search Console Monitoring**
   - Check Index Coverage report weekly
   - Monitor for any crawl errors
   - Review Performance report for search impressions/clicks

2. **Sitemap Updates**
   - Sitemaps auto-generate from your database
   - Main sitemap: 1-hour cache
   - News sitemap: 5-minute cache
   - Google typically crawls news sitemaps every 15-30 minutes

3. **Schema Validation**
   - Periodically test new articles with Rich Results Test
   - Ensure all required fields are populated

## 🔍 SEO Best Practices Already Implemented

### Article-Level Optimization
- ✅ Unique, descriptive titles (60 characters max)
- ✅ Compelling meta descriptions (160 characters max)
- ✅ Single H1 tag per page
- ✅ Semantic HTML5 structure
- ✅ Descriptive image alt text
- ✅ Clean, readable URLs (slug-based)
- ✅ Internal linking (breadcrumbs, related articles)
- ✅ Social sharing buttons
- ✅ Article word count tracking
- ✅ Read time calculation

### Site-Wide Optimization
- ✅ Fast loading times (optimized images, lazy loading)
- ✅ Mobile-responsive design
- ✅ HTTPS enabled (via Lovable/Supabase)
- ✅ Canonical URLs to prevent duplicates
- ✅ Structured data on all pages
- ✅ XML sitemaps (main + news)
- ✅ Robots.txt configuration
- ✅ RSS feed reference

### Google News Specific
- ✅ NewsArticle schema
- ✅ Separate news sitemap (48-hour window)
- ✅ Published/modified dates
- ✅ Author attribution
- ✅ Article sections/categories
- ✅ News keywords
- ✅ Standout tag for major stories

## 📈 Expected Timeline

1. **Initial Indexing** (3-7 days)
   - Google discovers and crawls your site
   - Articles start appearing in regular search results

2. **Google News Approval** (2-4 weeks after application)
   - Manual review by Google
   - Focus on content quality, originality, and consistency

3. **Full Indexing** (4-8 weeks)
   - All pages crawled and indexed
   - Rich snippets showing in search results
   - Appearing in Google News feed

## 🛠️ Additional Recommendations

### Content Strategy
1. Publish consistently (your automation already does this)
2. Focus on trending topics (already implemented)
3. Maintain high editorial standards
4. Diverse content categories (already covered)

### Technical Enhancements
1. Add RSS feed for better syndication
2. Implement AMP (Accelerated Mobile Pages) for faster mobile loading
3. Add breadcrumb navigation (already implemented)
4. Consider adding related articles section

### Monitoring Tools
1. Google Search Console (primary)
2. Google Analytics (already integrated)
3. Bing Webmaster Tools (optional)
4. Check sitemap accessibility regularly

## 🎉 Current Advantages

Your site already has:
- ✅ Automated article generation (consistent publishing)
- ✅ Trending topic detection (relevant content)
- ✅ Multiple categories (diverse coverage)
- ✅ Professional design (user engagement)
- ✅ Real-time weather integration (unique value)
- ✅ View tracking (popularity signals)
- ✅ Comprehensive schema markup (rich snippets ready)

## 📞 Support Resources

- [Google News Publisher Help](https://support.google.com/news/publisher-center)
- [Google Search Central](https://developers.google.com/search)
- [Schema.org Documentation](https://schema.org/NewsArticle)
- [SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)

## 🚨 Important Notes

1. **Sitemap URLs**: Update all sitemap references from the edge function URL to your custom domain once configured
2. **Verification Codes**: Add Google/Bing verification codes to `index.html` when you receive them
3. **Content Quality**: While automated, ensure articles are factual and well-written
4. **Continuous Monitoring**: Check Search Console weekly for any issues

---

**Need Help?** Your SEO foundation is solid. Focus on consistent publishing and applying for Google News approval once you have 50+ quality articles.
