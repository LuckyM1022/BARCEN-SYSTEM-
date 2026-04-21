import { Button, SvgIcon } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function CensusGlyph(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M4 5h16v2H4zM6 9h12v10H6zM9 12h2v4H9zM13 12h2v4h-2z" />
    </SvgIcon>
  );
}

function CensusDashboardShortcut({ canAccess }) {
  if (canAccess) {
    return (
      <Button
        component={RouterLink}
        to="/census-taker"
        className="admin-shortcut-button"
        aria-label="Open Census Taker page"
        title="Open Census Taker page"
        startIcon={<CensusGlyph fontSize="small" />}
      >
        Open Census Page
      </Button>
    );
  }

  return (
    <Button
      disabled
      className="admin-shortcut-button"
      aria-label="Census Taker page is restricted"
      title="Census Taker page is restricted"
      startIcon={<CensusGlyph fontSize="small" />}
    >
      Census Taker Only
    </Button>
  );
}

export default CensusDashboardShortcut;
