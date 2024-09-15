import { Fab } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

const BackToTopButton = () => (
  <Fab 
    color="primary"
    size="small"
    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    style={{ position: 'fixed', bottom: 16, right: 16 }}
  >
    <ArrowUpwardIcon />
  </Fab>
);

export default BackToTopButton;
