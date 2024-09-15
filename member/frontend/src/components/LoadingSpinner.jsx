import { CircularProgress } from '@mui/material';

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
    <CircularProgress />
  </div>
);

export default LoadingSpinner;
