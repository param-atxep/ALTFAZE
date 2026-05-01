import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { generateBlogExcerpt } from '@/lib/blog';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface Props {
  searchParams: {
    page?: string;
    category?: string;
    search?: string;
  };
}

export const revalidate = 3600; // ISR: 1 hour for blog listing

export async function generateMetadata(): Promise<Metadata> {
  return generateSEOMetadata({
    title: 'Blog | ALTFaze - Resources & Insights',
    description: 'Read the latest articles, tutorials, and insights about design, development, and freelancing on ALTFaze blog.',
    url: '/blog',
    type: 'article',
    keywords: ['blog', 'articles', 'tutorials', 'insights', 'guides'],
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/blog`,
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const page = parseInt(searchParams.page || '1');
  const category = searchParams.category;
  const search = searchParams.search;
  const limit = 9;
  const skip = (page - 1) * limit;

  // Build where clause
  const whereClause: Record<string, any> = { published: true };
  if (category) whereClause.category = category;
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Fetch posts and total count
  const [posts, total, categories, featuredPost] = await Promise.all([
    prisma.blog.findMany({
      where: whereClause,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        image: true,
        author: true,
        category: true,
        publishedAt: true,
        views: true,
      },
    }),

    prisma.blog.count({ where: whereClause }),

    prisma.blog.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ['category'],
    }),

    prisma.blog.findFirst({
      where: { published: true },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        image: true,
        featuredImage: true,
        author: true,
        category: true,
        publishedAt: true,
        views: true,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const uniqueCategories = Array.from(new Set(categories.map(c => c.category)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">ALTFaze Blog</h1>
          <p className="text-blue-100 text-lg">
            Insights, tutorials, and best practices for designers and developers
          </p>

          {/* Search Bar */}
          <div className="mt-8 relative">
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full md:w-96 px-4 py-3 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              defaultValue={search || ''}
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Post */}
            {featuredPost && page === 1 && (
              <Link href={`/blog/${featuredPost.slug}`}>
                <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition mb-12 group">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image */}
                    {(featuredPost.featuredImage || featuredPost.image) && (
                      <div className="relative h-64 md:h-auto overflow-hidden">
                        <Image
                          src={featuredPost.featuredImage || featuredPost.image || ''}
                          alt={featuredPost.title}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-8 flex flex-col justify-between">
                      <div>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold mb-3">
                          Featured
                        </span>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition">
                          {featuredPost.title}
                        </h2>
                        <p className="text-slate-600 mb-4">{featuredPost.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>{featuredPost.author}</span>
                        <span>
                          {new Date(featuredPost.publishedAt || new Date()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Posts Grid */}
            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  {posts.map(post => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition h-full group">
                        {/* Image */}
                        {post.image && (
                          <div className="relative w-full h-48 overflow-hidden">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-600 uppercase">
                              {post.category}
                            </span>
                            <span className="text-xs text-slate-500">
                              👁️ {post.views} views
                            </span>
                          </div>

                          <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition mb-2">
                            {post.title}
                          </h3>

                          <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                            {post.excerpt || generateBlogExcerpt(post.excerpt || '', 100)}
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-600 pt-4 border-t">
                            <span>{post.author}</span>
                            <span>
                              {new Date(post.publishedAt || new Date()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mb-12">
                    {page > 1 && (
                      <Link href={`/blog?page=${page - 1}${category ? `&category=${category}` : ''}`}>
                        <Button variant="outline">← Previous</Button>
                      </Link>
                    )}

                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = Math.max(1, page - 2) + i;
                      if (pageNum > totalPages) return null;

                      return (
                        <Link
                          key={pageNum}
                          href={`/blog?page=${pageNum}${category ? `&category=${category}` : ''}`}
                        >
                          <Button variant={pageNum === page ? 'default' : 'outline'}>
                            {pageNum}
                          </Button>
                        </Link>
                      );
                    })}

                    {page < totalPages && (
                      <Link href={`/blog?page=${page + 1}${category ? `&category=${category}` : ''}`}>
                        <Button variant="outline">Next →</Button>
                      </Link>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-slate-600 mb-4">No articles found.</p>
                <Link href="/blog">
                  <Button>View all articles</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6 sticky top-4">
              <h3 className="font-semibold text-lg text-slate-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <Link href="/blog">
                  <div
                    className={`px-3 py-2 rounded-lg transition ${
                      !category
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    All Articles
                  </div>
                </Link>
                {uniqueCategories.map(cat => (
                  <Link key={cat} href={`/blog?category=${cat}`}>
                    <div
                      className={`px-3 py-2 rounded-lg transition ${
                        category === cat
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-6 text-white shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Subscribe</h3>
              <p className="text-blue-100 text-sm mb-4">Get the latest articles delivered to your inbox</p>
              <form className="space-y-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-3 py-2 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  type="submit"
                  className="w-full px-3 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
