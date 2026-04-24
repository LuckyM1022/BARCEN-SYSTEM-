const demoUsers = [
  {
    name: 'Andrea Reyes',
    email: 'andrea.reyes@barcen.local',
    password: 'admin123',
    phoneNumber: '09170000001',
    role: 'Admin',
  },
  {
    name: 'John Dela Cruz',
    email: 'john.delacruz@barcen.local',
    password: 'validator123',
    phoneNumber: '09170000002',
    role: 'Personnel / Validator',
  },
  {
    name: 'Liza Manalo',
    email: 'liza.manalo@barcen.local',
    password: 'census123',
    phoneNumber: '09170000003',
    role: 'Census Taker',
  },
  {
    name: 'Carlo Tolentino',
    email: 'carlo.tolentino@barcen.local',
    password: 'census123',
    phoneNumber: '09170000004',
    role: 'Census Taker',
  },
];

const demoResidents = [
  {
    name: 'Maria Santos',
    address: '12, Purok 1, Sto. Nino Sapa, Sto. Tomas, Pampanga',
    submittedBy: 'J. Dela Cruz',
  },
  {
    name: 'Jose Mercado',
    address: '45, Purok 3, Sto. Nino Sapa, Sto. Tomas, Pampanga',
    submittedBy: 'A. Reyes',
  },
  {
    name: 'Ana Garcia',
    address: '101, Purok 5, Sto. Nino Sapa, Sto. Tomas, Pampanga',
    submittedBy: 'L. Manalo',
  },
  {
    name: 'Pedro Flores',
    address: '8, Purok 2, Sto. Nino Sapa, Sto. Tomas, Pampanga',
    submittedBy: 'C. Tolentino',
  },
  {
    name: 'Liza Flores',
    address: '8, Purok 2, Sto. Nino Sapa, Sto. Tomas, Pampanga',
    submittedBy: 'C. Tolentino',
  },
];

const demoRoles = [
  {
    name: 'Admin',
    access: 'Full user management, role assignment, and platform oversight.',
    members: 1,
  },
  {
    name: 'Personnel / Validator',
    access: 'Dashboard review, resident verification, and certificate processing.',
    members: 1,
  },
  {
    name: 'Census Taker',
    access: 'Field intake, resident record submission, and household data entry.',
    members: 2,
  },
];

const demoAdminSettings = {
  scope: 'admin',
  emailNotifications: true,
  certificateApproval: true,
  maintenanceMode: false,
};

const demoValidatorSettings = {
  scope: 'validator',
  autoRefresh: true,
  reviewLock: true,
  quickCertificateMode: false,
};

export {
  demoAdminSettings,
  demoResidents,
  demoRoles,
  demoUsers,
  demoValidatorSettings,
};
