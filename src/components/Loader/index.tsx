import { LoadingOverlay } from '@mantine/core';

/** Covers its nearest positioned parent while `loading` is true. */
const Loader = ({ loading }: { loading: boolean; className?: string }) => (
  <LoadingOverlay visible={!!loading} zIndex={50} overlayProps={{ blur: 1 }} />
);

export default Loader;
