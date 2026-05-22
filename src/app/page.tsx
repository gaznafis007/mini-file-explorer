import { FileSystemProvider } from '@/context/FileSystemContext';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Home() {
  return (
    <FileSystemProvider>
      <AppLayout />
    </FileSystemProvider>
  );
}
