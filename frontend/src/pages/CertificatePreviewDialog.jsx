import { Box, Button, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import stoTomasLogo from '../resources/sto_tomas_logo.jpg';
import stoNinoLogo from '../resources/sto_nino_logo.jpg';
import './CertificatePreviewDialog.css';

function CertificatePreviewDialog({ open, onClose, resident }) {
  if (!resident) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="certificate-print-dialog"
    >
      <DialogContent className="certificate-dialog-content">
        <Box className="certificate-sheet">
          <Box className="certificate-header">
            <img
              className="certificate-header-logo"
              src={stoNinoLogo}
              alt="Barangay Sto. Nino logo"
            />
            <Box className="certificate-header-text">
              <Typography className="certificate-header-line">
                Republic of the Philippines
              </Typography>
              <Typography className="certificate-header-line">
                Province of Pampanga
              </Typography>
              <Typography className="certificate-header-line">
                Municipality of Sto. Tomas
              </Typography>
              <Typography className="certificate-header-line certificate-header-strong">
                BARANGAY STO. NINO
              </Typography>
              <Typography className="certificate-header-line certificate-header-subtitle">
                OFFICE OF THE PUNONG BARANGAY
              </Typography>
            </Box>
            <img
              className="certificate-header-logo"
              src={stoTomasLogo}
              alt="Sto. Tomas logo"
            />
          </Box>

          <Box className="certificate-rule" />

          <Typography className="certificate-title">
            CERTIFICATE OF INDIGENCY
          </Typography>

          <Box className="certificate-body">
            <Typography className="certificate-recipient">
              TO WHOM IT MAY CONCERN:
            </Typography>

            <Typography className="certificate-paragraph">
              This is to certify that <strong>{resident.name}</strong>, of legal age,
              Filipino, and a bona fide resident of <strong>{resident.address}</strong>.
            </Typography>

            <Typography className="certificate-paragraph">
              This is to certify further that the above-named resident belongs to an
              indigent family of this barangay.
            </Typography>

            <Typography className="certificate-paragraph">
              This certification is issued upon the request of the above-named
              person for whatever legal purpose it may serve.
            </Typography>

            <Typography className="certificate-paragraph">
              Given this ____ day of __________ 20____ at Barangay Sto. Nino,
              Sto. Tomas, Pampanga, Philippines.
            </Typography>
          </Box>

          <Box className="certificate-signatures">
            <Box className="certificate-signature-block">
              <Typography className="certificate-signature-line">
                ______________________________
              </Typography>
              <Typography className="certificate-signature-name">
                Resident Signature over Printed Name
              </Typography>
            </Box>

            <Box className="certificate-signature-block certificate-signature-right">
              <Typography className="certificate-signature-line">
                ______________________________
              </Typography>
              <Typography className="certificate-signature-name">
                Punong Barangay
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={handlePrint}>
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CertificatePreviewDialog;
