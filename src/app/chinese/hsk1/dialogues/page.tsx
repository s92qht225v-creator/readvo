import { loadDialoguesForBook } from '@/services';
import { DialoguesPage } from '@/components/DialoguesPage';

export default async function HSK1DialoguesPage() {
  const dialogues = await loadDialoguesForBook('hsk1');

  return (
    <DialoguesPage
      dialogues={dialogues}
      bookPath="/chinese/hsk1"
      languagePath="/chinese?tab=stories"
    />
  );
}
