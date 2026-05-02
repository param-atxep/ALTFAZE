export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  excerpt?: string;
  image?: string;
  author: string;
  category: string;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export function generateBlogExcerpt(content: string, length: number = 160): string {
  // Remove markdown syntax
  let text = content
    .replace(/^#+\s/gm, '')
    .replace(/[*_`~\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  // Truncate to word boundary
  if (text.length > length) {
    text = text.substring(0, length);
    text = text.substring(0, text.lastIndexOf(' ')) + '...';
  }

  return text;
}

export function parseMarkdownHeadings(content: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

    headings.push({ level, text, id });
  }

  return headings;
}

export function extractMarkdownImages(content: string): string[] {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const images: string[] = [];
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  return images;
}

export function readingTimeMinutes(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function sanitizeMarkdown(content: string): string {
  // Remove dangerous HTML/scripts
  return content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export interface BlogSEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  image: string;
  publishedAt: Date;
  updatedAt: Date;
  author: string;
  articleSection: string;
}

export function generateBlogSEOData(post: BlogPost, baseUrl: string): BlogSEOData {
  return {
    title: post.title,
    description: post.description || post.excerpt || generateBlogExcerpt(post.content),
    keywords: [post.category, ...post.tags.slice(0, 3)],
    canonical: `${baseUrl}/blog/${post.slug}`,
    image: post.image || `${baseUrl}/default-og.png`,
    publishedAt: post.publishedAt || post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
    articleSection: post.category,
  };
}

export function getAllBlogTags(posts: BlogPost[]): { tag: string; count: number }[] {
  const tagCounts = new Map<string, number>();

  posts.forEach(post => {
    post.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAllBlogCategories(posts: BlogPost[]): { category: string; count: number }[] {
  const categoryCounts = new Map<string, number>();

  posts.forEach(post => {
    const category = post.category;
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  return Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getRelatedPosts(
  currentPost: BlogPost,
  allPosts: BlogPost[],
  limit: number = 3
): BlogPost[] {
  const scored = allPosts
    .filter(post => post.id !== currentPost.id && post.published)
    .map(post => {
      let score = 0;

      // Same category
      if (post.category === currentPost.category) score += 10;

      // Shared tags
      const sharedTags = post.tags.filter(tag => currentPost.tags.includes(tag)).length;
      score += sharedTags * 5;

      return { post, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(s => s.post);
}
