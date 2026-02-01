import { API_URL } from '@/lib/api';

export default async function sitemap() {
    const baseUrl = 'https://www.seedite.in';

    // Static routes
    const routes = [
        '',
        '/courses',
        '/blogs',
        '/login',
        '/signup',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes (Blogs)
    let blogRoutes = [];
    try {
        const res = await fetch(`${API_URL}/api/blogs`, { cache: 'no-store' });
        if (res.ok) {
            const blogs = await res.json();
            blogRoutes = blogs.map((blog) => ({
                url: `${baseUrl}/blogs/${blog.slug}`,
                lastModified: blog.updatedAt || blog.createdAt || new Date().toISOString(),
                changeFrequency: 'weekly',
                priority: 0.7,
            }));
        }
    } catch (error) {
        if (error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }
        console.log('Failed to generate blog sitemap:', error);
    }

    // Dynamic routes (Courses)
    let courseRoutes = [];
    try {
        const res = await fetch(`${API_URL}/api/courses`, { cache: 'no-store' });
        if (res.ok) {
            const courses = await res.json();
            courseRoutes = courses.map((course) => ({
                url: `${baseUrl}/courses/${course._id}`,
                lastModified: course.updatedAt || course.createdAt || new Date().toISOString(),
                changeFrequency: 'weekly',
                priority: 0.9,
            }));
        }
    } catch (error) {
        if (error.digest === 'DYNAMIC_SERVER_USAGE') {
            throw error;
        }
        console.log('Failed to generate course sitemap:', error);
    }

    return [...routes, ...courseRoutes, ...blogRoutes];
}
