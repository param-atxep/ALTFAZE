import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { generateArticleSchema, generateBreadcrumbSchema, generateJsonLd, generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { parseMarkdownHeadings, readingTimeMinutes, generateBlogExcerpt } from '@/lib/blog';
import Image from 'next/image';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

interface Props {
  params: {
    slug: string;
  };
}

export const revalidate = 86400; // ISR: revalidate daily for blog posts

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blog.findUnique({
    where: { slug: params.slug },
  });

  if (!post || !post.published) {
    return {
      title: 'Blog Post Not Found',
      description: 'This blog post could not be found.',
    };
  }

  const excerpt = post.excerpt || generateBlogExcerpt(post.content);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';

  return generateSEOMetadata({
    title: post.title,
    description: excerpt,
    image: post.image || `${process.env.NEXT_PUBLIC_BASE_URL}/default-og.png`,
    url: `/blog/${post.slug}`,
    type: 'article',
    keywords: [post.category, ...post.tags.slice(0, 3)],
    canonical: `${siteUrl}/blog/${post.slug}`,
  });
}

export async function generateStaticParams() {
  // Pre-render published blog posts
  const posts = await prisma.blog.findMany({
    where: { published: true },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
  });

  return posts.map(post => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blog.findUnique({
    where: { slug: params.slug },
  });

  if (!post || !post.published) {
    notFound();
  }

  // Update view count
  await prisma.blog.update({
    where: { id: post.id },
    data: { views: post.views + 1 },
  });

  const headings = parseMarkdownHeadings(post.content);
  const readingTime = readingTimeMinutes(post.content);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt || generateBlogExcerpt(post.content),
    image: post.featuredImage || post.image || `${siteUrl}/default-og.png`,
    author: post.author,
    publishedAt: (post.publishedAt || post.createdAt).toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    url: canonicalUrl,
  });
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: post.category, url: `${siteUrl}/blog/category/${post.category.toLowerCase()}` },
    { name: post.title, url: canonicalUrl },
  ]);

  // Get related posts
  const relatedPosts = await prisma.blog.findMany({
    where: {
      published: true,
      OR: [
        { category: post.category },
        {
          tags: {
            hasSome: post.tags.slice(0, 2),
          },
        },
      ],
      NOT: { id: post.id },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      image: true,
      publishedAt: true,
      author: true,
    },
    take: 3,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: generateJsonLd([articleSchema, breadcrumbSchema]) }} />
      {/* Back Button */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/blog">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft size={18} />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <article className="mb-12">
          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden mb-8">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{post.title}</h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-slate-600 pb-6 border-b">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{readingTime} min read</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Link href={`/blog/category/${post.category.toLowerCase()}`}>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition cursor-pointer">
                {post.category}
              </span>
            </Link>
            {post.tags.map(tag => (
              <Link key={tag} href={`/blog/tag/${tag.toLowerCase()}`}>
                <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-sm hover:bg-slate-300 transition cursor-pointer">
                  {tag}
                </span>
              </Link>
            ))}
          </div>

          {/* Table of Contents - Only show if there are headings */}
          {headings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-slate-900 mb-3">Table of Contents</h3>
              <ul className="space-y-2">
                {headings.map(heading => (
                  <li
                    key={heading.id}
                    style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
                    className="text-sm"
                  >
                    <Link
                      href={`#${heading.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {heading.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2" {...props} />,
                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
                a: ({ node, href, ...props }) => (
                  <a href={href} className="text-blue-600 hover:underline" {...props} />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono" {...props} />
                  ) : (
                    <code className="block bg-slate-900 text-slate-50 p-4 rounded-lg mb-4 overflow-x-auto" {...props} />
                  ),
                pre: ({ node, ...props }) => <pre className="mb-4" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 space-y-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 space-y-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-slate-700" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-700" {...props} />
                ),
                img: ({ node, src, alt, ...props }) => (
                  <div className="relative w-full h-80 my-6 rounded-lg overflow-hidden">
                    <Image
                      src={src || ''}
                      alt={alt || ''}
                      fill
                      className="object-cover"
                    />
                  </div>
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full border-collapse border border-slate-300" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-slate-300 bg-slate-100 p-2 text-left" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-slate-300 p-2" {...props} />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Author Bio */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
            <h3 className="font-semibold text-slate-900 mb-2">About the Author</h3>
            <p className="text-slate-700">{post.author}</p>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Related Articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map(relatedPost => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition h-full group">
                      {relatedPost.image && (
                        <div className="relative w-full h-40 overflow-hidden">
                          <Image
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover group-hover:scale-105 transition"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition mb-2">
                          {relatedPost.title}
                        </h4>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                          {relatedPost.excerpt || generateBlogExcerpt(relatedPost.excerpt || '', 100)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(relatedPost.publishedAt || new Date()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
