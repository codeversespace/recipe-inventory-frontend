import { Alert, Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError("");
    try {
      await login(username, password);
    } catch (requestError: any) {
      setError(requestError.response?.data?.detail || "Invalid username or password.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, bgcolor: "background.default" }}>
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>Recipe-Inventory</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Sign in to continue.</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth margin="dense" label="Username" value={username} onChange={(event) => setUsername(event.target.value)} />
          <TextField fullWidth margin="dense" label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} />
          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={submit} disabled={pending || !username || !password}>{pending ? "Signing in..." : "Sign in"}</Button>
        </CardContent>
      </Card>
    </Box>
  );
};
