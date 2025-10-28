import { Helmet } from "react-helmet-async";

interface Article {
  title: string;
  excerpt?: string;
  meta_description?: string;
  image_url?: string;
  featured_image?: string;
  published_at: string;
  created_at: string;
  date_modified?: string;
  updated_at: string;
  author?: string;
  category: string;
  meta_keywords?: string[];
  word_count?: number;
  slug: string;
  views_count?: number;
}

interface SchemaOrgProps {
  type: 'website' | 'article' | 'category';
  article?: Article;
  categoryName?: string;
  url?: string;
}

export const SchemaOrg = ({ type, article, categoryName, url }: SchemaOrgProps) => {
  const baseUrl = "https://www.cardinal-news.com";
  const currentUrl = url || window.location.href;

  // Organization Schema - appears on all pages
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    "@id": `${baseUrl}/#organization`,
    "name": "Cardinal News",
    "alternateName": "Cardinal News Network",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "@id": `${baseUrl}/#logo`,
      "url": `${baseUrl}/logo.png`,
      "width": 600,
      "height": 60,
      "caption": "Cardinal News Logo"
    },
    "image": {
      "@id": `${baseUrl}/#logo`
    },
    "description": "Cardinal News delivers real-time breaking news, in-depth analysis, and comprehensive coverage of world events, business, technology, sports, politics, and more. Your trusted source for AI-powered journalism.",
    "sameAs": [
      "https://twitter.com/cardinalnews",
      "https://facebook.com/cardinalnews",
      "https://linkedin.com/company/cardinalnews"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Editorial",
      "email": "editorial@cardinal-news.com"
    },
    "foundingDate": "2024",
    "publishingPrinciples": `${baseUrl}/about/editorial-standards`,
    "diversityPolicy": `${baseUrl}/about/diversity`,
    "ethicsPolicy": `${baseUrl}/about/ethics`,
    "masthead": `${baseUrl}/about/team`
  };

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    "url": baseUrl,
    "name": "Cardinal News",
    "description": "Breaking news, analysis, and insights on world events, technology, business, and more",
    "publisher": {
      "@id": `${baseUrl}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "en-US"
  };

  // Article Schema with comprehensive NewsArticle markup
  const getArticleSchema = () => {
    if (!article) return null;

    const articleUrl = `${baseUrl}/article/${article.slug}`;
    
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "@id": `${articleUrl}#article`,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      },
      "headline": article.title,
      "description": article.excerpt || article.meta_description,
      "image": {
        "@type": "ImageObject",
        "url": article.image_url || article.featured_image,
        "width": 1200,
        "height": 675
      },
      "datePublished": article.published_at || article.created_at,
      "dateModified": article.date_modified || article.updated_at,
      "dateCreated": article.created_at,
      "author": {
        "@type": "Person",
        "name": article.author || "Cardinal AI",
        "url": `${baseUrl}/author/${(article.author || 'cardinal-ai').toLowerCase().replace(/\s+/g, '-')}`
      },
      "publisher": {
        "@id": `${baseUrl}/#organization`
      },
      "isAccessibleForFree": "True",
      "isPartOf": {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`
      },
      "articleSection": article.category,
      "keywords": article.meta_keywords?.join(", "),
      "wordCount": article.word_count,
      "inLanguage": "en-US",
      "copyrightYear": new Date(article.published_at || article.created_at).getFullYear(),
      "copyrightHolder": {
        "@id": `${baseUrl}/#organization`
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".article-content"]
      },
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ReadAction",
        "userInteractionCount": article.views_count || 0
      }
    };
  };

  // Breadcrumb Schema
  const getBreadcrumbSchema = () => {
    if (type === 'website') return null;

    const items = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      }
    ];

    if (type === 'category' && categoryName) {
      items.push({
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": currentUrl
      });
    }

    if (type === 'article' && article) {
      items.push(
        {
          "@type": "ListItem",
          "position": 2,
          "name": article.category,
          "item": `${baseUrl}/category/${article.category.toLowerCase().replace('_', '-')}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": article.title,
          "item": `${baseUrl}/article/${article.slug}`
        }
      );
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": items
    };
  };

  // Collection Page Schema for Category pages
  const getCollectionPageSchema = () => {
    if (type !== 'category' || !categoryName) return null;

    return {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${currentUrl}#webpage`,
      "url": currentUrl,
      "name": `${categoryName} News - Cardinal News`,
      "description": `Latest ${categoryName.toLowerCase()} news, analysis, and updates from Cardinal News`,
      "isPartOf": {
        "@id": `${baseUrl}/#website`
      },
      "about": {
        "@type": "Thing",
        "name": categoryName
      },
      "inLanguage": "en-US"
    };
  };

  const allSchemas = [];
  
  allSchemas.push(organizationSchema);
  allSchemas.push(websiteSchema);
  
  const articleSchema = getArticleSchema();
  if (articleSchema) allSchemas.push(articleSchema);
  
  const breadcrumbSchema = getBreadcrumbSchema();
  if (breadcrumbSchema) allSchemas.push(breadcrumbSchema);
  
  const collectionSchema = getCollectionPageSchema();
  if (collectionSchema) allSchemas.push(collectionSchema);

  return (
    <Helmet>
      {allSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};
