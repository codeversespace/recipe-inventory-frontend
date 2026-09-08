import { Alert, Box, Button } from "@mui/material";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

/** Useful error with a retry action where recovery is possible. */
export const ErrorState = ({ message, onRetry, retryLabel = "Retry" }: ErrorStateProps) => (
  <Box sx={{ py: 2 }}>
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  </Box>
);
