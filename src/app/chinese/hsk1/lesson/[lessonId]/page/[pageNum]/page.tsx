import { notFound } from 'next/navigation';
import { loadPage, getContentManifest, getPageNavigation } from '@/services';
import { ReaderLayout } from '@/components/ReaderLayout';

/**
 * Route params
 */
interface PageParams {
  params: Promise<{
    lessonId: string;
    pageNum: string;
  }>;
}

/**
 * Generate static params for all pages at build time.
 */
export async function generateStaticParams() {
  const manifest = await getContentManifest();

  return manifest.map((entry) => ({
    lessonId: entry.lessonId,
    pageNum: entry.pageNum.toString(),
  }));
}

/**
 * Generate metadata for the page.
 */
export async function generateMetadata({ params }: PageParams) {
  const { lessonId, pageNum } = await params;

  return {
    title: `${lessonId}-dars, ${pageNum}-sahifa - HSK 1 - Blim`,
  };
}

/**
 * Lesson page - renders the interactive reading view.
 * Server component that loads data, delegates to client component for interactivity.
 */
export default async function LessonPage({ params }: PageParams) {
  const { lessonId, pageNum } = await params;
  const pageNumInt = parseInt(pageNum, 10);

  // Load page data
  let pageData;
  try {
    pageData = await loadPage(lessonId, pageNumInt);
  } catch (error) {
    console.error('Failed to load page:', error);
    notFound();
  }

  // Get navigation links
  const nav = await getPageNavigation(lessonId, pageNumInt);

  // Use guided flow for lesson 99 (original content prototype)
  const isGuided = lessonId === '99';

  return (
    <ReaderLayout
      page={pageData}
      lessonId={lessonId}
      pageNum={pageNum}
      prevNav={nav.prev}
      nextNav={nav.next}
      bookPath="/chinese/hsk1"
      guided={isGuided}
    />
  );
}
