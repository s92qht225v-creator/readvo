import { notFound } from 'next/navigation';
import { loadEnglishPage, getEnglishContentManifest, getEnglishPageNavigation } from '@/services/english-content';
import { ReaderLayout } from '@/components/ReaderLayout';

interface PageParams {
  params: Promise<{
    unitId: string;
    pageNum: string;
  }>;
}

export async function generateStaticParams() {
  const manifest = await getEnglishContentManifest('destination-b1');

  return manifest.map((entry) => ({
    unitId: entry.lessonId,
    pageNum: entry.pageNum.toString(),
  }));
}

export async function generateMetadata({ params }: PageParams) {
  const { unitId, pageNum } = await params;

  return {
    title: `Unit ${unitId}, Page ${pageNum} - Destination B1 - Blim`,
  };
}

export default async function EnglishUnitPage({ params }: PageParams) {
  const { unitId, pageNum } = await params;
  const pageNumInt = parseInt(pageNum, 10);

  let pageData;
  try {
    pageData = await loadEnglishPage('destination-b1', unitId, pageNumInt);
  } catch (error) {
    console.error('Failed to load English page:', error);
    notFound();
  }

  const nav = await getEnglishPageNavigation('destination-b1', unitId, pageNumInt);

  return (
    <ReaderLayout
      page={pageData}
      lessonId={unitId}
      pageNum={pageNum}
      prevNav={nav.prev}
      nextNav={nav.next}
      bookPath="/english/destination-b1"
      hidePinyin
      navSegment="unit"
    />
  );
}
