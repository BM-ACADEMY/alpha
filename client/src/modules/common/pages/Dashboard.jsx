import { Box, Heading } from '@chakra-ui/react';

function DashboardContent({ role }) {
  return (
    <Box>
      <Heading>Welcome to {role} Dashboard</Heading>
      <Box mt={4}>This is the main content area for the {role} dashboard.</Box>
    </Box>
  );
}

export default DashboardContent;