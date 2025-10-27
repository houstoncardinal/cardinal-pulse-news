# Advanced Article Editor Features

## Overview
The Advanced Article Editor is a professional-grade content management interface designed for creating, editing, and publishing news articles with rich media, SEO optimization, and citation management.

## Key Features

### 1. **Content Editor**
- **Rich Text Editing**: Full-featured WYSIWYG editor powered by Quill
  - Headers (H1-H6)
  - Text formatting (bold, italic, underline, strikethrough)
  - Lists (ordered and unordered)
  - Color and background highlighting
  - Blockquotes and code blocks
  - Hyperlinks
  
- **Article Metadata**:
  - Title with character counter
  - Excerpt/summary
  - Category selection (9 categories)
  - Author attribution
  - Tag system with add/remove functionality

### 2. **Media Management**
- **Image Upload**:
  - Direct upload to Supabase Storage
  - 5MB file size limit with validation
  - Automatic public URL generation
  - Alternative: Manual URL entry
  
- **Image Attribution**:
  - Credit field for photographer/source
  - Essential for legal compliance

### 3. **SEO Optimization**
- **Meta Title**:
  - 60 character limit with counter
  - Optimized for search engines
  
- **Meta Description**:
  - 160 character limit with counter
  - Preview snippet in search results
  
- **Keywords**:
  - Dynamic keyword management
  - Add/remove tags system
  - Improves discoverability

### 4. **Source & Citation Management**
- **Reference System**:
  - Add multiple sources
  - Name and URL fields
  - Easy removal of sources
  
- **Display**:
  - Sources displayed at article end
  - Linked for verification
  - Professional citation format

### 5. **Live Preview**
- **Real-time Rendering**:
  - See exactly how article will appear
  - Formatted with professional styling
  - Includes all metadata and images
  
- **Preview Features**:
  - Category badge
  - Featured image
  - Author byline
  - Formatted content
  - Source list

### 6. **Publishing Workflow**
- **Save as Draft**: Work in progress without publishing
- **Publish Now**: Instant publication to live site
- **Auto-save indicators**: Never lose work
- **Real-time updates**: Changes sync across dashboard

## Technical Specifications

### Storage
- **Bucket**: `article-images`
- **Access**: Public read, authenticated write
- **Format Support**: JPG, PNG, WEBP, GIF
- **Max Size**: 5MB per image

### Rich Text Editor
- **Library**: React Quill v2.0
- **Theme**: Snow (clean, professional)
- **Custom Styling**: Integrated with app design system
- **Toolbar**: Full-featured with common formatting options

### Data Structure
```typescript
interface Article {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  meta_title: string;
  meta_description: string;
  meta_keywords: string[];
  image_url: string;
  image_credit: string;
  sources: { name: string; url: string }[];
  author: string;
  word_count: number;
  status: 'draft' | 'published';
}
```

### Real-time Features
- WebSocket-based updates
- Live article list refresh
- Instant publish-to-frontend
- No page refresh needed

## Best Practices

### Content Creation
1. Start with a compelling title (60 chars or less)
2. Write engaging excerpt (2-3 sentences)
3. Use headers to structure content
4. Add relevant images with credits
5. Include 3-5 tags for categorization

### SEO Optimization
1. Meta title should include main keyword
2. Meta description should entice clicks
3. Use 5-10 relevant keywords
4. Optimize images (file size and alt text)
5. Include internal/external links

### Citation Management
1. Add sources as you write
2. Include authoritative sources
3. Verify all URLs work
4. Credit all images and data
5. Update sources if content changes

### Publishing
1. Review in Preview tab first
2. Check all fields are complete
3. Verify SEO metadata
4. Ensure images load properly
5. Save draft before publishing

## Keyboard Shortcuts
- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + U**: Underline
- **Enter**: Add tag/keyword/source
- **Tab**: Navigate between fields

## Troubleshooting

### Image Upload Issues
- Check file size (must be < 5MB)
- Verify file format (JPG, PNG, WEBP)
- Ensure storage bucket is accessible
- Check network connection

### Formatting Problems
- Clear browser cache
- Refresh editor
- Copy content and re-paste
- Check for unsupported HTML

### Save/Publish Failures
- Verify all required fields filled
- Check network connection
- Review console for errors
- Try saving as draft first

## Future Enhancements
- Collaborative editing
- Version history
- Scheduled publishing
- A/B testing for headlines
- Analytics integration
- AI-powered suggestions
- Multi-language support
