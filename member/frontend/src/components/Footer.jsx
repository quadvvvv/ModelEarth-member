import { Container, Typography } from '@mui/material';

const Footer = () => (
  <Container component="footer" style={{ marginTop: 'auto', padding: '1rem', textAlign: 'center' }}>
    <Typography variant="body2" color="textSecondary">
      © 2024 Model Earth. Built with React & Material UI.
    </Typography>
  </Container>
);

export default Footer;
